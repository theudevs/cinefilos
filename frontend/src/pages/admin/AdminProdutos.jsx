import { useEffect, useMemo, useState } from 'react'
import {
  atualizarProduto,
  criarProduto,
  listarProdutos,
  removerProduto,
} from '../../api/produtos'

const emptyForm = {
  nome: '',
  descricao: '',
  tipo: 'COMBO',
  imagemUrl: '',
  valorUnitario: '',
  ativo: true,
}

const tipos = [
  { value: 'ALIMENTO', label: 'Alimento' },
  { value: 'BEBIDA', label: 'Bebida' },
  { value: 'COMBO', label: 'Combo' },
]

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value ?? 0))
}

function getTipoLabel(value) {
  return tipos.find((tipo) => tipo.value === value)?.label ?? value
}

function toPayload(formData) {
  const payload = {
    ...formData,
    valorUnitario: Number(formData.valorUnitario),
    ativo: Boolean(formData.ativo),
  }

  if (!payload.imagemUrl.trim()) {
    delete payload.imagemUrl
  }

  return payload
}

function fromProduto(produto) {
  return {
    nome: produto.nome ?? '',
    descricao: produto.descricao ?? '',
    tipo: produto.tipo ?? 'COMBO',
    imagemUrl: produto.imagemUrl ?? '',
    valorUnitario: String(produto.valorUnitario ?? ''),
    ativo: produto.ativo ?? true,
  }
}

function ProductImage({ produto }) {
  const [hasError, setHasError] = useState(false)

  if (!produto.imagemUrl || hasError) {
    return <div className="product-image-fallback">{produto.nome.slice(0, 2).toUpperCase()}</div>
  }

  return <img src={produto.imagemUrl} alt={produto.nome} onError={() => setHasError(true)} />
}

export function AdminProdutos() {
  const [produtos, setProdutos] = useState([])
  const [formData, setFormData] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const isEditing = Boolean(editingId)

  const visibleProdutos = useMemo(
    () => produtos.filter((produto) => showInactive || produto.ativo),
    [produtos, showInactive],
  )

  async function loadProdutos() {
    setIsLoading(true)
    setError('')

    try {
      const data = await listarProdutos()
      setProdutos(data)
    } catch {
      setError('Não foi possível carregar os produtos.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProdutos()
  }, [])

  function handleChange(event) {
    const { name, type, checked, value } = event.target
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function resetForm() {
    setFormData(emptyForm)
    setEditingId(null)
  }

  function startEditing(produto) {
    setEditingId(produto.id)
    setFormData(fromProduto(produto))
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
        await atualizarProduto(editingId, payload)
        setMessage('Produto atualizado com sucesso.')
      } else {
        await criarProduto(payload)
        setMessage('Produto cadastrado com sucesso.')
      }

      resetForm()
      await loadProdutos()
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível salvar o produto.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(produto) {
    const confirmed = window.confirm(`Remover "${produto.nome}"?`)

    if (!confirmed) return

    setMessage('')
    setError('')

    try {
      const removed = await removerProduto(produto.id)
      setMessage(
        removed?.ativo === false
          ? 'Produto estava em pedido e foi marcado como inativo.'
          : 'Produto removido com sucesso.',
      )
      await loadProdutos()

      if (editingId === produto.id) {
        resetForm()
      }
    } catch {
      setError('Não foi possível remover o produto.')
    }
  }

  return (
    <main className="admin-page">
      <section className="admin-header">
        <div>
          <p className="eyebrow">Administração</p>
          <h1>Produtos</h1>
        </div>
        <p>Cadastre alimentos, bebidas e combos disponíveis na bomboniere.</p>
      </section>

      <section className="admin-form-section" aria-labelledby="produto-form-title">
        <div className="form-heading">
          <h2 id="produto-form-title">{isEditing ? `Editar produto #${editingId}` : 'Cadastrar produto'}</h2>
          {isEditing && (
            <button type="button" className="ghost-button" onClick={resetForm}>
              Cancelar edição
            </button>
          )}
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            Nome
            <input name="nome" value={formData.nome} onChange={handleChange} required />
          </label>

          <label>
            Tipo
            <select name="tipo" value={formData.tipo} onChange={handleChange} required>
              {tipos.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Valor unitário
            <input
              type="number"
              min="0.01"
              step="0.01"
              name="valorUnitario"
              value={formData.valorUnitario}
              onChange={handleChange}
              required
            />
          </label>

          <label className="switch-field">
            <input
              type="checkbox"
              name="ativo"
              checked={formData.ativo}
              onChange={handleChange}
            />
            Disponível para venda
          </label>

          <label className="span-2">
            URL da imagem
            <input
              type="url"
              name="imagemUrl"
              value={formData.imagemUrl}
              onChange={handleChange}
              placeholder="https://..."
            />
          </label>

          <label className="span-2">
            Descrição
            <textarea
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              rows={4}
              minLength={3}
              required
            />
          </label>

          <div className="form-actions span-2">
            <button className="primary-action" type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Cadastrar produto'}
            </button>
            {message && <span className="success-message">{message}</span>}
            {error && <span className="form-error">{error}</span>}
          </div>
        </form>
      </section>

      <section className="admin-list-section" aria-labelledby="produtos-list-title">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Bomboniere</p>
            <h2 id="produtos-list-title">Produtos cadastrados</h2>
          </div>
          <label className="inline-toggle">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(event) => setShowInactive(event.target.checked)}
            />
            Mostrar inativos
          </label>
        </div>

        {isLoading ? (
          <p className="empty-state">Carregando produtos...</p>
        ) : visibleProdutos.length === 0 ? (
          <p className="empty-state">Nenhum produto cadastrado ainda.</p>
        ) : (
          <div className="product-admin-grid">
            {visibleProdutos.map((produto) => (
              <article key={produto.id} className={produto.ativo ? 'product-admin-card' : 'product-admin-card inactive'}>
                <ProductImage produto={produto} />
                <div className="product-admin-body">
                  <div>
                    <span className="product-type">{getTipoLabel(produto.tipo)}</span>
                    <h3>{produto.nome}</h3>
                    <p>{produto.descricao}</p>
                  </div>
                  <strong>{formatCurrency(produto.valorUnitario)}</strong>
                  {!produto.ativo && <small className="inactive-label">Inativo</small>}
                  <div className="row-actions">
                    <button type="button" className="ghost-button" onClick={() => startEditing(produto)}>
                      Editar
                    </button>
                    <button type="button" className="danger-button" onClick={() => handleDelete(produto)}>
                      Remover
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
