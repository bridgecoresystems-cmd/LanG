from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WalletViewSet, TransactionViewSet, transfer_gems, rfid_payment, gems_report, report_users

router = DefaultRouter()
router.register(r'wallets', WalletViewSet)
router.register(r'transactions', TransactionViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('transfer/', transfer_gems, name='gem-transfer'),
    path('pay/', rfid_payment, name='rfid-payment'),
    path('report/', gems_report, name='gems-report'),
    path('report/users/', report_users, name='report-users'),
]

