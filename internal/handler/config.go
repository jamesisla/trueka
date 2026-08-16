package handler

import (
	"github.com/example/base-opcion3/internal/model"
	"github.com/example/base-opcion3/internal/store"
	"github.com/gofiber/fiber/v2"
)

type ConfigHandler struct {
	configStore *store.ConfigStore
}

func NewConfigHandler(cs *store.ConfigStore) *ConfigHandler {
	return &ConfigHandler{configStore: cs}
}

func (h *ConfigHandler) GetConfig(c *fiber.Ctx) error {
	cfg := h.configStore.Get()
	return c.JSON(fiber.Map{
		"success": true,
		"data":    cfg,
	})
}

func (h *ConfigHandler) UpdateConfig(c *fiber.Ctx) error {
	var req model.SiteConfig
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Formato de configuración no válido",
		})
	}

	// Security: Length limits for site copy
	if len(req.TopRibbonText) > 250 {
		req.TopRibbonText = req.TopRibbonText[:250]
	}
	if len(req.TopRibbonTag) > 80 {
		req.TopRibbonTag = req.TopRibbonTag[:80]
	}
	if len(req.BrandTagline) > 100 {
		req.BrandTagline = req.BrandTagline[:100]
	}
	if len(req.SearchPlaceholder) > 120 {
		req.SearchPlaceholder = req.SearchPlaceholder[:120]
	}
	if len(req.HeroTitle) > 150 {
		req.HeroTitle = req.HeroTitle[:150]
	}
	if len(req.HeroSubtitle) > 500 {
		req.HeroSubtitle = req.HeroSubtitle[:500]
	}
	if len(req.HeroStep1) > 300 {
		req.HeroStep1 = req.HeroStep1[:300]
	}
	if len(req.HeroStep2) > 300 {
		req.HeroStep2 = req.HeroStep2[:300]
	}
	if len(req.HeroStep3) > 300 {
		req.HeroStep3 = req.HeroStep3[:300]
	}
	if len(req.FooterText) > 250 {
		req.FooterText = req.FooterText[:250]
	}
	if len(req.FooterCopyright) > 150 {
		req.FooterCopyright = req.FooterCopyright[:150]
	}

	updated, err := h.configStore.Update(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "No se pudo guardar la configuración en disco",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    updated,
		"message": "Configuración y textos fijos actualizados correctamente",
	})
}

func (h *ConfigHandler) ResetConfig(c *fiber.Ctx) error {
	reset, err := h.configStore.Reset()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "No se pudo restaurar la configuración predeterminada",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    reset,
		"message": "Textos fijos restablecidos a los valores originales",
	})
}
