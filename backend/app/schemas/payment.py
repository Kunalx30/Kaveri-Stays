from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

from app.models.booking import PaymentMethodType


class PaymentCreate(BaseModel):
    booking_id: int = Field(..., gt=0, description="Target Booking ID to pay for")
    amount: Decimal = Field(..., gt=0, decimal_places=2, description="Payment amount in INR (must be positive)")
    method: PaymentMethodType = Field(..., description="Payment method: card, upi, bank_transfer, cash")
    idempotency_key: Optional[str] = Field(
        None,
        min_length=8,
        max_length=128,
        description="Optional client-generated unique idempotency key (or pass via Idempotency-Key HTTP header)"
    )


class PaymentResponse(BaseModel):
    payment_id: int
    booking_id: int
    amount: Decimal
    method: PaymentMethodType
    paid_at: datetime
    property_id: Optional[int] = None
    guest_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class PaymentSummaryResponse(BaseModel):
    booking_id: int
    total_booking_amount: Decimal
    total_paid: Decimal
    remaining_balance: Decimal
    is_fully_paid: bool
    payments: List[PaymentResponse]

    model_config = ConfigDict(from_attributes=True)
