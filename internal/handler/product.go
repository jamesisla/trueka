package handler

import (
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/example/base-opcion3/internal/model"
	"github.com/example/base-opcion3/internal/store"
	"github.com/gofiber/fiber/v2"
)

type ProductHandler struct {
	store *store.Store
}

func NewProductHandler(s *store.Store) *ProductHandler {
	return &ProductHandler{store: s}
}

func (h *ProductHandler) GetProducts(c *fiber.Ctx) error {
	search := c.Query("search", "")
	category := c.Query("category", "")
	lookingFor := c.Query("looking_for", "")
	condition := c.Query("condition", "")
	status := c.Query("status", "")
	sortOrder := c.Query("sort", "newest")

	products := h.store.GetAll(search, category, lookingFor, condition, status, sortOrder)

	return c.JSON(fiber.Map{
		"success": true,
		"count":   len(products),
		"data":    products,
	})
}

func (h *ProductHandler) GetProductByID(c *fiber.Ctx) error {
	id := c.Params("id")
	p, found := h.store.GetByID(id)
	if !found {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   "Artículo no encontrado en Trueka",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    p,
	})
}

func (h *ProductHandler) CreateProduct(c *fiber.Ctx) error {
	var req model.CreateProductRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Datos de publicación incompletos o no válidos",
		})
	}

	req.Title = strings.TrimSpace(req.Title)
	if req.Title == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "El título del artículo es obligatorio",
		})
	}

	// Security: Length limits to prevent storage flooding
	if len(req.Title) > 120 {
		req.Title = req.Title[:120]
	}
	if len(req.Description) > 1500 {
		req.Description = req.Description[:1500]
	}
	if len(req.SellerName) > 50 {
		req.SellerName = req.SellerName[:50]
	}
	if len(req.SellerContact) > 35 {
		req.SellerContact = req.SellerContact[:35]
	}
	if len(req.Location) > 60 {
		req.Location = req.Location[:60]
	}
	if len(req.LookingForNote) > 300 {
		req.LookingForNote = req.LookingForNote[:300]
	}

	p, err := h.store.Create(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "No se pudo publicar el artículo para trueke",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    p,
		"message": "¡Artículo publicado con éxito en Trueka!",
	})
}

func (h *ProductHandler) ProposeTrade(c *fiber.Ctx) error {
	var req model.ProposeTradeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Datos de la propuesta inválidos",
		})
	}

	targetID := c.Params("id")
	if targetID != "" {
		req.TargetItemID = targetID
	}

	if req.TargetItemID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Artículo destino no especificado",
		})
	}

	// Security: Input length limits
	if len(req.OfferedTitle) > 120 {
		req.OfferedTitle = req.OfferedTitle[:120]
	}
	if len(req.OfferedDescription) > 1000 {
		req.OfferedDescription = req.OfferedDescription[:1000]
	}
	if len(req.ProposerName) > 50 {
		req.ProposerName = req.ProposerName[:50]
	}
	if len(req.ProposerContact) > 35 {
		req.ProposerContact = req.ProposerContact[:35]
	}
	if len(req.Message) > 500 {
		req.Message = req.Message[:500]
	}

	proposal, target, err := h.store.ProposeTrade(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success":    true,
		"proposal":   proposal,
		"targetItem": target,
		"message":    "¡Propuesta de trueke enviada y vinculada con éxito!",
	})
}

func (h *ProductHandler) AcceptProposal(c *fiber.Ctx) error {
	targetID := c.Params("id")
	propID := c.Params("propId")

	product, err := h.store.AcceptProposal(targetID, propID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    product,
		"message": "¡Propuesta aceptada! El trueke se ha marcado como completado.",
	})
}

func (h *ProductHandler) RejectProposal(c *fiber.Ctx) error {
	targetID := c.Params("id")
	propID := c.Params("propId")

	product, err := h.store.RejectProposal(targetID, propID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    product,
		"message": "Propuesta rechazada.",
	})
}

func (h *ProductHandler) ToggleStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	newStatus := c.Query("status", "")

	p, found, err := h.store.ToggleStatus(id, newStatus)
	if err != nil || !found {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   "Artículo no encontrado",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    p,
	})
}

func (h *ProductHandler) DeleteProduct(c *fiber.Ctx) error {
	id := c.Params("id")
	ok := h.store.Delete(id)
	if !ok {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   "Artículo no encontrado",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Artículo eliminado",
	})
}

