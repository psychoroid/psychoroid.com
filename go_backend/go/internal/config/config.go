package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Server   ServerConfig   `yaml:"server"`
	Worker   WorkerConfig   `yaml:"worker"`
	Storage  StorageConfig  `yaml:"storage"`
	Security SecurityConfig `yaml:"security"`
	Pipeline PipelineConfig `yaml:"pipeline"`
}

type ServerConfig struct {
	Port         int    `yaml:"port"`
	Host         string `yaml:"host"`
	ReadTimeout  int    `yaml:"read_timeout"`
	WriteTimeout int    `yaml:"write_timeout"`
}

type WorkerConfig struct {
	ModelPath    string `yaml:"model_path"`
	CachePath    string `yaml:"cache_path"`
	MaxBatchSize int    `yaml:"max_batch_size"`
	UseGPU       bool   `yaml:"use_gpu"`
	DeviceID     int    `yaml:"device_id"`
}

type StorageConfig struct {
	Type     string `yaml:"type"` // "redis", "filesystem", etc.
	Address  string `yaml:"address"`
	Password string `yaml:"password"`
	DB       int    `yaml:"db"`
}

type SecurityConfig struct {
	JWTSecret    string   `yaml:"jwt_secret"`
	AllowOrigins []string `yaml:"allow_origins"`
}

type PipelineConfig struct {
	Workers   int `yaml:"workers"`
	QueueSize int `yaml:"queue_size"`
}

func LoadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("reading config file: %w", err)
	}
	
	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("parsing config: %w", err)
	}
	
	return &cfg, nil
}