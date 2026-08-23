/**
 * NexBank – Local Storage Helper Utilities
 */

/**
 * Retrieve and parse JSON item from localStorage safely
 * @param {string} key - Storage key name
 * @returns {any|null} Parsed data or null if not found/error
 */
export function getStorageItem(key) {
  if (!key || typeof key !== "string") {
    return null;
  }

  try {
    const rawData = localStorage.getItem(key);
    // Strict null check
    if (rawData === null || rawData === undefined) {
      return null;
    }
    return JSON.parse(rawData);
  } catch (error) {
    console.error(`Error reading key "${key}" from localStorage:`, error);
    return null;
  }
}

/**
 * Serialize and save JSON item into localStorage safely
 * @param {string} key - Storage key name
 * @param {any} value - Value to store
 * @returns {boolean} True if write was successful, false otherwise
 */
export function setStorageItem(key, value) {
  if (!key || typeof key !== "string") {
    return false;
  }

  try {
    const serializedData = JSON.stringify(value);
    localStorage.setItem(key, serializedData);
    return true;
  } catch (error) {
    console.error(`Error writing key "${key}" to localStorage:`, error);
    return false;
  }
}

/**
 * Remove an item from localStorage
 * @param {string} key - Storage key name
 * @returns {boolean} True if removed
 */
export function removeStorageItem(key) {
  if (!key) {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing key "${key}" from localStorage:`, error);
    return false;
  }
}

/**
 * Clear all NexBank related items from localStorage
 */
export function clearAllStorage() {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error("Error clearing localStorage:", error);
    return false;
  }
}
