package store

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/example/base-opcion3/internal/model"
)

type Store struct {
	mu       sync.RWMutex
	filePath string
	products map[string]model.Product
}

func New(dataDir string) (*Store, error) {
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create data dir: %w", err)
	}

	// Ensure static uploads directory exists for native disk image storage
	uploadsDir := filepath.Join(filepath.Dir(dataDir), "web", "static", "uploads")
	_ = os.MkdirAll(uploadsDir, 0755)

	fp := filepath.Join(dataDir, "products.json")
	s := &Store{
		filePath: fp,
		products: make(map[string]model.Product),
	}

	if err := s.loadOrSeed(); err != nil {
		return nil, err
	}

	return s, nil
}

func (s *Store) loadOrSeed() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, err := os.Stat(s.filePath); err == nil {
		data, err := os.ReadFile(s.filePath)
		if err == nil {
			var list []model.Product
			if err := json.Unmarshal(data, &list); err == nil && len(list) > 0 {
				s.products = make(map[string]model.Product)
				for _, p := range list {
					// Ensure defaults for backward compatibility
					if p.Status == "" {
						if p.InStock {
							p.Status = "disponible"
						} else {
							p.Status = "trueke_completado"
						}
					}
					if p.LookingFor == nil {
						p.LookingFor = []string{"📻 Audio & Vinilos", "📷 Cámaras & Foto"}
					}
					if p.TradeProposals == nil {
						p.TradeProposals = make([]model.TradeProposal, 0)
					}
					s.products[p.ID] = p
				}
				return nil
			}
		}
	}

	s.products = defaultProducts()
	return s.saveUnsafe()
}

