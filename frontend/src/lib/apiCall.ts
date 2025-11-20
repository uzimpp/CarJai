// Secure API call helper - always uses relative URLs for same-origin cookies
export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Prepare headers - only set Content-Type for JSON, let browser set it for FormData
  const headers: Record<string, string> = {};

  // If body is not FormData, set JSON content type
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(endpoint, {
    headers: { ...headers, ...options.headers },
    credentials: "include", // Include cookies
    ...options,
  });

  // Read body ONCE, then try JSON; avoids "body stream already read"
  const rawText = await response.text();
  let data: unknown = null;

  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    // If JSON parsing fails, the server likely returned HTML or plain text due to backend is not running
    if (
      rawText.includes("Internal Server Error") ||
      rawText.includes("<!DOCTYPE")
    ) {
      throw new Error(
        "Backend server is not responding properly. Please check if the server is running."
      );
    }
    throw new Error(
      `Server returned invalid response: ${rawText.substring(0, 100)}...`
    );
  }

  if (!response.ok) {
    // Safely extract server-provided error/message if JSON object
    let serverMessage: string | undefined;
    if (typeof data === "object" && data !== null) {
      const d = data as { error?: unknown; message?: unknown };
      serverMessage =
        (typeof d.error === "string" && d.error) ||
        (typeof d.message === "string" && d.message) ||
        undefined;
    }

    const message =
      serverMessage ||
      (rawText && rawText.includes("Internal Server Error")
        ? "Internal Server Error - Backend may be down"
        : rawText || `HTTP ${response.status}`);
    throw new Error(message);
  }

  return data as T;
}
