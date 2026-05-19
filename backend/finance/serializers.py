from rest_framework import serializers
from django.utils import timezone
from .models import FeeStructure, ParentFee, FeePayment
import uuid


class FeeStructureSerializer(serializers.ModelSerializer):
    class_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    classes_details = serializers.SerializerMethodField(read_only=True)
    created_by_name = serializers.CharField(source='created_by.fullname', read_only=True)
    
    # Statistics
    total_students = serializers.SerializerMethodField(read_only=True)
    paid_count = serializers.SerializerMethodField(read_only=True)
    pending_count = serializers.SerializerMethodField(read_only=True)
    total_collected = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = FeeStructure
        fields = [
            'id',
            'name',
            'description',
            'fee_type',
            'amount',
            'class_ids',
            'classes_details',
            'academic_year',
            'frequency',
            'due_date',
            'late_fee_applicable',
            'late_fee_amount',
            'late_fee_days',
            'is_active',
            'created_by',
            'created_by_name',
            'total_students',
            'paid_count',
            'pending_count',
            'total_collected',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_classes_details(self, obj):
        return [
            {
                'id': cls.id,
                'class_name': cls.class_name,
                'division': cls.division,
            }
            for cls in obj.classes.all()
        ]
    
    def get_total_students(self, obj):
        return obj.parent_fees.count()
    
    def get_paid_count(self, obj):
        return obj.parent_fees.filter(status='paid').count()
    
    def get_pending_count(self, obj):
        return obj.parent_fees.filter(status__in=['pending', 'partial', 'overdue']).count()
    
    def get_total_collected(self, obj):
        from django.db.models import Sum
        total = obj.parent_fees.aggregate(total=Sum('paid_amount'))['total']
        return float(total) if total else 0
    
    def create(self, validated_data):
        class_ids = validated_data.pop('class_ids', [])
        request = self.context.get('request')
        
        fee_structure = FeeStructure.objects.create(
            tenant=request.user.tenant,
            created_by=request.user,
            **validated_data
        )
        
        if class_ids:
            from class_announcement_attendence.models import SchoolClass
            classes = SchoolClass.objects.filter(id__in=class_ids, tenant=request.user.tenant)
            fee_structure.classes.set(classes)
        
        return fee_structure
    
    def update(self, instance, validated_data):
        class_ids = validated_data.pop('class_ids', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if class_ids is not None:
            from class_announcement_attendence.models import SchoolClass
            classes = SchoolClass.objects.filter(id__in=class_ids, tenant=instance.tenant)
            instance.classes.set(classes)
        
        return instance


class FeePaymentSerializer(serializers.ModelSerializer):
    paid_by_name = serializers.CharField(source='paid_by.fullname', read_only=True)
    received_by_name = serializers.CharField(source='received_by.fullname', read_only=True)
    student_name = serializers.CharField(source='parent_fee.student.user.fullname', read_only=True)
    fee_name = serializers.CharField(source='parent_fee.fee_structure.name', read_only=True)
    
    class Meta:
        model = FeePayment
        fields = [
            'id',
            'parent_fee',
            'amount',
            'payment_method',
            'payment_status',
            'transaction_id',
            'receipt_number',
            'paid_by',
            'paid_by_name',
            'received_by',
            'received_by_name',
            'student_name',
            'fee_name',
            'payment_date',
            'notes',
            'created_at',
        ]
        read_only_fields = ['id', 'transaction_id', 'paid_by', 'payment_date', 'created_at']


class ParentFeeSerializer(serializers.ModelSerializer):
    fee_name = serializers.CharField(source='fee_structure.name', read_only=True)
    fee_type = serializers.CharField(source='fee_structure.fee_type', read_only=True)
    due_date = serializers.DateField(source='fee_structure.due_date', read_only=True)
    
    parent_name = serializers.CharField(source='parent.fullname', read_only=True)
    parent_email = serializers.CharField(source='parent.email', read_only=True)
    
    student_name = serializers.CharField(source='student.user.fullname', read_only=True)
    student_roll = serializers.IntegerField(source='student.roll_number', read_only=True)
    student_class = serializers.SerializerMethodField(read_only=True)
    student_admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    
    remaining_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    
    # Payment history
    payments = FeePaymentSerializer(many=True, read_only=True)
    
    class Meta:
        model = ParentFee
        fields = [
            'id',
            'fee_structure',
            'fee_name',
            'fee_type',
            'due_date',
            'parent',
            'parent_name',
            'parent_email',
            'student',
            'student_name',
            'student_roll',
            'student_class',
            'student_admission_number',
            'total_amount',
            'paid_amount',
            'discount_amount',
            'late_fee_amount',
            'remaining_amount',
            'status',
            'is_overdue',
            'is_waived',
            'waiver_reason',
            'payments',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'parent', 'student', 'created_at', 'updated_at']
    
    def get_student_class(self, obj):
        if obj.student.school_class:
            return f"{obj.student.school_class.class_name} {obj.student.school_class.division}"
        return "N/A"


class ParentFeeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing fees"""
    fee_name = serializers.CharField(source='fee_structure.name', read_only=True)
    due_date = serializers.DateField(source='fee_structure.due_date', read_only=True)
    parent_name = serializers.CharField(source='parent.fullname', read_only=True)
    student_name = serializers.CharField(source='student.user.fullname', read_only=True)
    student_roll = serializers.IntegerField(source='student.roll_number', read_only=True)
    remaining_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = ParentFee
        fields = [
            'id',
            'fee_structure',
            'fee_name',
            'due_date',
            'parent',
            'parent_name',
            'student',
            'student_name',
            'student_roll',
            'total_amount',
            'paid_amount',
            'remaining_amount',
            'status',
            'is_overdue',
        ]


class PaymentCreateSerializer(serializers.Serializer):
    """Serializer for creating a payment"""
    parent_fee_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_method = serializers.ChoiceField(choices=FeePayment.PAYMENT_METHOD_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return value
    
    def create(self, validated_data):
        parent_fee_id = validated_data['parent_fee_id']
        amount = validated_data['amount']
        payment_method = validated_data['payment_method']
        notes = validated_data.get('notes', '')
        
        request = self.context.get('request')
        
        try:
            parent_fee = ParentFee.objects.get(id=parent_fee_id)
        except ParentFee.DoesNotExist:
            raise serializers.ValidationError("Parent fee not found")
        
        # Verify that the fee belongs to the logged-in parent
        if parent_fee.parent != request.user:
            raise serializers.ValidationError("Unauthorized access to this fee")
        
        # Check if amount exceeds remaining amount
        if amount > parent_fee.remaining_amount:
            raise serializers.ValidationError(
                f"Amount exceeds remaining balance of ₹{parent_fee.remaining_amount}"
            )
        
        # Generate transaction ID
        transaction_id = f"TXN{uuid.uuid4().hex[:12].upper()}"
        
        # Create payment
        payment = FeePayment.objects.create(
            parent_fee=parent_fee,
            amount=amount,
            payment_method=payment_method,
            transaction_id=transaction_id,
            payment_status='success',
            paid_by=request.user,
            notes=notes
        )
        
        # Update parent fee
        parent_fee.paid_amount += amount
        
        # Update status
        if parent_fee.paid_amount >= parent_fee.total_amount:
            parent_fee.status = 'paid'
        elif parent_fee.paid_amount > 0:
            parent_fee.status = 'partial'
        
        parent_fee.save()
        
        return payment