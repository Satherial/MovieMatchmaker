/**
 * Utility for processing API errors to extract clean error messages
 */

/**
 * Extract a clean error message from any error object or response
 */
export function extractErrorMessage(error: any): string {
  // Default fallback message if we can't extract a better one
  let message = "An error occurred";
  
  // Handle standard Error objects
  if (error instanceof Error) {
    const errorText = error.message;
    
    // Check for JSON-like error message
    if (errorText.includes('"error"')) {
      try {
        // Try to extract the message from {"error":"..."} format
        const matches = errorText.match(/"error":"([^"]+)"/);
        if (matches && matches[1]) {
          return matches[1]; // Return the captured message
        }
      } catch (e) {
        // Failed to parse JSON, fallback to the full message
      }
    }
    
    // Fallback to the full error message
    return errorText;
  }
  
  // Handle Error-like objects with message property
  if (error && typeof error === 'object' && 'message' in error) {
    return extractErrorMessage(error.message);
  }
  
  // Handle Response-like objects
  if (error && typeof error === 'object' && 'data' in error) {
    if (error.data && typeof error.data === 'object' && 'error' in error.data) {
      return String(error.data.error);
    }
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  return message;
}