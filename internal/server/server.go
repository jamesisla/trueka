package server

import (
	"fmt"
	"log"
	"os"

	"github.com/example/base-opcion3/internal/handler"
	"github.com/example/base-opcion3/internal/store"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func Run() {
	st, err := store.New("./data")
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

	// Static files serving with cache
	app.Static("/static", "./web/static", fiber.Static{
		Compress:  true,
		ByteRange: true,
		Browse:    false,
		MaxAge:    3600 * 24, // 24h cache for static assets
	})

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendFile("web/static/index.html")
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

	log.Printf("=== Trueka Running natively on http://0.0.0.0:%s ===\n", port)
	if err := app.Listen(fmt.Sprintf(":%s", port)); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
