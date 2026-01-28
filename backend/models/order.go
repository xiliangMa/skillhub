package models

import (
	"time"

	"github.com/google/uuid"
)

type OrderStatus string

const (
	OrderStatusPending   OrderStatus = "pending"
	OrderStatusPaid      OrderStatus = "paid"
	OrderStatusCancelled OrderStatus = "cancelled"
	OrderStatusRefunded  OrderStatus = "refunded"
)

type TransactionStatus string

const (
	TransactionStatusPending TransactionStatus = "pending"
	TransactionStatusSuccess TransactionStatus = "success"
	TransactionStatusFailed  TransactionStatus = "failed"
)

type Order struct {
	ID            uuid.UUID    `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	OrderNo       string       `gorm:"type:varchar(255);uniqueIndex;not null" json:"order_no"`
	UserID        uuid.UUID    `gorm:"type:uuid;not null;index" json:"user_id"`
	TotalAmount   float64      `gorm:"type:decimal(10,2)" json:"total_amount"`
	PaymentMethod string       `gorm:"type:varchar(50)" json:"payment_method"`
	Status        OrderStatus  `gorm:"type:varchar(50);default:'pending'" json:"status"`
	CreatedAt     time.Time    `gorm:"autoCreateTime" json:"created_at"`
	PaidAt        *time.Time   `json:"paid_at,omitempty"`

	User         User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Items        []OrderItem   `gorm:"foreignKey:OrderID" json:"items,omitempty"`
	Transactions []Transaction `gorm:"foreignKey:OrderID" json:"transactions,omitempty"`
}

type OrderItem struct {
	ID      uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	OrderID uuid.UUID  `gorm:"type:uuid;not null;index" json:"order_id"`
	SkillID *uuid.UUID `gorm:"type:uuid" json:"skill_id,omitempty"`
	Price   float64    `gorm:"type:decimal(10,2)" json:"price"`
	Quantity int        `gorm:"default:1" json:"quantity"`

	Order Order  `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	Skill *Skill `gorm:"foreignKey:SkillID" json:"skill,omitempty"`
}

type Transaction struct {
	ID             uuid.UUID        `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	OrderID        uuid.UUID        `gorm:"type:uuid;not null;index" json:"order_id"`
	PaymentChannel string           `gorm:"type:varchar(50)" json:"payment_channel"`
	TransactionID  string           `gorm:"type:varchar(255)" json:"transaction_id"`
	Amount         float64          `gorm:"type:decimal(10,2)" json:"amount"`
	Status         TransactionStatus `gorm:"type:varchar(50);default:'pending'" json:"status"`
	RawResponse    string           `gorm:"type:jsonb" json:"raw_response,omitempty"`
	CreatedAt      time.Time        `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt      time.Time        `gorm:"autoUpdateTime" json:"updated_at"`

	Order Order `gorm:"foreignKey:OrderID" json:"order,omitempty"`
}
