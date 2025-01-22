package storage

import (
	"context"
	"io"
	"time"
)

type Storage interface {
	// Upload file to storage
	Upload(ctx context.Context, path string, data io.Reader) (string, error)
	
	// Download file from storage
	Download(ctx context.Context, path string) (io.ReadCloser, error)
	
	// Delete file from storage
	Delete(ctx context.Context, path string) error
	
	// Get public URL for file
	GetURL(path string) string
}

type StorageService interface {
	// Store stores data with a key and optional expiration
	Store(ctx context.Context, key string, data []byte, expiration time.Duration) error
	
	// Get retrieves data by key
	Get(ctx context.Context, key string) ([]byte, error)
	
	// Delete removes data by key
	Delete(ctx context.Context, key string) error
}

type CacheConfig struct {
	Address  string
	Password string
	DB       int
} 