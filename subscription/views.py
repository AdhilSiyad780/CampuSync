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