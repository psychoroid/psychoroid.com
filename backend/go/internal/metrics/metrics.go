package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
)

var (
	ProcessingDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name: "model_processing_duration_seconds",
			Help: "Time spent processing models",
		},
		[]string{"type", "format"},
	)
	
	ProcessingErrors = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "model_processing_errors_total",
			Help: "Total number of processing errors",
		},
		[]string{"type", "error"},
	)
)

func init() {
	prometheus.MustRegister(ProcessingDuration)
	prometheus.MustRegister(ProcessingErrors)
} 