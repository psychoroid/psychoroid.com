package api

import (
	"backend/internal/core"
	"backend/internal/queue"

	"github.com/gin-gonic/gin"
)

type Server struct {
	router    *gin.Engine
	pipeline  *core.Pipeline
	queue     *queue.Manager
	config    *Config
}

type Config struct {
	Pipeline *core.Pipeline
	Queue    *queue.Manager
	Port     string
}

func NewServer(config *Config) *Server {
	s := &Server{
		router:   gin.Default(),
		pipeline: config.Pipeline,
		queue:    config.Queue,
		config:   config,
	}
	s.setupRoutes()
	return s
}

func (s *Server) setupRoutes() {
	// Health check
	s.router.GET("/health", s.handleHealth)
	
	// Model conversion endpoints
	api := s.router.Group("/api/v1")
	{
		api.POST("/convert", s.handleConvert)
		api.POST("/convert-cad", s.handleConvertCAD)
		api.GET("/status/:jobId", s.handleJobStatus)
	}
}

func (s *Server) Start() error {
	return s.router.Run(s.config.Port)
} 