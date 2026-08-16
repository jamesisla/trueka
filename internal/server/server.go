package server

import (
	"fmt"
	"log"
	"mime"
	"os"
	"path/filepath"
	"time"

	"github.com/example/base-opcion3/internal/handler"
	"github.com/example/base-opcion3/internal/store"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/helmet"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func init() {
	// Explicitly register MIME types so Linux/OCI servers never send text/plain for CSS/JS
	_ = mime.AddExtensionType(".css", "text/css; charset=utf-8")
	_ = mime.AddExtensionType(".js", "application/javascript; charset=utf-8")
	_ = mime.AddExtensionType(".mjs", "application/javascript; charset=utf-8")
	_ = mime.AddExtensionType(".json", "application/json; charset=utf-8")
	_ = mime.AddExtensionType(".jpg", "image/jpeg")
	_ = mime.AddExtensionType(".jpeg", "image/jpeg")
	_ = mime.AddExtensionType(".png", "image/png")
	_ = mime.AddExtensionType(".webp", "image/webp")
	_ = mime.AddExtensionType(".svg", "image/svg+xml")
}

func resolveBasePath() string {
	// 1. Check current working directory
	if _, err := os.Stat(filepath.Join(".", "web", "static", "index.html")); err == nil {
		abs, _ := filepath.Abs(".")
		return abs
	}

	// 2. Check binary executable directory
	if execPath, err := os.Executable(); err == nil {
		execDir := filepath.Dir(execPath)
		if _, err := os.Stat(filepath.Join(execDir, "web", "static", "index.html")); err == nil {
			return execDir
		}
	}

	// 3. Fallback to standard OCI path if present
	if _, err := os.Stat("/home/ubuntu/trueka/web/static/index.html"); err == nil {
		return "/home/ubuntu/trueka"
	}

	abs, _ := filepath.Abs(".")
	return abs
}

func Run() {
	baseDir := resolveBasePath()
	dataDir := filepath.Join(baseDir, "data")
	staticDir := filepath.Join(baseDir, "web", "static")
	indexHtml := filepath.Join(staticDir, "index.html")
	styleCss := filepath.Join(staticDir, "style.css")
	appJs := filepath.Join(staticDir, "app.js")

	log.Printf("📂 Base project path: %s\n", baseDir)
	log.Printf("📂 Static files path: %s\n", staticDir)
	log.Printf("📂 Data path: %s\n", dataDir)

	st, err := store.New(dataDir)
	if err != nil {
		log.Fatalf("Failed to initialize store: %v", err)
	}

	cfgStore, err := store.NewConfigStore(dataDir)
	if err != nil {
		log.Fatalf("Failed to initialize config store: %v", err)
	}

	prodHandler := handler.NewProductHandler(st)
	cfgHandler := handler.NewConfigHandler(cfgStore)

	app := fiber.New(fiber.Config{
		AppName:      "Trueka — Plataforma de Intercambio & Trueque v1.0",
		ServerHeader: "Trueka-Go-Monolith",
		BodyLimit:    10 * 1024 * 1024, // 10MB limit
	})

	app.Use(logger.New())
	app.Use(cors.New())

	// Security 1: HTTP Security Headers (Anti-Clickjacking, Anti-XSS, Anti-MIME sniffing)
	app.Use(helmet.New(helmet.Config{
		XFrameOptions:      "SAMEORIGIN",
		ContentTypeNosniff: "nosniff",
		XSSProtection:      "1; mode=block",
		ReferrerPolicy:     "strict-origin-when-cross-origin",
	}))

	// Security 2: Global Rate Limiter (Max 120 requests/minute per IP)
	app.Use(limiter.New(limiter.Config{
		Max:        120,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"success": false,
				"error":   "Demasiadas peticiones. Por favor, espera un momento.",
			})
		},
	}))

	// Favicon handling
	app.Get("/favicon.ico", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusNoContent)
	})

	// Explicit direct routes with strict MIME types for CSS & JS
	app.Get("/static/style.css", func(c *fiber.Ctx) error {
		c.Set("Content-Type", "text/css; charset=utf-8")
		c.Set("Cache-Control", "no-cache, no-store, must-revalidate")
		return c.SendFile(styleCss)
	})

	app.Get("/static/app.js", func(c *fiber.Ctx) error {
		c.Set("Content-Type", "application/javascript; charset=utf-8")
		c.Set("Cache-Control", "no-cache, no-store, must-revalidate")
		return c.SendFile(appJs)
	})

	// Static assets (/static/images/..., /static/uploads/...)
	app.Static("/static", staticDir, fiber.Static{
		ByteRange: true,
		Browse:    false,
		MaxAge:    0,
	})

	// Serve root index.html
	app.Get("/", func(c *fiber.Ctx) error {
		c.Set("Content-Type", "text/html; charset=utf-8")
		c.Set("Cache-Control", "no-cache, no-store, must-revalidate")
		return c.SendFile(indexHtml)
	})

	api := app.Group("/api")
	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"service": "trueka-exchange-platform",
			"version": "1.2.0",
		})
	})

	// Strict limiter for image uploads (max 15/min)
	uploadLimiter := limiter.New(limiter.Config{
		Max:        15,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"success": false,
				"error":   "Límite de subida de imágenes excedido (máximo 15 por minuto).",
			})
		},
	})

	// Dynamic Site Configuration / CMS endpoints
	api.Get("/config", cfgHandler.GetConfig)
	api.Put("/config", cfgHandler.UpdateConfig)
	api.Post("/config/reset", cfgHandler.ResetConfig)

	// Real image upload to disk with rate limiter
	api.Post("/upload", uploadLimiter, prodHandler.UploadImage)

	// Products / Items endpoints
	api.Get("/products", prodHandler.GetProducts)
	api.Get("/items", prodHandler.GetProducts)
	api.Get("/products/:id", prodHandler.GetProductByID)
	api.Get("/items/:id", prodHandler.GetProductByID)
	api.Post("/products", prodHandler.CreateProduct)
	api.Post("/items", prodHandler.CreateProduct)

	// Trade Proposals & Linking
	api.Post("/products/:id/propose", prodHandler.ProposeTrade)
	api.Post("/items/:id/propose", prodHandler.ProposeTrade)
	api.Post("/products/:id/proposals/:propId/accept", prodHandler.AcceptProposal)
	api.Post("/products/:id/proposals/:propId/reject", prodHandler.RejectProposal)
	api.Put("/products/:id/toggle-status", prodHandler.ToggleStatus)
	api.Put("/products/:id/toggle-sold", prodHandler.ToggleStatus)
	api.Delete("/products/:id", prodHandler.DeleteProduct)
	api.Delete("/items/:id", prodHandler.DeleteProduct)

	// Barter direct WhatsApp
	api.Post("/trade/whatsapp", prodHandler.TradeWhatsApp)
	api.Post("/checkout/whatsapp", prodHandler.TradeWhatsApp)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3005"
	}

	log.Printf("=== Trueka Running on http://0.0.0.0:%s ===\n", port)
	if err := app.Listen(fmt.Sprintf(":%s", port)); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
