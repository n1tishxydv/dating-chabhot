export const fetchWithRetry = async (url, options = {}, retries = 3, timeoutMs = 15000) => {
  const attemptFetch = async (attempt) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.success === false) {
        throw new Error(data.reply ? data.reply[0] : "API logic failed");
      }

      return data;
    } catch (error) {
      clearTimeout(id);
      
      // Don't retry if we've exhausted retries
      if (attempt >= retries) {
        throw new Error("Still connecting... give me a moment");
      }
      
      // Wait 3 seconds before retrying
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return attemptFetch(attempt + 1);
    }
  };

  return attemptFetch(1);
};
