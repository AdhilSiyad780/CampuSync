from django.urls import path
from .views import (TenantSummaryView,SubscriptionPlanListView,
                     SubscriptionPlanCreateView,SubscriptionPlanUpdateAPIView,
                     RazorpayPaymentVerifyView,CreateRazorpayOrderView
)
urlpatterns = [
    path("plans/", SubscriptionPlanListView.as_view(), name="plan_list"),
    path("plans/create/", SubscriptionPlanCreateView.as_view(), name="plan_create"),
    path("plans/<int:pk>/update/", SubscriptionPlanUpdateAPIView.as_view(), name="plan_update"),
    path("tenant-summary/",TenantSummaryView.as_view(),name='tenent-summary'),

    # Razorpay
    path("create-order/", CreateRazorpayOrderView.as_view(), name="create_razorpay_order"),
    path("verify-payment/", RazorpayPaymentVerifyView.as_view(), name="verify_razorpay_payment"),


]
