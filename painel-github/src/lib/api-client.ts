/*
 * Seguro para o client — nada sensível aqui (ver docs/ARCHITECTURE.md).
 * X-Local-Client reforça a checagem de origem em requisições que por
 * algum motivo não carregam Sec-Fetch-Site/Origin — ver
 * src/server/guards.ts, requireSameOrigin.
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public field?: string,
  ) {
    super(message);
  }
}

interface ApiErrorBody {
  error: { code: string; message: string; field?: string };
}

async function apiWrite<T>(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body: unknown,
): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Local-Client": "1",
    },
    body: JSON.stringify(body),
    credentials: "same-origin",
  });

  const data = await response.json();

  if (!response.ok) {
    const errorBody = data as ApiErrorBody;
    throw new ApiError(
      response.status,
      errorBody.error?.code ?? "UNKNOWN_ERROR",
      errorBody.error?.message ?? "Erro desconhecido.",
      errorBody.error?.field,
    );
  }

  return data as T;
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiWrite<T>("POST", path, body);
}

export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return apiWrite<T>("PUT", path, body);
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiWrite<T>("PATCH", path, body);
}

export function apiDelete<T>(path: string, body: unknown): Promise<T> {
  return apiWrite<T>("DELETE", path, body);
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    credentials: "same-origin",
  });
  return response.json() as Promise<T>;
}
