
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


class CreateRazorpayOrderSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField()

    def validate_plan_id(self, value):
        try:
            plan = SubscriptionPlan.objects.get(id=value, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            raise serializers.ValidationError("Invalid or inactive plan.")
        return value
    
class RazorpayPaymentVerifySerializer(serializers.Serializer):
    razorpay_order_id = serializers.CharField()
    razorpay_payment_id = serializers.CharField()
    razorpay_signature = serializers.CharField()
    plan_id = serializers.IntegerField()

    def validate_plan_id(self, value):
        try:
            plan = SubscriptionPlan.objects.get(id=value, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            raise serializers.ValidationError("Invalid plan.")
        return value
