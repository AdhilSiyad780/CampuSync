from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import SubscriptionPlan
from .serializers import SubscriptionPlanSerializer
from .permissions import IsSuperAdmin

class SubscriptionPlanListView(generics.ListAPIView):
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]


class SubscriptionPlanCreateView(generics.CreateAPIView):
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]
