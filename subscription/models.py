from django.db import models
from core.models import Tenant
# Create your models here.
class SubscriptionPlan(models.Model):
    PLAN_CHOICES = [
        ("trial", "20-Day Trial"),
        ("monthly", "Monthly Plan"),
        ("half_yearly", "6-Month Plan"),
        ("yearly", "Yearly Plan"),
    ]
    plan_name = models.CharField(max_length=50, choices=PLAN_CHOICES)
    description = models.TextField(blank=True)
    duration_days = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    features = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.plan_name
    

class Subscription(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("expired", "Expired"),
        ("cancelled", "Cancelled"),
        ("trial", "Trial"),
    ]

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE)
    start_date = models.DateTimeField()
    expiry_date = models.DateTimeField()
    next_billing_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.tenant} - {self.plan.plan_name}"