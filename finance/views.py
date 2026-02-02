from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q, Sum
import razorpay
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
import hmac
import hashlib




from .models import FeeStructure, ParentFee, FeePayment
from .serializers import (
    FeeStructureSerializer,
    ParentFeeSerializer,
    ParentFeeListSerializer,
    FeePaymentSerializer,
    PaymentCreateSerializer
)
from core.permission import IsParent
from rest_framework.permissions import IsAdminUser


razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


# ============================================
# ADMIN FEE VIEWS
# ============================================

class FeeStructureListCreateView(generics.ListCreateAPIView):
    """
    GET: List all fee structures
    POST: Create new fee structure (admin only)
    """
    serializer_class = FeeStructureSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        user = self.request.user
        queryset = FeeStructure.objects.filter(
            tenant=user.tenant
        ).prefetch_related('classes', 'parent_fees')
        
        # Filters
        academic_year = self.request.query_params.get('academic_year')
        is_active = self.request.query_params.get('is_active')
        fee_type = self.request.query_params.get('fee_type')
        
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        if fee_type:
            queryset = queryset.filter(fee_type=fee_type)
        
        return queryset.order_by('-created_at')


class FeeStructureDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: View fee structure details
    PUT/PATCH: Update fee structure
    DELETE: Delete fee structure
    """
    serializer_class = FeeStructureSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        return FeeStructure.objects.filter(tenant=self.request.user.tenant)


class BulkAssignFeesView(APIView):
    """
    POST: Assign fee structure to all students in selected classes
    Creates ParentFee for each parent-student relationship
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request, fee_structure_id):
        try:
            fee_structure = FeeStructure.objects.get(
                id=fee_structure_id,
                tenant=request.user.tenant
            )
        except FeeStructure.DoesNotExist:
            return Response(
                {"error": "Fee structure not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get all students from the fee structure's classes
        from members.models import StudentProfile, ParentStudentRelation
        
        students = StudentProfile.objects.filter(
            school_class__in=fee_structure.classes.all(),
            tenant=request.user.tenant
        ).distinct()
        
        created_count = 0
        skipped_count = 0
        
        for student in students:
            # Get primary parent or any parent for this student
            parent_relation = ParentStudentRelation.objects.filter(
                student=student
            ).select_related('parent').first()
            
            if not parent_relation:
                skipped_count += 1
                continue
            
            parent_user = parent_relation.parent.user
            
            # Calculate late fee if applicable
            late_fee = 0
            if fee_structure.late_fee_applicable:
                days_overdue = (timezone.now().date() - fee_structure.due_date).days
                if days_overdue > fee_structure.late_fee_days:
                    late_fee = fee_structure.late_fee_amount
            
            _, created = ParentFee.objects.get_or_create(
                fee_structure=fee_structure,
                parent=parent_user,
                student=student,
                defaults={
                    'total_amount': fee_structure.amount,
                    'late_fee_amount': late_fee,
                    'status': 'pending'
                }
            )
            if created:
                created_count += 1
        
        return Response({
            "message": f"Assigned fees to {created_count} parent-student pairs",
            "created": created_count,
            "skipped": skipped_count,
            "total_students": students.count()
        })


class FeeStudentsView(generics.ListAPIView):
    """
    GET: List all parent fees for a fee structure
    """
    serializer_class = ParentFeeListSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        fee_structure_id = self.kwargs.get('fee_structure_id')
        user = self.request.user
        
        queryset = ParentFee.objects.filter(
            fee_structure_id=fee_structure_id,
            fee_structure__tenant=user.tenant
        ).select_related('parent', 'student', 'student__user', 'fee_structure')
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('student__roll_number')


class AllParentFeesView(generics.ListAPIView):
    """
    GET: List all parent fees across all fee structures (for admin dashboard)
    """
    serializer_class = ParentFeeListSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        user = self.request.user
        
        queryset = ParentFee.objects.filter(
            fee_structure__tenant=user.tenant
        ).select_related('parent', 'student', 'student__user', 'student__school_class', 'fee_structure')
        
        # Filters
        status_filter = self.request.query_params.get('status')
        class_id = self.request.query_params.get('class')
        parent_id = self.request.query_params.get('parent')
        student_id = self.request.query_params.get('student')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if class_id:
            queryset = queryset.filter(student__school_class_id=class_id)
        if parent_id:
            queryset = queryset.filter(parent_id=parent_id)
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        return queryset.order_by('-created_at')


class FeeStatisticsView(APIView):
    """
    GET: Get fee collection statistics
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        user = request.user
        
        # Get all parent fees
        all_fees = ParentFee.objects.filter(
            fee_structure__tenant=user.tenant
        )
        
        # Calculate statistics
        total_fees = all_fees.count()
        paid_fees = all_fees.filter(status='paid').count()
        pending_fees = all_fees.filter(status__in=['pending', 'partial']).count()
        overdue_fees = all_fees.filter(status='overdue').count()
        
        # Amount statistics
        total_amount = all_fees.aggregate(total=Sum('total_amount'))['total'] or 0
        collected_amount = all_fees.aggregate(total=Sum('paid_amount'))['total'] or 0
        pending_amount = float(total_amount) - float(collected_amount)
        
        return Response({
            'total_fees': total_fees,
            'paid_fees': paid_fees,
            'pending_fees': pending_fees,
            'overdue_fees': overdue_fees,
            'total_amount': float(total_amount),
            'collected_amount': float(collected_amount),
            'pending_amount': pending_amount,
            'collection_percentage': round((float(collected_amount) / float(total_amount) * 100), 2) if total_amount > 0 else 0
        })


class WaiveFeeView(APIView):
    """
    POST: Waive a parent's fee (admin only)
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request, parent_fee_id):
        try:
            parent_fee = ParentFee.objects.get(
                id=parent_fee_id,
                fee_structure__tenant=request.user.tenant
            )
        except ParentFee.DoesNotExist:
            return Response(
                {"error": "Parent fee not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        waiver_reason = request.data.get('waiver_reason', '')
        
        if not waiver_reason:
            return Response(
                {"error": "Waiver reason is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        parent_fee.is_waived = True
        parent_fee.waiver_reason = waiver_reason
        parent_fee.waived_by = request.user
        parent_fee.waived_at = timezone.now()
        parent_fee.status = 'waived'
        parent_fee.save()
        
        serializer = ParentFeeSerializer(parent_fee)
        return Response(serializer.data)


# ============================================
# PARENT FEE VIEWS
# ============================================

class ParentFeesView(generics.ListAPIView):
    """
    GET: List all fees for logged-in parent's children
    """
    serializer_class = ParentFeeSerializer
    permission_classes = [IsParent]
    
    def get_queryset(self):
        user = self.request.user
        
        # Get all fees assigned to this parent
        queryset = ParentFee.objects.filter(
            parent=user
        ).select_related(
            'fee_structure', 
            'student', 
            'student__user', 
            'student__school_class'
        ).prefetch_related('payments')
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by student
        student_id = self.request.query_params.get('student')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        return queryset.order_by('-created_at')


class ParentFeeDetailView(generics.RetrieveAPIView):
    """
    GET: View fee details with payment history
    """
    serializer_class = ParentFeeSerializer
    permission_classes = [IsParent]
    
    def get_queryset(self):
        return ParentFee.objects.filter(parent=self.request.user)


class MakePaymentView(APIView):
    """
    POST: Make a payment for a fee
    """
    permission_classes = [IsParent]
    
    def post(self, request):
        serializer = PaymentCreateSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            payment = serializer.save()
            return Response(
                FeePaymentSerializer(payment).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ParentPaymentHistoryView(generics.ListAPIView):
    """
    GET: List all payments made by parent
    """
    serializer_class = FeePaymentSerializer
    permission_classes = [IsParent]
    
    def get_queryset(self):
        return FeePayment.objects.filter(
            paid_by=self.request.user,
            payment_status='success'
        ).select_related(
            'parent_fee', 
            'parent_fee__student', 
            'parent_fee__student__user',
            'parent_fee__fee_structure'
        ).order_by('-payment_date')


class ParentChildrenView(APIView):
    """
    GET: Get list of parent's children for filtering
    """

    permission_classes = [IsParent]

    def get(self, request):
        from members.models import ParentStudentRelation
        
        try:
            parent_profile = request.user.parent_profile
            relations = ParentStudentRelation.objects.filter(
                parent=parent_profile
            ).select_related('student', 'student__user', 'student__school_class')
            
            children = []
            for relation in relations:
                children.append({
                    'id': relation.student.id,
                    'name': relation.student.user.fullname,
                    'roll_number': relation.student.roll_number,
                    'admission_number': relation.student.admission_number,
                    'class': f"{relation.student.school_class.class_name} {relation.student.school_class.division}" if relation.student.school_class else "N/A",
                    'relation_type': relation.relation_type
                })
            
            return Response(children)
        except Exception as e:
            return Response(
                {"error": "Failed to fetch children"},
                status=status.HTTP_400_BAD_REQUEST
            )
        


class CreateRazorpayOrderView(APIView):
    """
    POST: Create a Razorpay order for payment
    """
    permission_classes = [IsParent]
    
    def post(self, request):
        parent_fee_id = request.data.get('parent_fee_id')
        amount = request.data.get('amount')
        
        if not parent_fee_id or not amount:
            return Response(
                {"error": "parent_fee_id and amount are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            parent_fee = ParentFee.objects.get(id=parent_fee_id, parent=request.user)
        except ParentFee.DoesNotExist:
            return Response(
                {"error": "Parent fee not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validate amount
        amount_decimal = float(amount)
        if amount_decimal <= 0:
            return Response(
                {"error": "Amount must be greater than 0"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if amount_decimal > float(parent_fee.remaining_amount):
            return Response(
                {"error": f"Amount exceeds remaining balance of ₹{parent_fee.remaining_amount}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convert amount to paise (Razorpay accepts amount in smallest currency unit)
        amount_in_paise = int(amount_decimal * 100)
        
        try:
            # Create Razorpay order
            razorpay_order = razorpay_client.order.create({
                'amount': amount_in_paise,
                'currency': 'INR',
                'payment_capture': 1,  # Auto capture
                'notes': {
                    'parent_fee_id': parent_fee_id,
                    'student_name': parent_fee.student.user.fullname,
                    'fee_name': parent_fee.fee_structure.name,
                }
            })
            
            return Response({
                'order_id': razorpay_order['id'],
                'amount': amount_in_paise,
                'currency': 'INR',
                'key_id': settings.RAZORPAY_KEY_ID,
                'parent_fee_id': parent_fee_id,
                'student_name': parent_fee.student.user.fullname,
                'parent_name': request.user.fullname,
                'parent_email': request.user.email,
                'parent_contact': request.user.phone if hasattr(request.user, 'phone') else '',
            })
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VerifyRazorpayPaymentView(APIView):
    """
    POST: Verify Razorpay payment and create payment record
    """
    permission_classes = [IsParent]
    
    def post(self, request):
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')
        parent_fee_id = request.data.get('parent_fee_id')
        amount = request.data.get('amount')
        notes = request.data.get('notes', '')
        
        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature, parent_fee_id, amount]):
            return Response(
                {"error": "Missing required payment details"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            parent_fee = ParentFee.objects.get(id=parent_fee_id, parent=request.user)
        except ParentFee.DoesNotExist:
            return Response(
                {"error": "Parent fee not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify signature
        try:
            # Create signature
            generated_signature = hmac.new(
                settings.RAZORPAY_KEY_SECRET.encode(),
                f"{razorpay_order_id}|{razorpay_payment_id}".encode(),
                hashlib.sha256
            ).hexdigest()
            
            if generated_signature != razorpay_signature:
                return Response(
                    {"error": "Payment verification failed"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Fetch payment details from Razorpay
            payment_details = razorpay_client.payment.fetch(razorpay_payment_id)
            
            # Create payment record
            payment = FeePayment.objects.create(
                parent_fee=parent_fee,
                amount=float(amount),
                payment_method='online',
                transaction_id=razorpay_payment_id,
                payment_status='success',
                paid_by=request.user,
                notes=notes,
                gateway_response=payment_details
            )
            
            # Update parent fee
            from decimal import Decimal
            parent_fee.paid_amount += Decimal(str(amount))
            
            if parent_fee.paid_amount >= parent_fee.total_amount:
                parent_fee.status = 'paid'
            elif parent_fee.paid_amount > 0:
                parent_fee.status = 'partial'
            
            parent_fee.save()
            
            return Response(
                FeePaymentSerializer(payment).data,
                status=status.HTTP_201_CREATED
            )
            
        except razorpay.errors.SignatureVerificationError:
            print("Payment signature verification failed,=================================")
            return Response(
                {"error": "Payment signature verification failed"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            print(e,'===========================================')
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
