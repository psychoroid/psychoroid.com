// Average processing time in milliseconds (1 minute)
export const AVERAGE_PROCESSING_TIME = 60000;

export const PROGRESS_MESSAGES = [
  {
    timeRange: [0, 5000], // 0-5 seconds
    messages: [
      'Starting the magic...',
      'Warming up the engine...',
      'Initializing the conversion process...'
    ]
  },
  {
    timeRange: [5000, 15000], // 5-15 seconds
    messages: [
      'Reading the pixels between the lines...',
      'Converting your image to 3D...',
      'Processing...'
    ]
  },
  {
    timeRange: [15000, 30000], // 15-30 seconds
    messages: [
      'Crafting your model...',
      'Building the mesh structure...',
      'Adding depth to your design...'
    ]
  },
  {
    timeRange: [30000, 50000], // 30-50 seconds
    messages: [
      "Crafting the shape...",
      "Sculpting the model...",
      "Making it look awesome...",
      'Polishing the edges...',
      'Fine-tuning your model...'
    ]
  },
  {
    timeRange: [50000, Infinity], // 50+ seconds
    messages: [
      'Almost there...',
      'Just a few more seconds...',
      'Getting ready to show you the result...'
    ]
  }
];

export type ProgressMessage = {
  timeRange: [number, number];
  messages: string[];
}; 