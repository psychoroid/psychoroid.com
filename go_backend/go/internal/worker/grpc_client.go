package worker

import (
	"context"

	"backend/internal/model"
	pb "backend/proto"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type GRPCClient struct {
	conn   *grpc.ClientConn
	client pb.WorkerServiceClient
}

func NewGRPCClient(addr string) (*GRPCClient, error) {
	conn, err := grpc.Dial(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}
	
	return &GRPCClient{
		conn:   conn,
		client: pb.NewWorkerServiceClient(conn),
	}, nil
}

func (c *GRPCClient) StartGenerationJob(ctx context.Context, req *model.GenerationRequest) (string, error) {
	pbReq := &pb.GenerateModelRequest{
		Prompt:     req.Prompt,
		Style:      req.Style,
		Parameters: req.Parameters,
	}
	
	resp, err := c.client.GenerateModel(ctx, pbReq)
	if err != nil {
		return "", err
	}
	
	return resp.JobId, nil
}

func (c *GRPCClient) StartConversionJob(ctx context.Context, req *model.ConversionRequest) (string, error) {
	pbReq := &pb.ConvertToCADRequest{
		ModelUrl:     req.ModelURL,
		TargetFormat: req.TargetFormat,
		Quality:      req.Quality,
		Parameters:   req.Parameters,
	}
	
	resp, err := c.client.ConvertToCAD(ctx, pbReq)
	if err != nil {
		return "", err
	}
	
	return resp.JobId, nil
}

func (c *GRPCClient) GetJobStatus(ctx context.Context, jobID string) (*model.JobStatus, error) {
	// Implementation pending protobuf definition
	return nil, nil
} 