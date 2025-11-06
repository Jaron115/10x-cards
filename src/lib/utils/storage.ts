/**
 * LocalStorage utilities with error handling
 * Safe wrappers around localStorage that handle exceptions
 */

/**
 * Safely get an item from localStorage
 *
 * @param key - Storage key
 * @param defaultValue - Default value if key doesn't exist or error occurs
 * @returns Stored value or default value
 */
export const getStorageItem = (key: string, defaultValue: string | null = null): string | null => {
  if (typeof window === "undefined") {
    return defaultValue;
  }

  try {
    return localStorage.getItem(key) ?? defaultValue;
  } catch (error) {
    console.warn(`Failed to read from localStorage: ${key}`, error);
    return defaultValue;
  }
};

/**
 * Safely set an item in localStorage
 *
 * @param key - Storage key
 * @param value - Value to store
 * @returns true if successful, false otherwise
 */
export const setStorageItem = (key: string, value: string): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Failed to write to localStorage: ${key}`, error);
    return false;
  }
};

/**
 * Safely remove an item from localStorage
 *
 * @param key - Storage key
 * @returns true if successful, false otherwise
 */
export const removeStorageItem = (key: string): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove from localStorage: ${key}`, error);
    return false;
  }
};

/**
 * Safely get a boolean value from localStorage
 *
 * @param key - Storage key
 * @param defaultValue - Default value if key doesn't exist or error occurs
 * @returns Boolean value or default value
 */
export const getStorageBoolean = (key: string, defaultValue = false): boolean => {
  const value = getStorageItem(key);
  return value === "true" ? true : value === "false" ? false : defaultValue;
};

/**
 * Safely set a boolean value in localStorage
 *
 * @param key - Storage key
 * @param value - Boolean value to store
 * @returns true if successful, false otherwise
 */
export const setStorageBoolean = (key: string, value: boolean): boolean => {
  return setStorageItem(key, value.toString());
};
