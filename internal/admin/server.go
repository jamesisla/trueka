package admin

import (
	"fmt"
	"log"
	"mime"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/example/base-opcion3/internal/model"
	"github.com/example/base-opcion3/internal/store"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/helmet"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

var (
	startTime = time.Now()
)

func getAdminSecret() string {
	s := os.Getenv("ADMIN_SECRET")
	if s == "" {
		s = os.Getenv("ADMIN_TOKEN")
	}
	if s == "" {
		s = "trueka-admin-2026"
	}
	return s
}

func adminAuthRequired(c *fiber.Ctx) error {
	secret := getAdminSecret()
	token := c.Get("X-Admin-Token")
	if token == "" {
		token = c.Query("token")
	}
	if token == "" {
		token = c.Query("secret")
	}
	if token == "" {
		authHeader := c.Get("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			token = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}

	if strings.TrimSpace(token) != secret {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success":      false,
			"error":        "Autenticación requerida. Clave secreta de administrador no válida.",
			"authRequired": true,
		})
	}
	return c.Next()
}

func init() {
	_ = mime.AddExtensionType(".css", "text/css; charset=utf-8")
	_ = mime.AddExtensionType(".js", "application/javascript; charset=utf-8")
	_ = mime.AddExtensionType(".json", "application/json; charset=utf-8")
}

func resolveBasePath() string {
	if _, err := os.Stat(filepath.Join(".", "web", "static", "index.html")); err == nil {
		abs, _ := filepath.Abs(".")
		return abs
	}
	if execPath, err := os.Executable(); err == nil {
		execDir := filepath.Dir(execPath)
		if _, err := os.Stat(filepath.Join(execDir, "web", "static", "index.html")); err == nil {
			return execDir
		}
	}
	if _, err := os.Stat("/home/ubuntu/trueka/web/static/index.html"); err == nil {
		return "/home/ubuntu/trueka"
	}
	abs, _ := filepath.Abs(".")
	return abs
}

func RegisterAdminRoutes(app *fiber.App, st *store.Store, cfgStore *store.ConfigStore, baseDir string) {
	adminWebDir := filepath.Join(baseDir, "web", "admin")
	adminIndexHtml := filepath.Join(adminWebDir, "index.html")
	adminStyleCss := filepath.Join(adminWebDir, "style.css")
	adminJs := filepath.Join(adminWebDir, "admin.js")

	app.Get("/admin/style.css", func(c *fiber.Ctx) error {
		c.Set("Content-Type", "text/css; charset=utf-8")
		c.Set("Cache-Control", "no-cache, no-store, must-revalidate")
		return c.SendFile(adminStyleCss)
	})

	app.Get("/admin/admin.js", func(c *fiber.Ctx) error {
		c.Set("Content-Type", "application/javascript; charset=utf-8")
		c.Set("Cache-Control", "no-cache, no-store, must-revalidate")
		return c.SendFile(adminJs)
	})

	app.Get("/admin", func(c *fiber.Ctx) error {
		c.Set("Content-Type", "text/html; charset=utf-8")
		c.Set("Cache-Control", "no-cache, no-store, must-revalidate")
		return c.SendFile(adminIndexHtml)
	})

	app.Get("/admin/*", func(c *fiber.Ctx) error {
		c.Set("Content-Type", "text/html; charset=utf-8")
		c.Set("Cache-Control", "no-cache, no-store, must-revalidate")
		return c.SendFile(adminIndexHtml)
	})

	// Admin API Endpoints
	api := app.Group("/api/admin")

	// 0. Auth Verification
	api.Post("/auth/verify", func(c *fiber.Ctx) error {
		type authReq struct {
			Secret string `json:"secret" form:"secret"`
		}
		var req authReq
		_ = c.BodyParser(&req)

		secret := strings.TrimSpace(req.Secret)
		if secret == "" {
			secret = strings.TrimSpace(c.Query("secret"))
		}
		if secret == "" {
			secret = strings.TrimSpace(c.Get("X-Admin-Token"))
		}
		if secret == "" {
			secret = strings.Trim(strings.TrimSpace(string(c.Body())), "\"")
		}

		if secret != getAdminSecret() {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error":   "Clave de administrador no válida.",
			})
		}
		return c.JSON(fiber.Map{
			"success": true,
			"token":   getAdminSecret(),
			"message": "Autenticación exitosa",
		})
	})

	// 1. Status & Metrics endpoint (Health + System Stats + Main App Status)
	api.Get("/status", func(c *fiber.Ctx) error {
		var mem runtime.MemStats
		runtime.ReadMemStats(&mem)

		products := st.GetAll("", "", "", "", "", "newest")
		activeCount := 0
		completedCount := 0
		totalProposals := 0

		for _, p := range products {
			if p.Status == "disponible" {
				activeCount++
			} else {
				completedCount++
			}
			totalProposals += len(p.TradeProposals)
		}

		return c.JSON(fiber.Map{
			"success": true,
			"module":  "trueka-admin",
			"version": "1.3.0",
			"status":  "running",
			"uptime":  time.Since(startTime).Round(time.Second).String(),
			"startedAt": startTime.Format(time.RFC3339),
			"system": fiber.Map{
				"goVersion":    runtime.Version(),
				"numGoroutine": runtime.NumGoroutine(),
				"allocMB":      float64(mem.Alloc) / 1024 / 1024,
				"sysMB":        float64(mem.Sys) / 1024 / 1024,
			},
			"mainApp": fiber.Map{
				"online": true,
			},
			"stats": fiber.Map{
				"totalProducts":   len(products),
				"activeProducts":  activeCount,
				"completedTrades": completedCount,
				"totalProposals":  totalProposals,
			},
		})
	})

	// 2. Stop/Shutdown admin service via API (Requires Auth)
	api.Post("/stop", adminAuthRequired, func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"success": true,
			"message": "Módulo de administración activo.",
		})
	})

	// 3. CMS / Site Fixed Messages Endpoints
	api.Get("/config", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"success": true,
			"data":    cfgStore.Get(),
		})
	})

	api.Put("/config", adminAuthRequired, func(c *fiber.Ctx) error {
		var req model.SiteConfig
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"success": false,
				"error":   "Datos de configuración inválidos",
			})
		}

		// Security: Length limits for admin input
		if len(req.TopRibbonText) > 250 { req.TopRibbonText = req.TopRibbonText[:250] }
		if len(req.TopRibbonTag) > 80 { req.TopRibbonTag = req.TopRibbonTag[:80] }
		if len(req.BrandTagline) > 100 { req.BrandTagline = req.BrandTagline[:100] }
		if len(req.SearchPlaceholder) > 120 { req.SearchPlaceholder = req.SearchPlaceholder[:120] }
		if len(req.HeroTitle) > 150 { req.HeroTitle = req.HeroTitle[:150] }
		if len(req.HeroSubtitle) > 500 { req.HeroSubtitle = req.HeroSubtitle[:500] }
		if len(req.HeroStep1) > 300 { req.HeroStep1 = req.HeroStep1[:300] }
		if len(req.HeroStep2) > 300 { req.HeroStep2 = req.HeroStep2[:300] }
		if len(req.HeroStep3) > 300 { req.HeroStep3 = req.HeroStep3[:300] }
		if len(req.FooterText) > 250 { req.FooterText = req.FooterText[:250] }
		if len(req.FooterCopyright) > 150 { req.FooterCopyright = req.FooterCopyright[:150] }

		updated, err := cfgStore.Update(req)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false,
				"error":   "Error al guardar la configuración: " + err.Error(),
			})
		}

		return c.JSON(fiber.Map{
			"success": true,
			"data":    updated,
			"message": "¡Mensajes fijos del sitio actualizados con éxito!",
		})
	})

	api.Post("/config/reset", adminAuthRequired, func(c *fiber.Ctx) error {
		reset, err := cfgStore.Reset()
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false,
				"error":   "Error al restablecer valores por defecto",
			})
		}
		return c.JSON(fiber.Map{
			"success": true,
			"data":    reset,
			"message": "Textos restablecidos a los valores predeterminados de Trueka.",
		})
	})

	// 4. Products Management Endpoints
	api.Get("/products", func(c *fiber.Ctx) error {
		products := st.GetAll("", "", "", "", "", "newest")
		return c.JSON(fiber.Map{
			"success": true,
			"count":   len(products),
			"data":    products,
		})
	})

	api.Put("/products/:id/status", adminAuthRequired, func(c *fiber.Ctx) error {
		id := c.Params("id")
		type statusReq struct {
			Status string `json:"status"`
		}
		var req statusReq
		if err := c.BodyParser(&req); err != nil || req.Status == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"success": false,
				"error":   "Estado no especificado",
			})
		}

		p, found, err := st.ToggleStatus(id, req.Status)
		if err != nil || !found {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"error":   "Artículo no encontrado",
			})
		}

		return c.JSON(fiber.Map{
			"success": true,
			"data":    p,
			"message": "Estado del artículo actualizado",
		})
	})

	api.Delete("/products/:id", adminAuthRequired, func(c *fiber.Ctx) error {
		id := c.Params("id")
		ok := st.Delete(id)
		if !ok {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"error":   "Artículo no encontrado",
			})
		}
		return c.JSON(fiber.Map{
			"success": true,
			"message": "Artículo eliminado permanentemente de Trueka",
		})
	})

	// 5. Proposals Overview Endpoint
	api.Get("/proposals", func(c *fiber.Ctx) error {
		products := st.GetAll("", "", "", "", "", "newest")
		type ProposalWithTarget struct {
			Proposal   model.TradeProposal `json:"proposal"`
			TargetItem model.Product       `json:"targetItem"`
		}

		var allProposals []ProposalWithTarget
		for _, p := range products {
			for _, prop := range p.TradeProposals {
				allProposals = append(allProposals, ProposalWithTarget{
					Proposal:   prop,
					TargetItem: p,
				})
			}
		}

		return c.JSON(fiber.Map{
			"success": true,
			"count":   len(allProposals),
			"data":    allProposals,
		})
	})
}

