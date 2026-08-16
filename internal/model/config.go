package model

import "time"

// SiteConfig defines the dynamic messages and fixed texts of the Trueka platform
type SiteConfig struct {
	// Top Ribbon Announcement
	TopRibbonShow bool   `json:"topRibbonShow"`
	TopRibbonText string `json:"topRibbonText"`
	TopRibbonTag  string `json:"topRibbonTag"`

	// Brand & Header
	BrandTagline      string `json:"brandTagline"`
	SearchPlaceholder string `json:"searchPlaceholder"`

	// Hero Section
	HeroTitle    string `json:"heroTitle"`
	HeroSubtitle string `json:"heroSubtitle"`
	HeroStep1    string `json:"heroStep1"`
	HeroStep2    string `json:"heroStep2"`
	HeroStep3    string `json:"heroStep3"`

	// Footer Section
	FooterText      string `json:"footerText"`
	FooterCopyright string `json:"footerCopyright"`

	// Metadata
	UpdatedAt time.Time `json:"updatedAt"`
}

// DefaultSiteConfig returns the default copy for Trueka
func DefaultSiteConfig() SiteConfig {
	return SiteConfig{
		TopRibbonShow:     true,
		TopRibbonText:     "🔄 trueka — Intercambia lo que tienes por lo que buscas • Trato Directo & Colaborativo",
		TopRibbonTag:      "Monolito Go Superligero",
		BrandTagline:      "intercambio & trueque directo",
		SearchPlaceholder: "Buscar cámaras, walkman, consolas, o lo que buscan...",
		HeroTitle:         "Intercambia Artículos Sin Complicaciones",
		HeroSubtitle:      "Publica lo que ya no usas, indica qué artículos o categorías andas buscando y conecta con otros usuarios para acordar el intercambio perfecto.",
		HeroStep1:         "Publica tu artículo: Sube foto, estado y qué buscas a cambio.",
		HeroStep2:         "Vincula propuestas: Otros usuarios te ofrecen lo que buscas.",
		HeroStep3:         "Catálogo circular: Las ofertas también son visibles para todos.",
		FooterText:        "Plataforma de Intercambio & Economía Circular • Trato Directo y Transparente",
		FooterCopyright:   "© 2026 Trueka — Conectando personas y objetos de valor.",
		UpdatedAt:         time.Now(),
	}
}
