
from rest_framework import serializers
from .models import SubscriptionPlan, Subscription

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = [
            "id",
            "plan_name",
            "description",
            "duration_days",
            "price",
            "features",
            "max_students",
            "max_teachers",
            "max_admins",
            "is_active",
            "created_at",
            "updated_at",
        ]

class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = '__all__'
