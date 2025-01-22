package queue

import (
	"context"
	"encoding/json"

	"github.com/go-redis/redis/v8"
)

type Manager struct {
	client *redis.Client
	config *Config
}

type Config struct {
	RedisURL string
}

type JobStatus struct {
	ID        string                 `json:"id"`
	Status    string                 `json:"status"`
	Progress  int                    `json:"progress"`
	Metadata  map[string]interface{} `json:"metadata"`
	Error     string                 `json:"error,omitempty"`
}

func NewManager(config *Config) *Manager {
	opt, err := redis.ParseURL(config.RedisURL)
	if err != nil {
		panic(err)
	}

	return &Manager{
		client: redis.NewClient(opt),
		config: config,
	}
}

func (m *Manager) AddJob(ctx context.Context, jobID string, metadata map[string]interface{}) error {
	status := &JobStatus{
		ID:       jobID,
		Status:   "pending",
		Progress: 0,
		Metadata: metadata,
	}
	
	data, err := json.Marshal(status)
	if err != nil {
		return err
	}
	
	return m.client.Set(ctx, "job:"+jobID, data, 0).Err()
}

func (m *Manager) UpdateJobStatus(ctx context.Context, jobID string, status string, progress int) error {
	jobStatus, err := m.GetJobStatus(ctx, jobID)
	if err != nil {
		return err
	}
	
	jobStatus.Status = status
	jobStatus.Progress = progress
	
	data, err := json.Marshal(jobStatus)
	if err != nil {
		return err
	}
	
	return m.client.Set(ctx, "job:"+jobID, data, 0).Err()
}

func (m *Manager) GetJobStatus(ctx context.Context, jobID string) (*JobStatus, error) {
	data, err := m.client.Get(ctx, "job:"+jobID).Bytes()
	if err != nil {
		return nil, err
	}
	
	var status JobStatus
	if err := json.Unmarshal(data, &status); err != nil {
		return nil, err
	}
	
	return &status, nil
} 