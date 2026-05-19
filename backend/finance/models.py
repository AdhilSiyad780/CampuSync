from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from class_announcement_attendence.models import SchoolClass


class FeeStructure(models.Model):
    """
    Admin creates fee structures (e.g., Tuition Fee, Library Fee, Sports Fee)
    """
    FEE_TYPE_CHOICES = [
        ('tuition', 'Tuition Fee'),
        ('library', 'Library Fee'),
        ('sports', 'Sports Fee'),
        ('transport', 'Transport Fee'),
        ('exam', 'Examination Fee'),
        ('lab', 'Laboratory Fee'),
        ('activity', 'Activity Fee'),
        ('other', 'Other Fee'),
    ]
    
    FREQUENCY_CHOICES = [
        ('one_time', 'One Time'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('half_yearly', 'Half Yearly'),
        ('annual', 'Annual'),
    ]
    
    tenant = models.ForeignKey('core.Tenant', on_delete=models.CASCADE)
    
    # Fee details
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    fee_type = models.CharField(max_length=20, choices=FEE_TYPE_CHOICES, default='other')
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    
    # Applicability
    classes = models.ManyToManyField(SchoolClass, related_name='fee_structures', blank=True)
    academic_year = models.CharField(max_length=20)  # e.g., "2024-2025"
    
    # Frequency and due date
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='one_time')
    due_date = models.DateField()
    
    # Late fee
    late_fee_applicable = models.BooleanField(default=False)
    late_fee_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        default=0
    )
    late_fee_days = models.IntegerField(default=0)  # Days after due date
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_fee_structures'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'fee_structures'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'academic_year']),
            models.Index(fields=['due_date', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.academic_year} (₹{self.amount})"


class ParentFee(models.Model):
    """
    Fee assigned to a parent for their child's education
    Parent is responsible for payment
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('partial', 'Partially Paid'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('waived', 'Waived'),
    ]
    
    fee_structure = models.ForeignKey(FeeStructure, on_delete=models.CASCADE, related_name='parent_fees')
    
    # Parent who will pay
    parent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='fees_to_pay',
        limit_choices_to={'user_type': 'parent'}
    )
    
    # Student for whom the fee is (via StudentProfile)
    student = models.ForeignKey(
        'members.StudentProfile',
        on_delete=models.CASCADE,
        related_name='fees'
    )
    
    # Amount details
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    late_fee_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Waiver (if applicable)
    is_waived = models.BooleanField(default=False)
    waiver_reason = models.TextField(blank=True)
    waived_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='waived_fees'
    )
    waived_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'parent_fees'
        ordering = ['-created_at']
        unique_together = ('fee_structure', 'parent', 'student')
        indexes = [
            models.Index(fields=['parent', 'status']),
            models.Index(fields=['student', 'status']),
            models.Index(fields=['fee_structure', 'status']),
        ]
    
    def __str__(self):
        return f"{self.parent.fullname} - {self.student.user.fullname} - {self.fee_structure.name}"
    
    @property
    def remaining_amount(self):
        """Calculate remaining amount to be paid"""
        return self.total_amount - self.paid_amount - self.discount_amount
    
    @property
    def is_overdue(self):
        """Check if fee is overdue"""
        from django.utils import timezone
        if self.status == 'paid':
            return False
        return timezone.now().date() > self.fee_structure.due_date


class FeePayment(models.Model):
    """
    Payment transaction for a parent fee
    """
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('upi', 'UPI'),
        ('net_banking', 'Net Banking'),
        ('cheque', 'Cheque'),
        ('online', 'Online Gateway'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    parent_fee = models.ForeignKey(ParentFee, on_delete=models.CASCADE, related_name='payments')
    
    # Payment details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='online')
    payment_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Transaction details
    transaction_id = models.CharField(max_length=255, unique=True)
    receipt_number = models.CharField(max_length=100, blank=True)
    
    # Payment gateway response (if online)
    gateway_response = models.JSONField(blank=True, null=True)
    
    # Metadata
    paid_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='fee_payments'
    )
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='received_payments'
    )
    
    payment_date = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Notes
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'fee_payments'
        ordering = ['-payment_date']
        indexes = [
            models.Index(fields=['parent_fee', 'payment_status']),
            models.Index(fields=['transaction_id']),
            models.Index(fields=['payment_date']),
        ]
    
    def __str__(self):
        return f"Payment {self.transaction_id} - ₹{self.amount}"