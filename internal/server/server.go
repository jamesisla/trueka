package server

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/example/base-opcion3/internal/handler"
	"github.com/example/base-opcion3/internal/store"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func resolveBasePath() string {
	// 1. Check current working directory
	if _, err := os.Stat(filepath.Join(".", "web", "static", "index.html")); err == nil {
		return "."
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

	return "."
}

func Run() {
	baseDir := resolveBasePath()
	dataDir := filepath.Join(baseDir, "data")
	staticDir := filepath.Join(baseDir, "web", "static")
	indexHtml := filepath.Join(staticDir, "index.html")

	log.Printf("📂 Base project path: %s\n", baseDir)
	log.Printf("📂 Static files path: %s\n", staticDir)
	log.Printf("📂 Data path: %s\n", dataDir)

	st, err := store.New(dataDir)
	if err != nil {
		log.Fatalf("Failed to initialize store: %v", err)
	}

	prodHandler := handler.NewProductHandler(st)

	app := fiber.New(fiber.Config{
		AppName:      "Trueka — Plataforma de Intercambio & Trueque v1.0",
		ServerHeader: "Trueka-Go-Monolith",
		BodyLimit:    10 * 1024 * 1024, // 10MB limit
	})

	app.Use(logger.New())
	app.Use(cors.New())

	// Static assets (/static/style.css, /static/app.js, /static/images/...)
	app.Static("/static", staticDir, fiber.Static{
		Compress:  true,
		ByteRange: true,
		Browse:    false,
		MaxAge:    3600 * 24,
	})

	// Favicon handling
	app.Get("/favicon.ico", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusNoContent)
	})

	// Serve root index.html
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendFile(indexHtml)
	})

	api := app.Group("/api")
	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"service": "trueka-exchange-platform",
		})
	})

	// Real image upload to disk
	api.Post("/upload", prodHandler.UploadImage)

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
