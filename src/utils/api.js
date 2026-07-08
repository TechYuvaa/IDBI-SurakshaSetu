/**
 * Robust fetch wrapper implementing Phase 3 Zero Trust error boundary.
 * Validates contentType headers and checks response.ok status before parsing JSON payload.
 */
export const safeFetch = async (url, options = {}) => {
  const response = await fetch(url, options);
  
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  
  if (!response.ok) {
    let errorMessage = `HTTP Request Failed (Status: ${response.status})`;
    
    if (isJson) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // Fallback if JSON parse fails inside error handler
      }
    } else {
      try {
        const text = await response.text();
        // Log non-JSON HTML/plain error page details securely to console
        console.error(`[API Error] Received non-JSON error from [${url}]:`, text);
        // Expose a short excerpt of the raw error page or status text
        errorMessage = text.slice(0, 150).trim() || response.statusText || errorMessage;
      } catch (e) {
        // Fallback if read text fails
      }
    }
    throw new Error(errorMessage);
  }
  
  if (isJson) {
    return await response.json();
  }
  
  try {
    return await response.text();
  } catch (e) {
    return null;
  }
};
