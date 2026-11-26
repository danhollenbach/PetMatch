export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly queries: string[]
  constructor(message: string, status = 0, code?: string, queries: string[] = []) {
    super(message)
    this.status = status; this.code = code; this.queries = queries
  }
}
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, { ...init, headers: {
      ...(init.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}), ...init.headers,
    } })
  } catch {
    throw new ApiError("Não foi possível conectar à API. Verifique se o backend está iniciado.")
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new ApiError(error.code === "SQL_NOT_IMPLEMENTED"
      ? "Esta operação aguarda a implementação das consultas SQL."
      : Array.isArray(error.message) ? error.message.join(" ") : error.message || "Não foi possível concluir a operação.",
      response.status, error.code, error.queries ?? [])
  }
  return response.status === 204 ? undefined as T : response.json()
}
export const json = (method: string, body?: unknown): RequestInit => ({ method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
