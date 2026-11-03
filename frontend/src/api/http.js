const API_BASE_URL = 'http://localhost:3000'

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

    try {
      const errorBody = await response.json()
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

    throw new Error(errorMessage)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}
