package core

import (
	"sync"

	"backend/internal/config"
)

type Pipeline struct {
	workers    int
	inputChan  chan *Job
	outputChan chan *Result
	wg         sync.WaitGroup
}

type Job struct {
	ID       string
	Type     string
	Input    []byte
	Format   string
	Metadata map[string]interface{}
}

type Result struct {
	JobID    string
	Output   []byte
	Error    error
	Metadata map[string]interface{}
}

func NewPipeline(config *config.PipelineConfig) *Pipeline {
	p := &Pipeline{
		workers:    config.Workers,
		inputChan:  make(chan *Job, config.QueueSize),
		outputChan: make(chan *Result, config.QueueSize),
	}
	
	p.start()
	return p
}

func (p *Pipeline) start() {
	for i := 0; i < p.workers; i++ {
		p.wg.Add(1)
		go p.worker()
	}
}

func (p *Pipeline) worker() {
	defer p.wg.Done()
	
	for job := range p.inputChan {
		result := p.processJob(job)
		p.outputChan <- result
	}
}

func (p *Pipeline) Submit(job *Job) {
	p.inputChan <- job
}

func (p *Pipeline) Results() <-chan *Result {
	return p.outputChan
}

func (p *Pipeline) processJob(job *Job) *Result {
	// Initialize result
	result := &Result{
		JobID:    job.ID,
		Metadata: make(map[string]interface{}),
	}

	// Process based on job type
	switch job.Type {
	case "model_conversion":
		output, err := p.processModelConversion(job)
		result.Output = output
		result.Error = err
	case "cad_conversion":
		output, err := p.processCADConversion(job)
		result.Output = output
		result.Error = err
	default:
		result.Error = ErrUnsupportedJobType
	}

	return result
}

func (p *Pipeline) processModelConversion(job *Job) ([]byte, error) {
	// TODO: Implement model conversion logic
	// This will use the job.Input and job.Format to convert the model
	if len(job.Input) == 0 {
		return nil, ErrInvalidInput
	}
	return job.Input, nil // Temporary implementation
}

func (p *Pipeline) processCADConversion(job *Job) ([]byte, error) {
	// TODO: Implement CAD conversion logic
	// This will use the job.Input and job.Format to convert to CAD format
	if len(job.Input) == 0 {
		return nil, ErrInvalidInput
	}
	return job.Input, nil // Temporary implementation
} 