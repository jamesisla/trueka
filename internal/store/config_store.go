package store

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/example/base-opcion3/internal/model"
)

type ConfigStore struct {
	mu       sync.RWMutex
	filePath string
	config   model.SiteConfig
}

func NewConfigStore(dataDir string) (*ConfigStore, error) {
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create data dir: %w", err)
	}

	fp := filepath.Join(dataDir, "config.json")
	cs := &ConfigStore{
		filePath: fp,
		config:   model.DefaultSiteConfig(),
	}

	if err := cs.loadOrSeed(); err != nil {
		return nil, err
	}

	return cs, nil
}

func (cs *ConfigStore) loadOrSeed() error {
	cs.mu.Lock()
	defer cs.mu.Unlock()

	if _, err := os.Stat(cs.filePath); err == nil {
		data, err := os.ReadFile(cs.filePath)
		if err == nil {
			var cfg model.SiteConfig
			if err := json.Unmarshal(data, &cfg); err == nil {
				def := model.DefaultSiteConfig()
				if cfg.TopRibbonText == "" {
					cfg.TopRibbonText = def.TopRibbonText
				}
				if cfg.TopRibbonTag == "" {
					cfg.TopRibbonTag = def.TopRibbonTag
				}
				if cfg.HeroTitle == "" {
					cfg.HeroTitle = def.HeroTitle
				}
				if cfg.HeroSubtitle == "" {
					cfg.HeroSubtitle = def.HeroSubtitle
				}
				if cfg.HeroStep1 == "" {
					cfg.HeroStep1 = def.HeroStep1
				}
				if cfg.HeroStep2 == "" {
					cfg.HeroStep2 = def.HeroStep2
				}
				if cfg.HeroStep3 == "" {
					cfg.HeroStep3 = def.HeroStep3
				}
				if cfg.FooterText == "" {
					cfg.FooterText = def.FooterText
				}
				if cfg.FooterCopyright == "" {
					cfg.FooterCopyright = def.FooterCopyright
				}
				if cfg.BrandTagline == "" {
					cfg.BrandTagline = def.BrandTagline
				}
				if cfg.SearchPlaceholder == "" {
					cfg.SearchPlaceholder = def.SearchPlaceholder
				}
				cs.config = cfg
				return nil
			}
		}
	}

	cs.config = model.DefaultSiteConfig()
	return cs.saveUnsafe()
}

func (cs *ConfigStore) saveUnsafe() error {
	data, err := json.MarshalIndent(cs.config, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(cs.filePath, data, 0644)
}

func (cs *ConfigStore) Get() model.SiteConfig {
	// Re-check file on disk if it was updated by another process (e.g. standalone admin process)
	cs.mu.Lock()
	defer cs.mu.Unlock()

	if data, err := os.ReadFile(cs.filePath); err == nil {
		var diskCfg model.SiteConfig
		if err := json.Unmarshal(data, &diskCfg); err == nil && diskCfg.HeroTitle != "" {
			cs.config = diskCfg
		}
	}

	return cs.config
}

func (cs *ConfigStore) Update(cfg model.SiteConfig) (model.SiteConfig, error) {
	cs.mu.Lock()
	defer cs.mu.Unlock()

	cfg.UpdatedAt = time.Now()
	cs.config = cfg
	if err := cs.saveUnsafe(); err != nil {
		return cfg, err
	}
	return cs.config, nil
}

func (cs *ConfigStore) Reset() (model.SiteConfig, error) {
	cs.mu.Lock()
	defer cs.mu.Unlock()

	cs.config = model.DefaultSiteConfig()
	cs.config.UpdatedAt = time.Now()
	if err := cs.saveUnsafe(); err != nil {
		return cs.config, err
	}
	return cs.config, nil
}
