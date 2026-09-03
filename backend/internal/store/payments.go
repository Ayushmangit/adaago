package store

import "time"

type PaymentMethod string

const (
	PaymentMethodCash         PaymentMethod = "cash"
	PaymentMethodUPI          PaymentMethod = "upi"
	PaymentMethodCard         PaymentMethod = "card"
	PaymentMethodBankTransfer PaymentMethod = "bank_transfer"
)

type Payment struct {
	ID              int64         `json:"id"`
	FeeDueID        int64         `json:"fee_due_id"`
	AmountPaise     int64         `json:"amount_paise"`
	PaymentMethod   PaymentMethod `json:"payment_method"`
	ReferenceNumber *string       `json:"reference_number,omitempty"`
	Notes           *string       `json:"notes,omitempty"`
	PaidAt          time.Time     `json:"paid_at"`
	ReceivedBy      int64         `json:"received_by"`
	CreatedAt       time.Time     `json:"created_at"`
}
