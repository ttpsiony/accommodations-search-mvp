export type ApiError = Error & {
  status?: number;
  body?: unknown;
};

type ApiRequestOptions = {
  headers?: HeadersInit;
  signal?: AbortSignal;
};

const buildHeaders = (headers: HeadersInit | undefined, hasBody: boolean) => {
  if (!hasBody && !headers) {
    return undefined;
  }
  const next = new Headers(headers);
  if (hasBody && !next.has("Content-Type")) {
    next.set("Content-Type", "application/json");
  }
  return next;
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 204) {
    return null as T;
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return (await response.text()) as T;
};

const request = async <T>(
  url: string,
  {
    method = "GET",
    headers,
    body,
    signal,
  }: ApiRequestOptions & { method?: string; body?: unknown } = {}
): Promise<T> => {
  const hasBody = body !== undefined;
  const response = await fetch(url, {
    method,
    headers: buildHeaders(headers, hasBody),
    body: hasBody ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await parseResponse<unknown>(response);
    } catch {
      errorBody = undefined;
    }
    const message =
      typeof errorBody === "string"
        ? errorBody
        : (errorBody as { error?: string })?.error ?? response.statusText;
    const error = new Error(message) as ApiError;
    error.status = response.status;
    error.body = errorBody;
    throw error;
  }

  return parseResponse<T>(response);
};

export const API = {
  get<T>(url: string, options?: ApiRequestOptions) {
    return request<T>(url, { ...options, method: "GET" });
  },
  post<T>(url: string, body?: unknown, options?: ApiRequestOptions) {
    return request<T>(url, { ...options, method: "POST", body });
  },
  put<T>(url: string, body?: unknown, options?: ApiRequestOptions) {
    return request<T>(url, { ...options, method: "PUT", body });
  },
  delete<T>(url: string, options?: ApiRequestOptions) {
    return request<T>(url, { ...options, method: "DELETE" });
  },
};
