package model

// GenerationResponse represents a model generation response
type GenerationResponse struct {
	JobID  string `json:"job_id"`
	Status string `json:"status"`
}

// ConversionResponse represents a model conversion response
type ConversionResponse struct {
	JobID  string `json:"job_id"`
	Status string `json:"status"`
}

// JobStatus represents the current status of a job
type JobStatus struct {
	ID       string                 `json:"id"`
	Status   string                 `json:"status"`
	Progress int                    `json:"progress"`
	Metadata map[string]interface{} `json:"metadata"`
	Error    string                 `json:"error,omitempty"`
}

// GenerationRequest represents a model generation request
type GenerationRequest struct {
    Prompt       string            `json:"prompt"`
    NumImages    int               `json:"num_images"`
    Quality      string            `json:"quality"`
    Style        string            `json:"style"`
    Parameters   map[string]string `json:"parameters"`
    ReferenceURL string            `json:"reference_url,omitempty"`
}

// ConversionRequest represents a model conversion request
type ConversionRequest struct {
    ModelURL     string            `json:"model_url"`
    TargetFormat string            `json:"target_format"`
    Quality      string            `json:"quality"`
    Parameters   map[string]string `json:"parameters"`
} 