func Run() {
	baseDir := resolveBasePath()
	dataDir := filepath.Join(baseDir, "data")
	staticDir := filepath.Join(baseDir, "web", "static")

	log.Printf("🛠️  [Trueka Admin] Base path: %s\n", baseDir)
	log.Printf("📂 [Trueka Admin] Data path: %s\n", dataDir)

	st, err := store.New(dataDir)
	if err != nil {
		log.Fatalf("[Trueka Admin] Failed to initialize store: %v", err)
	}

	cfgStore, err := store.NewConfigStore(dataDir)
	if err != nil {
		log.Fatalf("[Trueka Admin] Failed to initialize config store: %v", err)
	}

	app := fiber.New(fiber.Config{
		AppName:      "Trueka — Módulo de Administración v1.3",
		ServerHeader: "Trueka-Admin-Control",
		BodyLimit:    10 * 1024 * 1024,
	})

	app.Use(logger.New())
	app.Use(cors.New())

	// Security: Helmet HTTP Headers
	app.Use(helmet.New(helmet.Config{
		XFrameOptions:      "SAMEORIGIN",
		ContentTypeNosniff: "nosniff",
		XSSProtection:      "1; mode=block",
		ReferrerPolicy:     "strict-origin-when-cross-origin",
	}))

	// Static assets (/static/...)
	app.Static("/static", staticDir, fiber.Static{
		ByteRange: true,
		Browse:    false,
		MaxAge:    0,
	})

	// Register all admin endpoints and pages
	RegisterAdminRoutes(app, st, cfgStore, baseDir)

	// Also serve root as /admin for standalone mode
	adminWebDir := filepath.Join(baseDir, "web", "admin")
	app.Get("/", func(c *fiber.Ctx) error {
		c.Set("Content-Type", "text/html; charset=utf-8")
		return c.SendFile(filepath.Join(adminWebDir, "index.html"))
	})

	port := os.Getenv("ADMIN_PORT")
	if port == "" {
		port = os.Getenv("PORT")
	}
	if port == "" {
		port = "3006"
	}

	log.Printf("========================================================\n")
	log.Printf("⚙️  [Trueka Admin] Panel de Control disponible en:\n")
	log.Printf("👉 http://localhost:%s\n", port)
	log.Printf("========================================================\n")

	if err := app.Listen(fmt.Sprintf(":%s", port)); err != nil {
		log.Fatalf("[Trueka Admin] Error starting server: %v", err)
	}
}
