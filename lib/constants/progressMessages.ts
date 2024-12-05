export const PROGRESS_MESSAGES = [
  {
    threshold: 0,
    messages: [
      "Starting the magic...",
      "Warming up the 3D engine...",
    ]
  },
  {
    threshold: 10,
    messages: [
      "Analyzing your image...",
      "Reading the pixels between the lines...",
      "Processing data and stuff..."
    ]
  },
  {
    threshold: 25,
    messages: [
      "Converting to 3D...",
      "Adding depth to your image...",
      "Building the mesh structure..."
    ]
  },
  {
    threshold: 40,
    messages: [
      "Crafting the shape...",
      "Sculpting the model...",
      "Making it look awesome..."
    ]
  },
  {
    threshold: 60,
    messages: [
      "Polishing the edges...",
      "Adding finishing touches...",
      "Almost there..."
    ]
  },
  {
    threshold: 95,
    messages: [
      "Final preparations...",
      "Getting ready to show you the result...",
      "Just a few more seconds..."
    ]
  },
  {
    threshold: 100,
    messages: [
      "Done! 🎉",
      "Completed! ✨",
      "Ready! 🌟"
    ]
  }
];

export type ProgressMessage = {
  threshold: number;
  messages: string[];
}; 