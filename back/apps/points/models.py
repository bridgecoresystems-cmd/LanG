from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class Wallet(models.Model):
    """
    Wallet for storing Gems balance for any user role.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wallet",
        verbose_name=_("User"),
    )
    balance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name=_("Balance"),
    )
    weekly_limit = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name=_("Weekly Distribution Limit"),
        help_text=_("How many Gems this user can distribute per week (for staff)"),
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Wallet")
        verbose_name_plural = _("Wallets")

    def __str__(self):
        return f"Wallet: {self.user.username} ({self.balance} Gems)"

class Transaction(models.Model):
    """
    Records every Gem movement in the system.
    """
    class TransactionType(models.TextChoices):
        TRANSFER = "transfer", _("Transfer (Staff to Staff)")
        AWARD = "award", _("Award (Staff to Student)")
        PURCHASE = "purchase", _("Purchase (Student to Vendor)")
        REFUND = "refund", _("Refund")
        SETTLEMENT = "settlement", _("Settlement (Vendor to Cash)")
        SYSTEM = "system", _("System Adjustment")

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="sent_transactions",
        verbose_name=_("Sender"),
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="received_transactions",
        verbose_name=_("Receiver"),
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name=_("Amount"),
    )
    transaction_type = models.CharField(
        max_length=20,
        choices=TransactionType.choices,
        verbose_name=_("Type"),
    )
    comment = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Comment"),
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Transaction")
        verbose_name_plural = _("Transactions")
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.transaction_type}: {self.amount} from {self.sender} to {self.receiver}"

