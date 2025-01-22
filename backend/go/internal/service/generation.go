package service

import (
	"context"

	"backend/internal/model"
	"backend/internal/worker"
)

type GenerationService struct {
	workerClient worker.Client
	storage      Storage
}

func NewGenerationService(workerClient worker.Client, storage Storage) *GenerationService {
	return &GenerationService{
		workerClient: workerClient,
		storage:      storage,
	}
}

func (s *GenerationService) Generate(ctx context.Context, req *model.GenerationRequest) (*model.GenerationResponse, error) {
	// Start generation job
	jobID, err := s.workerClient.StartGenerationJob(ctx, req)
	if err != nil {
		return nil, err
	}

	// Return immediate response with job ID
	return &model.GenerationResponse{
		JobID:  jobID,
		Status: "processing",
	}, nil
}

func (s *GenerationService) Convert(ctx context.Context, req *model.ConversionRequest) (*model.ConversionResponse, error) {
	// Start conversion job
	jobID, err := s.workerClient.StartConversionJob(ctx, req)
	if err != nil {
		return nil, err
	}

	// Return immediate response with job ID
	return &model.ConversionResponse{
		JobID:  jobID,
		Status: "processing",
	}, nil
} 