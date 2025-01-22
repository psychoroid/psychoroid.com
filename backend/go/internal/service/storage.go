package service

import (
	"context"
	"io"
)

type Storage interface {
	Upload(ctx context.Context, path string, data io.Reader) (string, error)
	Download(ctx context.Context, path string) (io.ReadCloser, error)
	Delete(ctx context.Context, path string) error
	GetURL(path string) string
} 