package model

import "time"

type TradeProposal struct {
	ID                   string    `json:"id"`
	TargetItemID         string    `json:"targetItemId"`
	OfferedItemID        string    `json:"offeredItemId,omitempty"`
	OfferedItemTitle     string    `json:"offeredItemTitle"`
	OfferedItemCategory  string    `json:"offeredItemCategory"`
	OfferedItemCondition string    `json:"offeredItemCondition"`
	OfferedItemImageURL  string    `json:"offeredItemImageUrl"`
	ProposerName         string    `json:"proposerName"`
	ProposerContact      string    `json:"proposerContact"`
	Message              string    `json:"message"`
	CreatedAt            time.Time `json:"createdAt"`
	Status               string    `json:"status"` // "pendiente", "aceptada", "rechazada"
}

type Product struct {
	ID                  string          `json:"id"`
	Title               string          `json:"title"`
	Category            string          `json:"category"`
	Price               float64         `json:"price"` // Valor estimado de referencia
	Condition           string          `json:"condition"`
	ConditionScore      int             `json:"conditionScore"`
	Era                 string          `json:"era"`
	Description         string          `json:"description"`
	ImageURL            string          `json:"imageUrl"`
	InStock             bool            `json:"inStock"` // true = disponible para trueke
	Status              string          `json:"status"`  // "disponible", "en_negociacion", "trueke_completado"
	SellerContact       string          `json:"sellerContact"`
	SellerName          string          `json:"sellerName"`
	Location            string          `json:"location"`
	LookingFor          []string        `json:"lookingFor"`     // Categorías que busca a cambio
	LookingForNote      string          `json:"lookingForNote"` // Descripción de artículos buscados
	LinkedToID          string          `json:"linkedToId,omitempty"`
	LinkedToTitle       string          `json:"linkedToTitle,omitempty"`
	TradeProposals      []TradeProposal `json:"tradeProposals"`
	CreatedAt           time.Time       `json:"createdAt"`
	Featured            bool            `json:"featured"`
}

type CreateProductRequest struct {
	Title          string   `json:"title"`
	Category       string   `json:"category"`
	Price          float64  `json:"price"`
	Condition      string   `json:"condition"`
	ConditionScore int      `json:"conditionScore"`
	Era            string   `json:"era"`
	Description    string   `json:"description"`
	ImageURL       string   `json:"imageUrl"`
	SellerContact  string   `json:"sellerContact"`
	SellerName     string   `json:"sellerName"`
	Location       string   `json:"location"`
	LookingFor     []string `json:"lookingFor"`
	LookingForNote string   `json:"lookingForNote"`
	LinkedToID     string   `json:"linkedToId"`
}

type ProposeTradeRequest struct {
	TargetItemID       string   `json:"targetItemId"`
	OfferedItemID      string   `json:"offeredItemId"`
	OfferedTitle       string   `json:"offeredTitle"`
	OfferedCategory    string   `json:"offeredCategory"`
	OfferedCondition   string   `json:"offeredCondition"`
	OfferedImageURL    string   `json:"offeredImageUrl"`
	OfferedDescription string   `json:"offeredDescription"`
	OfferedLookingFor  []string `json:"offeredLookingFor"`
	ProposerName       string   `json:"proposerName"`
	ProposerContact    string   `json:"proposerContact"`
	Message            string   `json:"message"`
	AddToCatalog       bool     `json:"addToCatalog"`
}

type TradeWhatsAppRequest struct {
	TargetItemID    string `json:"targetItemId"`
	OfferedTitle    string `json:"offeredTitle"`
	Message         string `json:"message"`
	CustomerName    string `json:"customerName"`
	CustomerContact string `json:"customerContact"`
}

type CartItem struct {
	ProductID string  `json:"productId"`
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"`
}

type CheckoutRequest struct {
	Items         []CartItem `json:"items"`
	CustomerName  string     `json:"customerName"`
	CustomerPhone string     `json:"customerPhone"`
	Address       string     `json:"address"`
	Note          string     `json:"note"`
}
