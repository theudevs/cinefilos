import { useEffect, useMemo, useState } from 'react'
import { atualizarSala, criarSala, listarSalas, removerSala } from '../../api/salas'

const emptyForm = {
  numero: '',
  linhas: '',
  colunas: '',
}

function getSeatLabel(rowIndex, columnIndex) {
  let label = ''
  let current = rowIndex

  do {
    label = String.fromCharCode(65 + (current % 26)) + label
    current = Math.floor(current / 26) - 1
  } while (current >= 0)

  return `${label}${columnIndex + 1}`
}

function buildSeatPreview(linhas, colunas) {
  const rows = Number(linhas)
  const columns = Number(colunas)

  if (!rows || !columns || rows < 1 || columns < 1 || rows > 12 || columns > 18) {
    return []
  }

  return Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: columns }, (_, columnIndex) => getSeatLabel(rowIndex, columnIndex)),
  )
}

export function AdminSalas() {
  const [salas, setSalas] = useState([])
  const [formData, setFormData] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const seatPreview = useMemo(
    () => buildSeatPreview(formData.linhas, formData.colunas),
    [formData.linhas, formData.colunas],
  )

  const capacidade = Number(formData.linhas || 0) * Number(formData.colunas || 0)
  const isEditing = Boolean(editingId)

  async function loadSalas() {
    setIsLoading(true)
    setError('')

    try {
      const data = await listarSalas()
      setSalas(data)
    } catch {
      setError('Não foi possível carregar as salas.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSalas()
  }, [])

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  function resetForm() {
    setFormData(emptyForm)
    setEditingId(null)
  }

  function startEditing(sala) {
    setEditingId(sala.id)
    setFormData({
      numero: String(sala.numero),
      linhas: String(sala.linhas),
      colunas: String(sala.colunas),
    })
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
      if (isEditing) {
        await atualizarSala(editingId, { numero: Number(formData.numero) })
        setMessage('Sala atualizada com sucesso.')
      } else {
        await criarSala({
          numero: Number(formData.numero),
          linhas: Number(formData.linhas),
          colunas: Number(formData.colunas),
        })
        setMessage('Sala cadastrada com sucesso.')
      }

      resetForm()
      await loadSalas()
    } catch {
      setError('Não foi possível salvar a sala. Verifique se o número já está em uso.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(sala) {
    const confirmed = window.confirm(`Remover a sala ${sala.numero}?`)

    if (!confirmed) return

    setMessage('')
    setError('')

    try {
      await removerSala(sala.id)
      setMessage('Sala removida com sucesso.')
      await loadSalas()

      if (editingId === sala.id) {
        resetForm()
      }
    } catch {
      setError('Não foi possível remover. Verifique se a sala possui sessões cadastradas.')
    }
  }

  return (
    <main className="admin-page">
      <section className="admin-header">
        <div>
          <p className="eyebrow">Administração</p>
          <h1>Salas</h1>
        </div>
        <p>Cadastre a matriz de poltronas das salas disponíveis no cinema.</p>
      </section>

      <section className="admin-form-section" aria-labelledby="sala-form-title">
        <div className="form-heading">
          <h2 id="sala-form-title">{isEditing ? `Editar sala #${editingId}` : 'Cadastrar sala'}</h2>
          {isEditing && (
            <button type="button" className="ghost-button" onClick={resetForm}>
              Cancelar edição
            </button>
          )}
        </div>

        <form className="admin-form room-form" onSubmit={handleSubmit}>
          <label>
            Número da sala
            <input
              type="number"
              min="1"
              name="numero"
              value={formData.numero}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Linhas
            <input
              type="number"
              min="1"
              max="26"
              name="linhas"
              value={formData.linhas}
              onChange={handleChange}
              disabled={isEditing}
              required
            />
          </label>

          <label>
            Colunas
            <input
              type="number"
              min="1"
              max="30"
              name="colunas"
              value={formData.colunas}
              onChange={handleChange}
              disabled={isEditing}
              required
            />
          </label>

          <div className="room-summary">
            <span>Capacidade</span>
            <strong>{capacidade || 0}</strong>
            <small>{isEditing ? 'A matriz não pode ser alterada após o cadastro.' : 'linhas x colunas'}</small>
          </div>

          <div className="form-actions span-2">
            <button className="primary-action" type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Cadastrar sala'}
            </button>
            {message && <span className="success-message">{message}</span>}
            {error && <span className="form-error">{error}</span>}
          </div>
        </form>

        {seatPreview.length > 0 && (
          <div className="seat-map-preview" aria-label="Prévia da matriz de poltronas">
            <div className="screen-strip">Tela</div>
            {seatPreview.map((row, rowIndex) => (
              <div key={rowIndex} className="seat-map-row">
                {row.map((seat) => (
                  <span key={seat} className="seat-chip">
                    {seat}
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="admin-list-section" aria-labelledby="salas-list-title">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Mapa do cinema</p>
            <h2 id="salas-list-title">Salas cadastradas</h2>
          </div>
          <p>{salas.length} sala(s)</p>
        </div>

        {isLoading ? (
          <p className="empty-state">Carregando salas...</p>
        ) : salas.length === 0 ? (
          <p className="empty-state">Nenhuma sala cadastrada ainda.</p>
        ) : (
          <div className="admin-table">
            {salas.map((sala) => (
              <article key={sala.id} className="admin-row">
                <div className="admin-row-main">
                  <strong>Sala {sala.numero}</strong>
                  <span>
                    {sala.linhas} linha(s) x {sala.colunas} coluna(s)
                  </span>
                  <small>{sala.capacidade} poltronas cadastradas</small>
                </div>
                <div className="row-actions">
                  <button type="button" className="ghost-button" onClick={() => startEditing(sala)}>
                    Editar
                  </button>
                  <button type="button" className="danger-button" onClick={() => handleDelete(sala)}>
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
