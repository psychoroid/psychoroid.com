package worker

import (
	"context"

	"backend/internal/model"
)

type Client interface {
	// Start a model generation job
	StartGenerationJob(ctx context.Context, req *model.GenerationRequest) (string, error)
	
	// Start a model conversion job
	StartConversionJob(ctx context.Context, req *model.ConversionRequest) (string, error)
	
	// Get job status
	GetJobStatus(ctx context.Context, jobID string) (*model.JobStatus, error)
} 