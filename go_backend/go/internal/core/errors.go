package core

import "errors"

var (
    ErrUnsupportedJobType = errors.New("unsupported job type")
    ErrInvalidJobID = errors.New("invalid job id")
    ErrJobNotFound = errors.New("job not found")
    ErrInvalidInput = errors.New("invalid input data")
) 