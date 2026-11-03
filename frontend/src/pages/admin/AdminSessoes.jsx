import { useEffect, useMemo, useState } from 'react'
import { listarFilmes } from '../../api/filmes'
import { listarSalas } from '../../api/salas'
import {
  atualizarSessao,
  criarSessao,
  listarSessoes,
  removerSessao,
} from '../../api/sessoes'

const emptyForm = {
  filmeId: '',
  salaId: '',
  horarioExibicao: '',
  valorInteira: '',
  valorMeia: '',
}

function toDatetimeLocalValue(date) {
  if (!date) return ''

  const parsed = new Date(date)
  const offset = parsed.getTimezoneOffset()
  const localDate = new Date(parsed.getTime() - offset * 60 * 1000)
  return localDate.toISOString().slice(0, 16)
}

function toPayload(formData) {
  return {
    filmeId: Number(formData.filmeId),
    salaId: Number(formData.salaId),
    horarioExibicao: new Date(formData.horarioExibicao).toISOString(),
    valorInteira: Number(formData.valorInteira),
    valorMeia: Number(formData.valorMeia),
  }
}

function fromSessao(sessao) {
  return {
    filmeId: String(sessao.filmeId),
    salaId: String(sessao.salaId),
    horarioExibicao: toDatetimeLocalValue(sessao.horarioExibicao),
    valorInteira: String(sessao.valorInteira),
    valorMeia: String(sessao.valorMeia),
  }
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date))
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value ?? 0))
}

function getErrorMessage(error) {
  return error?.message || 'Não foi possível salvar a sessão. Confira os dados informados.'
}

export function AdminSessoes() {
  const [filmes, setFilmes] = useState([])
  const [salas, setSalas] = useState([])
  const [sessoes, setSessoes] = useState([])
  const [formData, setFormData] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const isEditing = Boolean(editingId)

  const selectedFilme = useMemo(
    () => filmes.find((filme) => filme.id === Number(formData.filmeId)),
    [filmes, formData.filmeId],
  )

  const selectedSala = useMemo(
    () => salas.find((sala) => sala.id === Number(formData.salaId)),
    [salas, formData.salaId],
  )

  async function loadData() {
    setIsLoading(true)
    setError('')

    try {
      const [filmesData, salasData, sessoesData] = await Promise.all([
        listarFilmes(),
        listarSalas(),
        listarSessoes(),
      ])

      setFilmes(filmesData)
      setSalas(salasData)
      setSessoes(sessoesData)
    } catch {
      setError('Não foi possível carregar filmes, salas e sessões.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  function resetForm() {
    setFormData(emptyForm)
    setEditingId(null)
  }

  function startEditing(sessao) {
    setEditingId(sessao.id)
    setFormData(fromSessao(sessao))
    setMessage('')
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')
    setIsSaving(true)

    try {
      const payload = toPayload(formData)

      if (isEditing) {
        await atualizarSessao(editingId, payload)
        setMessage('Sessão atualizada com sucesso.')
      } else {
        await criarSessao(payload)
        setMessage('Sessão cadastrada com sucesso.')
      }

      resetForm()
      await loadData()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(sessao) {
    const title = sessao.filme?.titulo ?? `Sessão #${sessao.id}`
    const confirmed = window.confirm(`Remover ${title}?`)

    if (!confirmed) return

    setMessage('')
    setError('')

    try {
      await removerSessao(sessao.id)
      setMessage('Sessão removida com sucesso.')
      await loadData()

      if (editingId === sessao.id) {
        resetForm()
      }
    } catch {
      setError('Não foi possível remover. Verifique se a sessão possui ingressos vendidos.')
    }
  }

  return (
    <main className="admin-page">
      <section className="admin-header">
        <div>
          <p className="eyebrow">Administração</p>
          <h1>Sessões</h1>
        </div>
        <p>Agende sessões por filme, sala, horário e valor dos ingressos.</p>
      </section>

      <section className="admin-form-section" aria-labelledby="sessao-form-title">
        <div className="form-heading">
          <h2 id="sessao-form-title">{isEditing ? `Editar sessão #${editingId}` : 'Cadastrar sessão'}</h2>
          {isEditing && (
            <button type="button" className="ghost-button" onClick={resetForm}>
              Cancelar edição
            </button>
          )}
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            Filme
            <select name="filmeId" value={formData.filmeId} onChange={handleChange} required>
              <option value="">Selecione...</option>
              {filmes.map((filme) => (
                <option key={filme.id} value={filme.id}>
                  {filme.titulo}
                </option>
              ))}
            </select>
          </label>

          <label>
            Sala
            <select name="salaId" value={formData.salaId} onChange={handleChange} required>
              <option value="">Selecione...</option>
              {salas.map((sala) => (
                <option key={sala.id} value={sala.id}>
                  Sala {sala.numero} - {sala.capacidade} lugares
                </option>
              ))}
            </select>
          </label>

          <label>
            Data e horário
            <input
              type="datetime-local"
              name="horarioExibicao"
              value={formData.horarioExibicao}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Valor inteira
            <input
              type="number"
              min="0.01"
              step="0.01"
              name="valorInteira"
              value={formData.valorInteira}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Valor meia
            <input
              type="number"
              min="0.01"
              step="0.01"
              name="valorMeia"
              value={formData.valorMeia}
              onChange={handleChange}
              required
            />
          </label>

          <div className="session-summary span-2">
            <span>Resumo</span>
            <strong>{selectedFilme?.titulo ?? 'Filme não selecionado'}</strong>
            <small>{selectedSala ? `Sala ${selectedSala.numero}` : 'Sala não selecionada'}</small>
          </div>

          <div className="form-actions span-2">
            <button className="primary-action" type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Cadastrar sessão'}
            </button>
            {message && <span className="success-message">{message}</span>}
            {error && <span className="form-error">{error}</span>}
          </div>
        </form>
      </section>

      <section className="admin-list-section" aria-labelledby="sessoes-list-title">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Agenda</p>
            <h2 id="sessoes-list-title">Sessões cadastradas</h2>
          </div>
          <p>{sessoes.length} sessão(ões)</p>
        </div>

        {isLoading ? (
          <p className="empty-state">Carregando sessões...</p>
        ) : sessoes.length === 0 ? (
          <p className="empty-state">Nenhuma sessão cadastrada ainda.</p>
        ) : (
          <div className="admin-table">
            {sessoes.map((sessao) => (
              <article key={sessao.id} className="admin-row">
                <div className="admin-row-main">
                  <strong>{sessao.filme?.titulo ?? `Filme #${sessao.filmeId}`}</strong>
                  <span>
                    Sala {sessao.sala?.numero ?? sessao.salaId} • {formatDateTime(sessao.horarioExibicao)}
                  </span>
                  <small>
                    Inteira {formatCurrency(sessao.valorInteira)} • Meia {formatCurrency(sessao.valorMeia)}
                  </small>
                </div>
                <div className="row-actions">
                  <button type="button" className="ghost-button" onClick={() => startEditing(sessao)}>
                    Editar
                  </button>
                  <button type="button" className="danger-button" onClick={() => handleDelete(sessao)}>
                    Remover
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
