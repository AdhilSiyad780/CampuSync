from django.urls import path
from .views import SubscriptionPlanListView, SubscriptionPlanCreateView

urlpatterns = [
    path("plans/", SubscriptionPlanListView.as_view(), name="plan_list"),
    path("plans/create/", SubscriptionPlanCreateView.as_view(), name="plan_create"),
]
