import { createContext, useContext, useMemo, useState } from 'react'
import { login as loginRequest } from '../api/auth'

const AuthContext = createContext(null)

function getStoredUser() {
  const storedUser = localStorage.getItem('cineweb_user')
  const storedToken = localStorage.getItem('cineweb_token')

  if (!storedUser || !storedToken) {
    localStorage.removeItem('cineweb_user')
    localStorage.removeItem('cineweb_token')
    return null
  }

  try {
    return JSON.parse(storedUser)
  } catch {
    localStorage.removeItem('cineweb_user')
    localStorage.removeItem('cineweb_token')
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser)

  async function login(credentials) {
    const data = await loginRequest(credentials)

    localStorage.setItem('cineweb_token', data.access_token)
    localStorage.setItem('cineweb_user', JSON.stringify(data.user))
    setUser(data.user)

    return data.user
  }

  function logout() {
    localStorage.removeItem('cineweb_token')
    localStorage.removeItem('cineweb_user')
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user) && Boolean(localStorage.getItem('cineweb_token')),
      isAdmin: user?.profile === 'ADMIN',
      login,
      logout,
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }

  return context
}
