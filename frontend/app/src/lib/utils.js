import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn's class-merge helper: conditional classes via clsx, then
 *  tailwind-merge resolves conflicting Tailwind utilities so the last one
 *  actually wins. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
