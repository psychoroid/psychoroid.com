import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Existing utility function
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// New utility functions or constants
export const initialState = {
  theme: "system",
  setTheme: () => null,
};

export type Theme = "dark" | "light" | "system";

export type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

export function formatNumber(value: number): string {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}