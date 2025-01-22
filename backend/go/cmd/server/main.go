package main

import (
	"log"
	"os"
	"runtime"

	"backend/internal/api"
	"backend/internal/config"
	"backend/internal/core"
	"backend/internal/queue"
)

func main() {
    // Configure number of workers based on CPU cores
    numWorkers := runtime.NumCPU()
    
    // Initialize the processing pipeline
    pipeline := core.NewPipeline(&config.PipelineConfig{
        Workers: numWorkers,
        QueueSize: 1000,
    })
    
    // Initialize the queue manager
    queueManager := queue.NewManager(&queue.Config{
        RedisURL: os.Getenv("REDIS_URL"),
    })
    
    // Initialize API server
    server := api.NewServer(&api.Config{
        Pipeline: pipeline,
        Queue: queueManager,
        Port: ":8080",
    })
    
    log.Printf("Starting server with %d workers", numWorkers)
    if err := server.Start(); err != nil {
        log.Fatalf("Server failed: %v", err)
    }
} 