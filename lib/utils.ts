import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number with commas for thousands, etc
 */
export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n)
}

/**
 * Creates a debounced function that delays invoking the provided function until after
 * the specified wait time has elapsed since the last time it was invoked.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function (...args: Parameters<T>): void {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

export const isDev = process.env.NODE_ENV === "development"

/**
 * Generates a UUID (Universally Unique Identifier) version 4.
 * A UUID v4 is a 128-bit number used to uniquely identify information in computer systems.
 * This version generates random UUIDs following RFC 4122.
 *
 * @returns {string} A string representing a UUID v4, in the format xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx,
 *                   where 'x' is any hexadecimal digit and 'y' is one of 8, 9, A, or B.
 *
 * @example
 * const uuid = generateUUID();
 * console.log(uuid); // e.g. '3b12f1df-5232-4e9f-bb6d-6d5c6ec9f53a'
 */
export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] % 16
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
