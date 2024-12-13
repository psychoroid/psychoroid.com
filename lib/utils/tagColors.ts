// Core tags that have fixed colors
export const CORE_TAGS = {
  starter: 'bg-[#D73D57]/10 text-[#D73D57] border-[#D73D57]/20',
  'image-to-3d': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'prompt-to-3d': 'bg-purple-500/10 text-purple-500 border-purple-500/20'
} as const;

// Generate a consistent color for any tag based on its string
export function getTagColor(tag: string): string {
  // Return fixed color for core tags
  if (tag in CORE_TAGS) {
    return CORE_TAGS[tag as keyof typeof CORE_TAGS];
  }

  // Generate a consistent color based on the tag string
  const colors = [
    'rose',
    'pink',
    'fuchsia',
    'violet',
    'indigo',
    'cyan',
    'teal',
    'lime',
    'amber',
    'orange'
  ];

  // Use string to generate a consistent index
  const hash = tag.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const colorIndex = Math.abs(hash) % colors.length;
  const color = colors[colorIndex];

  return `bg-${color}-500/10 text-${color}-500 border-${color}-500/20`;
} 