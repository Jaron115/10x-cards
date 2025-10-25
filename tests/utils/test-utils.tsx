/**
 * Test utilities for React component testing
 */

import { render as rtlRender } from "@testing-library/react";
import type React from "react";

/**
 * Custom render function that wraps components with necessary providers
 */
export function render(ui: React.ReactElement, options?: Parameters<typeof rtlRender>[1]) {
  return rtlRender(ui, options);
}

/**
 * Wait utility for async operations in tests
 */
export const waitFor = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Mock local storage
 */
export const mockLocalStorage = () => {
  const storage: Record<string, string> = {};

  return {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => {
      storage[key] = value;
    },
    removeItem: (key: string) => {
      Reflect.deleteProperty(storage, key);
    },
    clear: () => {
      Object.keys(storage).forEach((key) => Reflect.deleteProperty(storage, key));
    },
  };
};

// Re-export everything from React Testing Library
export * from "@testing-library/react";
