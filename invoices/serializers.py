from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from clients.models import Client
from products.models import Product

from .models import Invoice, InvoiceItem

from notifications.models import Notification
from notifications.services import notify_company_users



class InvoiceItemSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = InvoiceItem
        fields = [
            "id",
            "product",
            "description",
            "quantity",
            "unit_price",
            "gst_rate",
            "line_subtotal",
            "gst_amount",
            "line_total",
        ]
        read_only_fields = [
            "id",
            "line_subtotal",
            "gst_amount",
            "line_total",
        ]

    def validate(self, attrs):
        product = attrs.get("product")
        company = self.context["company"]

        if product and product.company_id != company.id:
            raise serializers.ValidationError(
                {"product": "This product does not belong to this company."}
            )

        if product:
            attrs.setdefault("description", product.name)
            attrs.setdefault("unit_price", product.price)
            attrs.setdefault("gst_rate", product.gst_rate)

        return attrs


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True)

    paid_amount = serializers.SerializerMethodField()
    remaining_amount = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            "id",
            "invoice_number",
            "client",
            "issue_date",
            "due_date",
            "status",
            "subtotal",
            "tax_amount",
            "discount_amount",
            "total_amount",
            "notes",
            "terms_and_conditions",
            "items",
            "created_at",
            "updated_at",
            "paid_amount",
            "remaining_amount",
            "is_overdue",
        ]

        read_only_fields = [
            "id",
            "invoice_number",
            "subtotal",
            "tax_amount",
            "total_amount",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        company = self.context["company"]
        client = attrs["client"]

        if client.company_id != company.id:
            raise serializers.ValidationError(
                {"client": "This client does not belong to this company."}
            )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        company = self.context["company"]
        user = self.context["request"].user

        invoice = Invoice.objects.create(
            company=company,
            created_by=user,
            **validated_data,
        )

        subtotal = Decimal("0.00")
        tax_amount = Decimal("0.00")

        for item_data in items_data:
            item = InvoiceItem.objects.create(
                invoice=invoice,
                **item_data,
            )

            subtotal += item.line_subtotal
            tax_amount += item.gst_amount

        invoice.subtotal = subtotal
        invoice.tax_amount = tax_amount
        invoice.total_amount = (
            subtotal
            + tax_amount
            - invoice.discount_amount
        )

        invoice.save(
            update_fields=[
                "subtotal",
                "tax_amount",
                "total_amount",
                "updated_at",
            ]
        )

        notify_company_users(
            company=company,
            invoice=invoice,
            notification_type=Notification.Type.INVOICE_CREATED,
            title="Invoice Created",
            message=(
                f"Invoice {invoice.invoice_number} "
                f"was created for {invoice.client.name}."
            ),
        )

        return invoice

    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)

        # Update all scalar/FK fields on the invoice
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if items_data is not None:
            # Replace existing items wholesale and recalculate totals
            instance.items.all().delete()

            subtotal = Decimal("0.00")
            tax_amount = Decimal("0.00")

            for item_data in items_data:
                item = InvoiceItem.objects.create(
                    invoice=instance,
                    **item_data,
                )
                subtotal += item.line_subtotal
                tax_amount += item.gst_amount

            instance.subtotal = subtotal
            instance.tax_amount = tax_amount
            instance.total_amount = (
                subtotal
                + tax_amount
                - instance.discount_amount
            )

        instance.save()
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["items"] = InvoiceItemSerializer(
            instance.items.all(),
            many=True,
        ).data
        return data

    def get_paid_amount(self, obj):
        return obj.paid_amount

    def get_remaining_amount(self, obj):
        return obj.remaining_amount

    def get_is_overdue(self, obj):
        obj.update_status()
        return obj.status == Invoice.Status.OVERDUE