func (h *ProductHandler) UploadImage(c *fiber.Ctx) error {
	file, err := c.FormFile("image")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "No se subió ninguna imagen",
		})
	}

	// 1. Limit to max 5MB
	if file.Size > 5*1024*1024 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "La imagen no debe superar los 5MB",
		})
	}

	// 2. Open file and inspect Magic Bytes (first 512 bytes) to detect true MIME type
	src, err := file.Open()
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "No se pudo leer el archivo",
		})
	}
	defer src.Close()

	headerBuffer := make([]byte, 512)
	n, _ := src.Read(headerBuffer)
	detectedMIME := http.DetectContentType(headerBuffer[:n])

	var validExt string
	switch {
	case strings.HasPrefix(detectedMIME, "image/jpeg"):
		validExt = ".jpg"
	case strings.HasPrefix(detectedMIME, "image/png"):
		validExt = ".png"
	case strings.HasPrefix(detectedMIME, "image/webp"):
		validExt = ".webp"
	case strings.HasPrefix(detectedMIME, "image/gif"):
		validExt = ".gif"
	default:
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "El archivo no es una imagen válida (formatos permitidos: JPG, PNG, WEBP, GIF)",
		})
	}

	uploadsDir := "./web/static/uploads"
	if _, err := os.Stat(uploadsDir); os.IsNotExist(err) {
		if execPath, err := os.Executable(); err == nil {
			execDir := filepath.Dir(execPath)
			uploadsDir = filepath.Join(execDir, "web", "static", "uploads")
		}
	}
	_ = os.MkdirAll(uploadsDir, 0755)

	// 3. Generate sanitized, randomized filename (prevents directory traversal)
	filename := fmt.Sprintf("upload_%d_%d%s", time.Now().Unix(), time.Now().Nanosecond()%100000, validExt)
	dst := filepath.Join(uploadsDir, filename)

	if err := c.SaveFile(file, dst); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Error al guardar la imagen en disco",
		})
	}

	return c.JSON(fiber.Map{
		"success":  true,
		"imageUrl": "/static/uploads/" + filename,
	})
}

func (h *ProductHandler) TradeWhatsApp(c *fiber.Ctx) error {
	var req model.TradeWhatsAppRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Error al procesar la propuesta de WhatsApp",
		})
	}

	target, found := h.store.GetByID(req.TargetItemID)
	if !found {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   "Artículo no encontrado",
		})
	}

	var sb strings.Builder
	sb.WriteString("🔄 *PROPUESTA DE TRUEKE EN TRUEKA*\n\n")
	sb.WriteString(fmt.Sprintf("Hola %s! Vi tu publicación en Trueka:\n", target.SellerName))
	sb.WriteString(fmt.Sprintf("📦 *Tu artículo:* %s (%s)\n", target.Title, target.Category))
	
	if len(target.LookingFor) > 0 {
		sb.WriteString(fmt.Sprintf("🎯 *Buscabas:* %s\n\n", strings.Join(target.LookingFor, ", ")))
	}

	if req.OfferedTitle != "" {
		sb.WriteString(fmt.Sprintf("🎁 *Te ofrezco a cambio:* %s\n", req.OfferedTitle))
	}

	if req.Message != "" {
		sb.WriteString(fmt.Sprintf("💬 *Mensaje:* %s\n", req.Message))
	}

	sender := req.CustomerName
	if sender == "" {
		sender = "Usuario de Trueka"
	}
	sb.WriteString(fmt.Sprintf("\n👤 *De:* %s", sender))
	if req.CustomerContact != "" {
		sb.WriteString(fmt.Sprintf(" (Tel: %s)", req.CustomerContact))
	}
	sb.WriteString("\n\n¿Te interesaría coordinar el intercambio?")

	contactPhone := strings.ReplaceAll(target.SellerContact, "+", "")
	contactPhone = strings.ReplaceAll(contactPhone, " ", "")
	if contactPhone == "" {
		contactPhone = "34600000000"
	}

	waURL := fmt.Sprintf("https://wa.me/%s?text=%s", contactPhone, url.QueryEscape(sb.String()))

	return c.JSON(fiber.Map{
		"success":     true,
		"whatsappUrl": waURL,
	})
}
