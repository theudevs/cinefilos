import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { criarUsuario } from '../../api/users'
import { useAuth } from '../../contexts/AuthContext'

export function Cadastro() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
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

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não conferem.')
      return
    }

    setIsSubmitting(true)

    try {
      const credentials = {
        email: formData.email.trim(),
        password: formData.password,
      }

      await criarUsuario({
        name: formData.name.trim(),
        ...credentials,
      })
      await login(credentials)
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível criar sua conta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="cadastro-title">
        <p className="eyebrow">Conta</p>
        <h1 id="cadastro-title">Criar conta</h1>
        <p>Cadastre-se como cliente para comprar ingressos e acompanhar seus pedidos.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Nome
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </label>

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
              minLength={6}
              required
            />
          </label>

          <label>
            Confirmar senha
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              minLength={6}
              required
            />
          </label>

          {error && <span className="form-error">{error}</span>}

          <button className="primary-action" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <Link className="auth-link" to="/login">
          Já tenho uma conta
        </Link>
      </section>
    </main>
  )
}
