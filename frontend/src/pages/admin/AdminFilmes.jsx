import { useEffect, useMemo, useState } from 'react'
import {
  atualizarFilme,
  criarFilme,
  listarFilmes,
  removerFilme,
} from '../../api/filmes'

const emptyForm = {
  titulo: '',
  sinopse: '',
  classificacao: '',
  duracao: '',
  elenco: '',
  genero: 'ACAO',
  cartazUrl: '',
  dataInicioExibicao: '',
  dataFinalExibicao: '',
}

const generos = [
  { value: 'ACAO', label: 'Ação' },
  { value: 'COMEDIA', label: 'Comédia' },
  { value: 'DRAMA', label: 'Drama' },
  { value: 'TERROR', label: 'Terror' },
  { value: 'ANIMACAO', label: 'Animação' },
  { value: 'SUSPENSE', label: 'Suspense' },
  { value: 'ROMANCE', label: 'Romance' },
  { value: 'DOCUMENTARIO', label: 'Documentário' },
]

function toDateInputValue(date) {
  if (!date) return ''
  return new Date(date).toISOString().slice(0, 10)
}

function toPayload(formData) {
  const payload = {
    ...formData,
    duracao: Number(formData.duracao),
    dataInicioExibicao: new Date(`${formData.dataInicioExibicao}T00:00:00`).toISOString(),
    dataFinalExibicao: new Date(`${formData.dataFinalExibicao}T23:59:59`).toISOString(),
  }

  if (!payload.cartazUrl.trim()) {
    delete payload.cartazUrl
  }

  return payload
}

function fromFilme(filme) {
  return {
    titulo: filme.titulo ?? '',
    sinopse: filme.sinopse ?? '',
    classificacao: filme.classificacao ?? '',
    duracao: String(filme.duracao ?? ''),
    elenco: filme.elenco ?? '',
    genero: filme.genero ?? 'ACAO',
    cartazUrl: filme.cartazUrl ?? '',
    dataInicioExibicao: toDateInputValue(filme.dataInicioExibicao),
    dataFinalExibicao: toDateInputValue(filme.dataFinalExibicao),
  }
}

function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}

export function AdminFilmes() {
  const [filmes, setFilmes] = useState([])
  const [formData, setFormData] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const formTitle = useMemo(
    () => (editingId ? `Editar filme #${editingId}` : 'Cadastrar filme'),
    [editingId],
  )

  async function loadFilmes() {
    setIsLoading(true)
    setError('')

    try {
      const data = await listarFilmes()
      setFilmes(data)
    } catch {
      setError('Não foi possível carregar os filmes.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFilmes()
  }, [])

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  function resetForm() {
    setFormData(emptyForm)
    setEditingId(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')
    setIsSaving(true)

    try {
      const payload = toPayload(formData)

      if (editingId) {
        await atualizarFilme(editingId, payload)
        setMessage('Filme atualizado com sucesso.')
      } else {
        await criarFilme(payload)
        setMessage('Filme cadastrado com sucesso.')
      }

      resetForm()
      await loadFilmes()
    } catch {
      setError('Não foi possível salvar o filme. Confira os dados e seu login admin.')
    } finally {
      setIsSaving(false)
    }
  }

  function startEditing(filme) {
    setEditingId(filme.id)
    setFormData(fromFilme(filme))
    setMessage('')
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(filme) {
    const confirmed = window.confirm(`Remover "${filme.titulo}"?`)

    if (!confirmed) return

    setMessage('')
    setError('')

    try {
      await removerFilme(filme.id)
      setMessage('Filme removido com sucesso.')
      await loadFilmes()

      if (editingId === filme.id) {
        resetForm()
      }
    } catch {
      setError('Não foi possível remover. Verifique se o filme possui sessões cadastradas.')
    }
  }

  return (
    <main className="admin-page">
      <section className="admin-header">
        <div>
          <p className="eyebrow">Administração</p>
          <h1>Filmes</h1>
        </div>
        <p>Cadastre os filmes em cartaz e mantenha os dados visíveis para o cliente.</p>
      </section>

      <section className="admin-form-section" aria-labelledby="filme-form-title">
        <div className="form-heading">
          <h2 id="filme-form-title">{formTitle}</h2>
          {editingId && (
            <button type="button" className="ghost-button" onClick={resetForm}>
              Cancelar edição
            </button>
          )}
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            Título
            <input name="titulo" value={formData.titulo} onChange={handleChange} required />
          </label>

          <label>
            Classificação
            <input
              name="classificacao"
              value={formData.classificacao}
              onChange={handleChange}
              placeholder="12 anos"
              required
            />
          </label>

          <label>
            Duração em minutos
            <input
              type="number"
              min="1"
              name="duracao"
              value={formData.duracao}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Gênero
            <select name="genero" value={formData.genero} onChange={handleChange} required>
              {generos.map((genero) => (
                <option key={genero.value} value={genero.value}>
                  {genero.label}
                </option>
              ))}
            </select>
          </label>

          <label className="span-2">
            Elenco
            <input name="elenco" value={formData.elenco} onChange={handleChange} required />
          </label>

          <label className="span-2">
            URL do cartaz
            <input
              type="url"
              name="cartazUrl"
              value={formData.cartazUrl}
              onChange={handleChange}
              placeholder="https://..."
            />
          </label>

          <label>
            Início de exibição
            <input
              type="date"
              name="dataInicioExibicao"
              value={formData.dataInicioExibicao}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Fim de exibição
            <input
              type="date"
              name="dataFinalExibicao"
              value={formData.dataFinalExibicao}
              onChange={handleChange}
              required
            />
          </label>

          <label className="span-2">
            Sinopse
            <textarea
              name="sinopse"
              value={formData.sinopse}
              onChange={handleChange}
              minLength={10}
              rows={4}
              required
            />
          </label>

          <div className="form-actions span-2">
            <button className="primary-action" type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Cadastrar filme'}
            </button>
            {message && <span className="success-message">{message}</span>}
            {error && <span className="form-error">{error}</span>}
          </div>
        </form>
      </section>

      <section className="admin-list-section" aria-labelledby="filmes-list-title">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Catálogo</p>
            <h2 id="filmes-list-title">Filmes cadastrados</h2>
          </div>
          <p>{filmes.length} filme(s)</p>
        </div>

        {isLoading ? (
          <p className="empty-state">Carregando filmes...</p>
        ) : filmes.length === 0 ? (
          <p className="empty-state">Nenhum filme cadastrado ainda.</p>
        ) : (
          <div className="admin-table">
            {filmes.map((filme) => (
              <article key={filme.id} className="admin-row">
                <div className="admin-row-main">
                  <strong>{filme.titulo}</strong>
                  <span>
                    {filme.genero} • {filme.duracao} min • {filme.classificacao}
                  </span>
                  <small>
                    Exibição: {formatDate(filme.dataInicioExibicao)} até{' '}
                    {formatDate(filme.dataFinalExibicao)}
                  </small>
                </div>
                <div className="row-actions">
                  <button type="button" className="ghost-button" onClick={() => startEditing(filme)}>
                    Editar
                  </button>
                  <button type="button" className="danger-button" onClick={() => handleDelete(filme)}>
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
