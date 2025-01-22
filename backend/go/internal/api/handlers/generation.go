package handlers

import (
	"net/http"

	"backend/internal/model"
	"backend/internal/service"

	"github.com/gin-gonic/gin"
)

type GenerationHandler struct {
	generationService *service.GenerationService
}

func NewGenerationHandler(service *service.GenerationService) *GenerationHandler {
	return &GenerationHandler{
		generationService: service,
	}
}

func (h *GenerationHandler) HandleGenerate(c *gin.Context) {
	var req model.GenerationRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Start generation job
	response, err := h.generationService.Generate(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, response)
}

func (h *GenerationHandler) HandleConvert(c *gin.Context) {
	var req model.ConversionRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Start conversion job
	response, err := h.generationService.Convert(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, response)
} 