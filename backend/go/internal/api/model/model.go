package model

type GenerationRequest struct {
    Prompt       string            `json:"prompt"`
    NumImages    int               `json:"num_images"`
    Quality      string            `json:"quality"`
    Style        string            `json:"style"`
    Parameters   map[string]string `json:"parameters"`
    ReferenceURL string            `json:"reference_url,omitempty"`
}

type GenerationResponse struct {
    Images []GeneratedImage `json:"images"`
    JobID  string          `json:"job_id"`
}

type GeneratedImage struct {
    URL          string            `json:"url"`
    ContentType  string            `json:"content_type"`
    Metadata     map[string]string `json:"metadata"`
}

type ConversionRequest struct {
    ModelURL     string            `json:"model_url"`
    TargetFormat string            `json:"target_format"`
    Quality      string            `json:"quality"`
    Parameters   map[string]string `json:"parameters"`
}

type ConversionResponse struct {
    ModelURL     string            `json:"model_url"`
    PreviewURL   string            `json:"preview_url"`
    Format       string            `json:"format"`
    JobID        string            `json:"job_id"`
    Metadata     map[string]string `json:"metadata"`
} 