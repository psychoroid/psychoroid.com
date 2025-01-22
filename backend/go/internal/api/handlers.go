package api

import (
	"net/http"

	"backend/internal/core"
	"backend/internal/worker"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Handler struct {
	worker worker.Worker
}

func NewHandler(worker worker.Worker) *Handler {
	return &Handler{
		worker: worker,
	}
}

func (h *Handler) ProcessModel(c *gin.Context) {
	var req struct {
		ModelData []byte `json:"model_data"`
		Format   string `json:"format"`
		Quality  string `json:"quality"`
	}
	
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	result, err := h.worker.ProcessModel(c.Request.Context(), req.ModelData, req.Format, req.Quality)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data": result,
	})
}

func (h *Handler) ConvertToCAD(c *gin.Context) {
	// TODO: Implement CAD conversion endpoint
}

func (h *Handler) GenerateModel(c *gin.Context) {
	// TODO: Implement model generation endpoint
}

func (h *Handler) OptimizeModel(c *gin.Context) {
	// TODO: Implement model optimization endpoint
}

func (s *Server) handleHealth(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (s *Server) handleConvert(c *gin.Context) {
	var req struct {
		ModelData []byte            `json:"model_data"`
		Format    string            `json:"format"`
		Quality   string            `json:"quality"`
		Metadata  map[string]string `json:"metadata"`
	}

	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	jobID := uuid.New().String()
	job := &core.Job{
		ID:     jobID,
		Type:   "model_conversion",
		Input:  req.ModelData,
		Format: req.Format,
		Metadata: map[string]interface{}{
			"quality": req.Quality,
		},
	}

	// Add job to queue
	if err := s.queue.AddJob(c.Request.Context(), jobID, job.Metadata); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Submit job for processing
	s.pipeline.Submit(job)

	c.JSON(http.StatusAccepted, gin.H{
		"job_id": jobID,
		"status": "processing",
	})
}

func (s *Server) handleConvertCAD(c *gin.Context) {
	var req struct {
		ModelData  []byte            `json:"model_data"`
		Format     string            `json:"format"`
		Quality    string            `json:"quality"`
		Parameters map[string]string `json:"parameters"`
	}

	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	jobID := uuid.New().String()
	job := &core.Job{
		ID:     jobID,
		Type:   "cad_conversion",
		Input:  req.ModelData,
		Format: req.Format,
		Metadata: map[string]interface{}{
			"quality":    req.Quality,
			"parameters": req.Parameters,
		},
	}

	if err := s.queue.AddJob(c.Request.Context(), jobID, job.Metadata); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	s.pipeline.Submit(job)

	c.JSON(http.StatusAccepted, gin.H{
		"job_id": jobID,
		"status": "processing",
	})
}

func (s *Server) handleJobStatus(c *gin.Context) {
	jobID := c.Param("jobId")
	status, err := s.queue.GetJobStatus(c.Request.Context(), jobID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
		return
	}

	c.JSON(http.StatusOK, status)
} 