from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .permissions import IsCompanyMember
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer

    permission_classes = [
        IsAuthenticated,
        IsCompanyMember,
    ]

    def get_queryset(self):
        return Notification.objects.filter(
            company_id=self.kwargs["company_id"],
            recipient=self.request.user,
        ).select_related(
            "company",
            "invoice",
        )


class NotificationMarkReadView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsCompanyMember,
    ]

    def patch(self, request, company_id, pk):
        notification = get_object_or_404(
            Notification,
            id=pk,
            company_id=company_id,
            recipient=request.user,
        )

        notification.is_read = True
        notification.save(update_fields=["is_read"])

        return Response(
            NotificationSerializer(notification).data
        )