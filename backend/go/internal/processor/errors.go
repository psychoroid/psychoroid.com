package processor

import "errors"

var (
	ErrInvalidInput      = errors.New("invalid input data")
	ErrUnsupportedFormat = errors.New("unsupported format")
	ErrProcessingFailed  = errors.New("processing failed")
	ErrOptimizationFailed = errors.New("optimization failed")
	ErrGenerationFailed  = errors.New("model generation failed")
	ErrInvalidPrompt     = errors.New("invalid prompt")
	ErrInvalidStyle      = errors.New("invalid style")
) 