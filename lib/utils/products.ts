/**
 * Formats a number for display (e.g., 1000 -> 1k)
 */
export const formatCount = (count: number): string => {
    if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
}; 