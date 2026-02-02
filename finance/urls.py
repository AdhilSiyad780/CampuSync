from django.urls import path
from .views import (
    # Admin views
    FeeStructureListCreateView,
    FeeStructureDetailView,
    BulkAssignFeesView,
    FeeStudentsView,
    AllParentFeesView,
    FeeStatisticsView,
    WaiveFeeView,
    
    # Parent views
    ParentFeesView,
    ParentFeeDetailView,
    MakePaymentView,
    ParentPaymentHistoryView,
    ParentChildrenView,
    CreateRazorpayOrderView,
    VerifyRazorpayPaymentView,


)

urlpatterns = [
    # ============================================
    # ADMIN FEE ENDPOINTS
    # ============================================
    
    # List/Create fee structures
    path('admin/fee-structures/', FeeStructureListCreateView.as_view(), name='admin-fee-structure-list-create'),
    
    # View/Update/Delete specific fee structure
    path('admin/fee-structures/<int:pk>/', FeeStructureDetailView.as_view(), name='admin-fee-structure-detail'),
    
    # Assign fees to parents of students in classes
    path('admin/fee-structures/<int:fee_structure_id>/assign/', BulkAssignFeesView.as_view(), name='admin-bulk-assign-fees'),
    
    # View parent fees assigned to a fee structure
    path('admin/fee-structures/<int:fee_structure_id>/fees/', FeeStudentsView.as_view(), name='admin-fee-students'),
    
    # View all parent fees
    path('admin/parent-fees/', AllParentFeesView.as_view(), name='admin-all-parent-fees'),
    
    # Get fee statistics
    path('admin/statistics/', FeeStatisticsView.as_view(), name='admin-fee-statistics'),
    
    # Waive a parent's fee
    path('admin/parent-fees/<int:parent_fee_id>/waive/', WaiveFeeView.as_view(), name='admin-waive-fee'),
    
    # ============================================
    # PARENT FEE ENDPOINTS
    # ============================================
    
    # List all fees for parent's children
    path('parent/fees/', ParentFeesView.as_view(), name='parent-fees'),
    
    # View specific fee details
    path('parent/fees/<int:pk>/', ParentFeeDetailView.as_view(), name='parent-fee-detail'),
    
    # Make payment
    path('parent/payments/create/', MakePaymentView.as_view(), name='parent-make-payment'),
    
    # View payment history
    path('parent/payments/', ParentPaymentHistoryView.as_view(), name='parent-payment-history'),
    
    # Get list of parent's children (for filtering)
    path('parent/children/', ParentChildrenView.as_view(), name='parent-children'),

    path('parent/payments/razorpay/create-order/', CreateRazorpayOrderView.as_view(), name='razorpay-create-order'),
    
    path('parent/payments/razorpay/verify/', VerifyRazorpayPaymentView.as_view(), name='razorpay-verify'),

  

]