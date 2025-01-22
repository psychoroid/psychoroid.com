package worker

import (
	"context"

	"backend/internal/processor"
)

func (w *LocalWorker) ProcessModel(ctx context.Context, input []byte, format string, quality string) ([]byte, error) {
	proc := processor.NewModelProcessor(&processor.Config{
		MaxVertices:  100000,
		MaxFaces:     50000,
		OptimizeUVs:  true,
		NormalizeUVs: true,
	})
	return proc.ProcessModel(ctx, input, format, quality)
}

func (w *LocalWorker) ConvertToCAD(ctx context.Context, input []byte, format string, quality string) ([]byte, error) {
	conv := processor.NewCADConverter(&processor.CADConfig{
		MaxResolution: 4096,
		Tolerance:     0.001,
		CleanupMesh:   true,
	})
	return conv.ConvertToCAD(ctx, input, format, quality)
}

func (w *LocalWorker) GenerateModel(ctx context.Context, prompt string, style string) ([]byte, error) {
	gen := processor.NewModelGenerator(&processor.GeneratorConfig{
		ModelPath:     w.config.ModelPath,
		Resolution:    2048,
		MaxBatchSize:  w.config.MaxBatchSize,
		UseGPU:       true,
		DeviceID:     0,
		CacheEnabled: true,
	})
	return gen.GenerateModel(ctx, prompt, style)
}

func (w *LocalWorker) OptimizeModel(ctx context.Context, input []byte, targetUse string) ([]byte, error) {
	proc := processor.NewModelProcessor(&processor.Config{
		MaxVertices:  50000,
		MaxFaces:     25000,
		OptimizeUVs:  true,
		NormalizeUVs: true,
	})
	return proc.ProcessModel(ctx, input, "glb", "optimized")
} 