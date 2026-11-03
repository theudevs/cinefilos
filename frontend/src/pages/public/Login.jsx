import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login({
        email: formData.email.trim(),
        password: formData.password,
      })
      navigate(location.state?.from?.pathname ?? '/', { replace: true })
    } catch {
      setError('E-mail ou senha inválidos.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="login-title">
        <p className="eyebrow">Acesso</p>
        <h1 id="login-title">Entrar no CineWeb</h1>
        <p>Use uma conta admin para gerenciar filmes, salas, sessões e produtos.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            E-mail
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </label>

          {error && <span className="form-error">{error}</span>}

          <button className="primary-action" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <Link className="auth-link" to="/cadastro">
          Criar uma conta de cliente
        </Link>
      </section>
    </main>
  )
}
