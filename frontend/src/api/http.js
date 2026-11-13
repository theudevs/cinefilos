const API_BASE_URL = 'http://localhost:3000'

export class HttpError extends Error {
  constructor(message, status, body = null) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.statusCode = status
    this.body = body
  }
}

export async function http(path, options = {}) {
  const token = localStorage.getItem('cineweb_token')
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorMessage = `Erro na requisição ${path}`
    let errorBody = null

    try {
      errorBody = await response.json()
      errorMessage = Array.isArray(errorBody.message)
        ? errorBody.message.join(' ')
        : errorBody.message || errorMessage
    } catch {
      errorMessage = response.statusText || errorMessage
    }

    if (response.status === 401) {
      localStorage.removeItem('cineweb_user')
      localStorage.removeItem('cineweb_token')
      errorMessage = 'Sua sessão expirou. Faça login novamente para finalizar o pedido.'
    }

    throw new HttpError(errorMessage, response.status, errorBody)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}
