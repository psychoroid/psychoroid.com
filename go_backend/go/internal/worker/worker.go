package worker

import (
	"context"
)

// Worker handles 3D model processing tasks
type Worker interface {
    // ProcessModel converts and optimizes 3D models
    ProcessModel(ctx context.Context, input []byte, format string, quality string) ([]byte, error)
    
    // ConvertToCAD converts mesh models to CAD formats
    ConvertToCAD(ctx context.Context, input []byte, format string, quality string) ([]byte, error)
    
    // GenerateModel generates 3D models from prompts
    GenerateModel(ctx context.Context, prompt string, style string) ([]byte, error)
    
    // OptimizeModel optimizes 3D models for specific use cases
    OptimizeModel(ctx context.Context, input []byte, targetUse string) ([]byte, error)
}

// LocalWorker implements model processing locally
type LocalWorker struct {
    config *Config
}

type Config struct {
    ModelPath    string
    CachePath    string
    MaxBatchSize int
}

func NewLocalWorker(config *Config) *LocalWorker {
    return &LocalWorker{
        config: config,
    }
} 