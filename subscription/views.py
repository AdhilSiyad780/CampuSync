from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import SubscriptionPlan
from .serializers import SubscriptionPlanSerializer
from .permissions import IsSuperAdminOrAdmin
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import SubscriptionPlan,Subscription
from django.utils import timezone


class SubscriptionPlanListView(generics.ListAPIView):
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [IsAuthenticated, IsSuperAdminOrAdmin]
    def get_queryset(self):
        return SubscriptionPlan.objects.filter(price__gt=0)


class SubscriptionPlanCreateView(generics.CreateAPIView):
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [IsAuthenticated, IsSuperAdminOrAdmin]

class SubscriptionPlanUpdateAPIView(generics.RetrieveUpdateAPIView):
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    
class TenantSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # assume your User model has a ForeignKey to Tenant named "tenant"
        tenant = getattr(user, "tenant", None)
        if not tenant:
            return Response(
                {"detail": "Tenant not found for this user."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # get latest active subscription for this tenant
        current_sub = (
            Subscription.objects.filter(tenant=tenant, is_active=True)
            .order_by("-start_date")   # change to correct field if needed
            .first()
        )

        if current_sub:
            plan = current_sub.plan
            days_left = None

            # adjust to correct expiry field name (I’ll assume expires_at)
            if getattr(current_sub, "expires_at", None):
                delta = current_sub.expires_at - timezone.now()
                days_left = max(delta.days, 0)

            current_plan = {
                "id": plan.id if plan else None,
                "name": getattr(plan, "plan_name", "") if plan else "",
                "is_trial": getattr(current_sub, "is_trial", False),
                "expires_at": getattr(current_sub, "expires_at", None),
                "days_left": days_left,
            }
        else:
            current_plan = None

        # adjust this according to your actual reverse relation
        # e.g. if Tenant -> User is OneToMany with related_name="users"
        counts = {
            "students": tenant.users.filter(user_type="student").count()
            if hasattr(tenant, "users")
            else 0,
            "teachers": tenant.users.filter(user_type="teacher").count()
            if hasattr(tenant, "users")
            else 0,
            "staff": tenant.users.filter(user_type="admin").count()
            if hasattr(tenant, "users")
            else 0,
        }

        data = {
            "current_plan": current_plan,
            "counts": counts,
        }
        return Response(data, status=status.HTTP_200_OK)
    
import razorpay
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import SubscriptionPlan, Subscription
from .serializers import SubscriptionPlanSerializer, CreateRazorpayOrderSerializer,RazorpayPaymentVerifySerializer
from django.utils import timezone
from datetime import timedelta

class CreateRazorpayOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateRazorpayOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        tenant = getattr(user, "tenant", None)

        if not tenant:
            return Response(
                {"detail": "Tenant not found for this user."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        plan_id = serializer.validated_data["plan_id"]
        try:
            plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            return Response(
                {"detail": "Plan not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Razorpay amount is in paise (INR)
        amount_paise = int(plan.price * 100)

        client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )

        # You can store a reference (e.g. tenant_id-plan_id)
        receipt = f"tenant_{tenant.id}_plan_{plan.id}_{int(timezone.now().timestamp())}"

        try:
            order = client.order.create(
                {
                    "amount": amount_paise,
                    "currency": "INR",
                    "receipt": receipt,
                    "payment_capture": 1,  # auto-capture
                }
            )
        except Exception as e:
            print("RAZORPAY ORDER ERROR:", e)
            return Response(
                {"detail": "Failed to create Razorpay order."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Option A: create a pending Subscription or keep everything in webhooks.
        # For now, we won't create Subscription until payment success callback.

        return Response(
            {
                "order_id": order["id"],
                "amount": order["amount"],  # paise
                "currency": order["currency"],
                "razorpay_key_id": settings.RAZORPAY_KEY_ID,
                "plan": {
                    "id": plan.id,
                    "name": plan.plan_name,
                    "price": str(plan.price),
                    "duration_days": plan.duration_days,
                },
                "tenant": {
                    "id": tenant.id,
                    "tenant_id": tenant.tenant_id,
                    "instance_name": tenant.instance_name,
                },
            },
            status=status.HTTP_200_OK,
        )


class RazorpayPaymentVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RazorpayPaymentVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        tenant = getattr(user, "tenant", None)

        if not tenant:
            return Response(
                {"detail": "Tenant not found for this user."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment_id = serializer.validated_data["razorpay_payment_id"]
        order_id = serializer.validated_data["razorpay_order_id"]
        signature = serializer.validated_data["razorpay_signature"]
        plan_id = serializer.validated_data["plan_id"]

        plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)

        client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )

        # Verify signature
        try:
            client.utility.verify_payment_signature(
                {
                    "razorpay_order_id": order_id,
                    "razorpay_payment_id": payment_id,
                    "razorpay_signature": signature,
                }
            )
        except razorpay.errors.SignatureVerificationError:
            return Response(
                {"detail": "Payment verification failed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Signature OK -> create or update subscription
        now = timezone.now()
        expiry = now + timedelta(days=plan.duration_days)

        # Deactivate old active subs
        Subscription.objects.filter(tenant=tenant, is_active=True).update(is_active=False)

        sub = Subscription.objects.create(
          tenant=tenant,
          plan=plan,
          start_date=now,
          expiry_date=expiry,
          next_billing_date=None,  # or expiry, or your billing logic
          status="active",
          is_active=True,
        )

        return Response(
            {
                "detail": "Payment verified and subscription activated.",
                "subscription": {
                    "id": sub.id,
                    "plan_name": plan.plan_name,
                    "start_date": sub.start_date,
                    "expiry_date": sub.expiry_date,
                    "status": sub.status,
                },
            },
            status=status.HTTP_200_OK,
        )
