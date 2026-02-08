from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, payment_report, payment_report_users

router = DefaultRouter()
router.register(r'', PaymentViewSet)

urlpatterns = [
    path('report/', payment_report, name='payment-report'),
    path('report/users/', payment_report_users, name='payment-report-users'),
    path('', include(router.urls)),
]

