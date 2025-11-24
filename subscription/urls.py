from django.urls import path
from .views import SubscriptionPlanListView, SubscriptionPlanCreateView,SubscriptionPlanUpdateAPIView

urlpatterns = [
    path("plans/", SubscriptionPlanListView.as_view(), name="plan_list"),
    path("plans/create/", SubscriptionPlanCreateView.as_view(), name="plan_create"),
    path("plans/<int:pk>/update/", SubscriptionPlanUpdateAPIView.as_view(), name="plan_update"),

]