func (s *Store) saveUnsafe() error {
	list := make([]model.Product, 0, len(s.products))
	for _, p := range s.products {
		list = append(list, p)
	}

	data, err := json.MarshalIndent(list, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(s.filePath, data, 0644)
}

func (s *Store) GetAll(search, category, lookingForCategory, condition, status, sortOrder string) []model.Product {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var result []model.Product

	searchLower := strings.ToLower(strings.TrimSpace(search))
	categoryLower := strings.ToLower(strings.TrimSpace(category))
	lookingForLower := strings.ToLower(strings.TrimSpace(lookingForCategory))
	conditionLower := strings.ToLower(strings.TrimSpace(condition))
	statusLower := strings.ToLower(strings.TrimSpace(status))

	for _, p := range s.products {
		// Search query
		if searchLower != "" {
			matchTitle := strings.Contains(strings.ToLower(p.Title), searchLower)
			matchDesc := strings.Contains(strings.ToLower(p.Description), searchLower)
			matchEra := strings.Contains(strings.ToLower(p.Era), searchLower)
			matchSeller := strings.Contains(strings.ToLower(p.SellerName), searchLower)
			matchLookingNote := strings.Contains(strings.ToLower(p.LookingForNote), searchLower)

			matchLookingCategory := false
			for _, lf := range p.LookingFor {
				if strings.Contains(strings.ToLower(lf), searchLower) {
					matchLookingCategory = true
					break
				}
			}

			if !matchTitle && !matchDesc && !matchEra && !matchSeller && !matchLookingNote && !matchLookingCategory {
				continue
			}
		}

		// Category of offered item
		if categoryLower != "" && categoryLower != "todos" {
			if strings.ToLower(p.Category) != categoryLower {
				continue
			}
		}

		// Category that the owner is seeking
		if lookingForLower != "" && lookingForLower != "todos" {
			matched := false
			for _, lf := range p.LookingFor {
				if strings.ToLower(lf) == lookingForLower || strings.Contains(strings.ToLower(lf), lookingForLower) {
					matched = true
					break
				}
			}
			if !matched {
				continue
			}
		}

		// Condition filter
		if conditionLower != "" && conditionLower != "todas" {
			if !strings.Contains(strings.ToLower(p.Condition), conditionLower) {
				continue
			}
		}

		// Status filter
		if statusLower != "" && statusLower != "todos" {
			if strings.ToLower(p.Status) != statusLower {
				continue
			}
		}

		result = append(result, p)
	}

	switch sortOrder {
	case "price_asc":
		sortProducts(result, func(a, b model.Product) bool { return a.Price < b.Price })
	case "price_desc":
		sortProducts(result, func(a, b model.Product) bool { return a.Price > b.Price })
	case "proposals_desc":
		sortProducts(result, func(a, b model.Product) bool { return len(a.TradeProposals) > len(b.TradeProposals) })
	case "oldest":
		sortProducts(result, func(a, b model.Product) bool { return a.CreatedAt.Before(b.CreatedAt) })
	default:
		sortProducts(result, func(a, b model.Product) bool { return a.CreatedAt.After(b.CreatedAt) })
	}

	return result
}

func sortProducts(p []model.Product, less func(a, b model.Product) bool) {
	for i := 0; i < len(p); i++ {
		for j := i + 1; j < len(p); j++ {
			if !less(p[i], p[j]) {
				p[i], p[j] = p[j], p[i]
			}
		}
	}
}

func (s *Store) GetByID(id string) (model.Product, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	p, ok := s.products[id]
	return p, ok
}

func (s *Store) Create(req model.CreateProductRequest) (model.Product, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	id := fmt.Sprintf("trk-%d", time.Now().UnixNano()%1000000)

	img := req.ImageURL
	if strings.TrimSpace(img) == "" {
		img = "/static/images/walkman.jpg"
	}

	score := req.ConditionScore
	if score < 1 {
		score = 9
	} else if score > 10 {
		score = 10
	}

	lookingFor := req.LookingFor
	if len(lookingFor) == 0 {
		lookingFor = []string{"Cualquier categoría de interés"}
	}

	seller := req.SellerName
	if strings.TrimSpace(seller) == "" {
		seller = "@truekero"
	}
	if !strings.HasPrefix(seller, "@") {
		seller = "@" + seller
	}

	var linkedTitle string
	if req.LinkedToID != "" {
		if orig, ok := s.products[req.LinkedToID]; ok {
			linkedTitle = orig.Title
		}
	}

	p := model.Product{
		ID:             id,
		Title:          req.Title,
		Category:       req.Category,
		Price:          req.Price,
		Condition:      req.Condition,
		ConditionScore: score,
		Era:            req.Era,
		Description:    req.Description,
		ImageURL:       img,
		InStock:        true,
		Status:         "disponible",
		SellerContact:  req.SellerContact,
		SellerName:     seller,
		Location:       req.Location,
		LookingFor:     lookingFor,
		LookingForNote: req.LookingForNote,
		LinkedToID:     req.LinkedToID,
		LinkedToTitle:  linkedTitle,
		TradeProposals: make([]model.TradeProposal, 0),
		CreatedAt:      time.Now(),
		Featured:       false,
	}

	s.products[id] = p
	if err := s.saveUnsafe(); err != nil {
		return p, err
	}

	return p, nil
}

func (s *Store) ProposeTrade(req model.ProposeTradeRequest) (model.TradeProposal, model.Product, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	target, ok := s.products[req.TargetItemID]
	if !ok {
		return model.TradeProposal{}, target, fmt.Errorf("target item not found")
	}

	proposalID := fmt.Sprintf("prop-%d", time.Now().UnixNano()%1000000)

	proposer := req.ProposerName
	if strings.TrimSpace(proposer) == "" {
		proposer = "@truekero"
	}
	if !strings.HasPrefix(proposer, "@") {
		proposer = "@" + proposer
	}

	img := req.OfferedImageURL
	if strings.TrimSpace(img) == "" {
		img = "/static/images/polaroid.jpg"
	}

	cond := req.OfferedCondition
	if strings.TrimSpace(cond) == "" {
		cond = "Excelente (9/10)"
	}

	cat := req.OfferedCategory
	if strings.TrimSpace(cat) == "" {
		cat = "📷 Cámaras & Foto"
	}

	offeredItemID := req.OfferedItemID

	// If user wants to publish this offered item in the catalog or it's a new item submission:
	if req.AddToCatalog && offeredItemID == "" && strings.TrimSpace(req.OfferedTitle) != "" {
		newID := fmt.Sprintf("trk-%d", time.Now().UnixNano()%1000000)
		lookingFor := req.OfferedLookingFor
		if len(lookingFor) == 0 {
			lookingFor = []string{target.Category}
		}

		newProduct := model.Product{
			ID:             newID,
			Title:          req.OfferedTitle,
			Category:       cat,
			Price:          target.Price, // Equivalent estimated value
			Condition:      cond,
			ConditionScore: 9,
			Era:            "Vintage / Colección",
			Description:    req.OfferedDescription,
			ImageURL:       img,
			InStock:        true,
			Status:         "disponible",
			SellerContact:  req.ProposerContact,
			SellerName:     proposer,
			Location:       "Intercambio Trueka",
			LookingFor:     lookingFor,
			LookingForNote: fmt.Sprintf("Ofertado inicialmente por: %s", target.Title),
			LinkedToID:     target.ID,
			LinkedToTitle:  target.Title,
			TradeProposals: make([]model.TradeProposal, 0),
			CreatedAt:      time.Now(),
			Featured:       false,
		}

		s.products[newID] = newProduct
		offeredItemID = newID
	}

	proposal := model.TradeProposal{
		ID:                   proposalID,
		TargetItemID:         target.ID,
		OfferedItemID:        offeredItemID,
		OfferedItemTitle:     req.OfferedTitle,
		OfferedItemCategory:  cat,
		OfferedItemCondition: cond,
		OfferedItemImageURL:  img,
		ProposerName:         proposer,
		ProposerContact:      req.ProposerContact,
		Message:              req.Message,
		CreatedAt:            time.Now(),
		Status:               "pendiente",
	}

	target.TradeProposals = append(target.TradeProposals, proposal)
	s.products[target.ID] = target

	if err := s.saveUnsafe(); err != nil {
		return proposal, target, err
	}

	return proposal, target, nil
}

func (s *Store) AcceptProposal(targetID, proposalID string) (model.Product, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	target, ok := s.products[targetID]
	if !ok {
		return target, fmt.Errorf("artículo no encontrado")
	}

	found := false
	var offeredID string
	for i, p := range target.TradeProposals {
		if p.ID == proposalID {
			target.TradeProposals[i].Status = "aceptada"
			offeredID = p.OfferedItemID
			found = true
			break
		}
	}

	if !found {
		return target, fmt.Errorf("propuesta no encontrada")
	}

	// Mark target item as completed
	target.Status = "trueke_completado"
	target.InStock = false
	s.products[target.ID] = target

	// Also mark the offered item as completed if it exists in store
	if offeredID != "" {
		if offered, ok := s.products[offeredID]; ok {
			offered.Status = "trueke_completado"
			offered.InStock = false
			s.products[offeredID] = offered
		}
	}

	if err := s.saveUnsafe(); err != nil {
		return target, err
	}

	return target, nil
}

func (s *Store) RejectProposal(targetID, proposalID string) (model.Product, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	target, ok := s.products[targetID]
	if !ok {
		return target, fmt.Errorf("artículo no encontrado")
	}

	found := false
	for i, p := range target.TradeProposals {
		if p.ID == proposalID {
			target.TradeProposals[i].Status = "rechazada"
			found = true
			break
		}
	}

	if !found {
		return target, fmt.Errorf("propuesta no encontrada")
	}

	s.products[target.ID] = target
	if err := s.saveUnsafe(); err != nil {
		return target, err
	}

	return target, nil
}

func (s *Store) ToggleStatus(id, newStatus string) (model.Product, bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	p, ok := s.products[id]
	if !ok {
		return p, false, nil
	}

	if newStatus != "" {
		p.Status = newStatus
		p.InStock = (newStatus == "disponible")
	} else {
		// Toggle
		if p.InStock {
			p.Status = "trueke_completado"
			p.InStock = false
		} else {
			p.Status = "disponible"
			p.InStock = true
		}
	}

	s.products[id] = p
	if err := s.saveUnsafe(); err != nil {
		return p, true, err
	}

	return p, true, nil
}

func (s *Store) Delete(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.products[id]; !ok {
		return false
	}

	delete(s.products, id)
	_ = s.saveUnsafe()
	return true
}

func defaultProducts() map[string]model.Product {
	m := make(map[string]model.Product)
	now := time.Now()

	items := []model.Product{
		{
			ID:             "trk-101",
			Title:          "Sony Walkman WM-F10 Stereo (1984)",
			Category:       "📻 Audio & Vinilos",
			Price:          150.00,
			Condition:      "Excelente (9/10)",
			ConditionScore: 9,
			Era:            "Años 80",
			Description:    "Walkman estéreo original en perfecto estado de conservación y funcionamiento mecánico impecable. Incluye auriculares ligeros retro.",
			ImageURL:       "/static/images/walkman.jpg",
			InStock:        true,
			Status:         "disponible",
			SellerContact:  "+34612889900",
			SellerName:     "@retromateo",
			Location:       "Madrid, Centro",
			LookingFor:     []string{"📷 Cámaras & Foto", "🕹️ Consolas & Videojuegos"},
			LookingForNote: "Busco cámara instantánea Polaroid 600 arcoíris o Game Boy Color con cartuchos.",
			TradeProposals: []model.TradeProposal{
				{
					ID:                   "prop-1",
					TargetItemID:         "trk-101",
					OfferedItemID:        "trk-102",
					OfferedItemTitle:     "Polaroid 600 OneStep Arcoíris (1986)",
					OfferedItemCategory:  "📷 Cámaras & Foto",
					OfferedItemCondition: "Pieza Única (9/10)",
					OfferedItemImageURL:  "/static/images/polaroid.jpg",
					ProposerName:         "@clara_photo",
					ProposerContact:      "+34622334455",
					Message:              "¡Hola Mateo! Tengo la Polaroid 600 con correa original y caja que andas buscando. Me interesa tu Walkman.",
					CreatedAt:            now.Add(-1 * time.Hour),
					Status:               "pendiente",
				},
			},
			CreatedAt: now.Add(-3 * time.Hour),
			Featured:  true,
		},
		{
			ID:             "trk-102",
			Title:          "Polaroid 600 OneStep Arcoíris (1986)",
			Category:       "📷 Cámaras & Foto",
			Price:          120.00,
			Condition:      "Pieza Única (9/10)",
			ConditionScore: 9,
			Era:            "Años 80",
			Description:    "Cámara instantánea mítica Polaroid 600 con banda arcoíris clásica. Flash funcional y rodillos limpios listos para disparar.",
			ImageURL:       "/static/images/polaroid.jpg",
			InStock:        true,
			Status:         "disponible",
			SellerContact:  "+34622334455",
			SellerName:     "@clara_photo",
			Location:       "Barcelona, Gràcia",
			LookingFor:     []string{"📻 Audio & Vinilos", "⏱️ Relojes"},
			LookingForNote: "Busco Walkman clásico de cassette o reloj de bolsillo mecánico con pátina.",
			TradeProposals: make([]model.TradeProposal, 0),
			CreatedAt:      now.Add(-5 * time.Hour),
			Featured:       true,
		},
		{
			ID:             "trk-103",
			Title:          "Olympus OM-1 35mm SRL Réflex Mecánica",
			Category:       "📷 Cámaras & Foto",
			Price:          165.00,
			Condition:      "Muy Bueno (9/10)",
			ConditionScore: 9,
			Era:            "Años 70",
			Description:    "Cuerpo réflex analógico totalmente mecánico con lente Zuiko 50mm f/1.8 y estuche de cuero original. Obturador preciso en todas las velocidades.",
			ImageURL:       "/static/images/camera.jpg",
			InStock:        true,
			Status:         "disponible",
			SellerContact:  "+34612345678",
			SellerName:     "@analogue_lab",
			Location:       "Valencia",
			LookingFor:     []string{"✒️ Escritorio", "📻 Audio & Vinilos"},
			LookingForNote: "Me interesa cambiar por máquina de escribir mecánica en funcionamiento o tocadiscos portátil.",
			TradeProposals: make([]model.TradeProposal, 0),
			CreatedAt:      now.Add(-10 * time.Hour),
			Featured:       false,
		},
		{
			ID:             "trk-104",
			Title:          "Máquina de Escribir Royal KHM Art Déco",
			Category:       "✒️ Escritorio",
			Price:          220.00,
			Condition:      "Restaurada (8/10)",
			ConditionScore: 8,
			Era:            "Art Déco",
			Description:    "Estructura sólida en hierro negro con teclas baquelita vintage, cinta bicolor recién colocada y campana de fin de línea sonando claro.",
			ImageURL:       "/static/images/typewriter.jpg",
			InStock:        true,
			Status:         "disponible",
			SellerContact:  "+34688776655",
			SellerName:     "@vintage_type",
			Location:       "Sevilla",
			LookingFor:     []string{"📷 Cámaras & Foto", "⏱️ Relojes"},
			LookingForNote: "Busco cámara réflex de 35mm clásica o reloj automático antiguo.",
			TradeProposals: make([]model.TradeProposal, 0),
			CreatedAt:      now.Add(-20 * time.Hour),
			Featured:       false,
		},
		{
			ID:             "trk-105",
			Title:          "Reloj de Bolsillo Henry London Latón",
			Category:       "⏱️ Relojes",
			Price:          135.00,
			Condition:      "Pátina Natural (9/10)",
			ConditionScore: 9,
			Era:            "Años 50",
			Description:    "Reloj de cuerda manual con esfera esmaltada, números romanos y suave pátina verde en el latón que atestigua su autenticidad.",
			ImageURL:       "/static/images/watch.jpg",
			InStock:        true,
			Status:         "disponible",
			SellerContact:  "+34699887766",
			SellerName:     "@antiques_club",
			Location:       "Bilbao",
			LookingFor:     []string{"📻 Audio & Vinilos", "✒️ Escritorio"},
			LookingForNote: "Busco vinilos de jazz clásico de primera edición o pluma estilográfica Parker antigua.",
			TradeProposals: make([]model.TradeProposal, 0),
			CreatedAt:      now.Add(-30 * time.Hour),
			Featured:       false,
		},
	}

	for _, p := range items {
		m[p.ID] = p
	}

	return m
}
