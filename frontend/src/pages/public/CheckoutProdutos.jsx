import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { listarProdutos } from '../../api/produtos'
import { useCheckout } from '../../contexts/CheckoutContext'

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value ?? 0))
}

function getTipoLabel(tipo) {
  const labels = {
    ALIMENTO: 'Alimento',
    BEBIDA: 'Bebida',
    COMBO: 'Combo',
  }

  return labels[tipo] ?? tipo
}

function ProductImage({ produto }) {
  const [hasError, setHasError] = useState(false)

  if (!produto.imagemUrl || hasError) {
    return <div className="checkout-product-fallback">{produto.nome.slice(0, 2).toUpperCase()}</div>
  }

  return <img src={produto.imagemUrl} alt={produto.nome} onError={() => setHasError(true)} />
}

export function CheckoutProdutos() {
  const { sessaoId } = useParams()
  const navigate = useNavigate()
  const { checkout, total, addProduto, updateProdutoQuantidade, removeProduto } = useCheckout()
  const [produtos, setProdutos] = useState([])
  const [quantities, setQuantities] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProdutos() {
      setIsLoading(true)
      setError('')

      try {
        const data = await listarProdutos()
        setProdutos(data.filter((produto) => produto.ativo))
      } catch {
        setError('Não foi possível carregar os produtos.')
      } finally {
        setIsLoading(false)
      }
    }

    loadProdutos()
  }, [])

  function getQuantity(produtoId) {
    return quantities[produtoId] ?? 1
  }

  function setQuantity(produtoId, quantity) {
    setQuantities((current) => ({
      ...current,
      [produtoId]: Math.max(1, Number(quantity) || 1),
    }))
  }

  return (
    <main className="checkout-page">
      <section className="checkout-header">
        <div>
          <p className="eyebrow">Produtos</p>
          <h1>Bomboniere</h1>
          <p>Adicione alimentos, bebidas e combos ao pedido.</p>
        </div>
        <div className="checkout-steps">
          <span>Ingressos</span>
          <span className="active">Produtos</span>
          <span>Resumo</span>
        </div>
      </section>

      <section className="checkout-layout">
        <div className="checkout-products-panel">
          {isLoading ? (
            <p className="empty-state">Carregando produtos...</p>
          ) : error ? (
            <p className="form-error">{error}</p>
          ) : produtos.length === 0 ? (
            <p className="empty-state">Nenhum produto disponível no momento.</p>
          ) : (
            <div className="checkout-product-grid">
              {produtos.map((produto) => (
                <article key={produto.id} className="checkout-product-card">
                  <ProductImage produto={produto} />
                  <div className="checkout-product-body">
                    <div>
                      <span className="product-type">{getTipoLabel(produto.tipo)}</span>
                      <h3>{produto.nome}</h3>
                      <p>{produto.descricao}</p>
                    </div>
                    <strong>{formatCurrency(produto.valorUnitario)}</strong>
                    <div className="product-add-row">
                      <input
                        type="number"
                        min="1"
                        value={getQuantity(produto.id)}
                        onChange={(event) => setQuantity(produto.id, event.target.value)}
                        aria-label={`Quantidade de ${produto.nome}`}
                      />
                      <button
                        type="button"
                        className="primary-action"
                        onClick={() => addProduto(produto, getQuantity(produto.id))}
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="checkout-side-panel">
          <h2>Pedido atual</h2>

          <div className="checkout-mini-summary">
            <span>Ingressos</span>
            <strong>{checkout.ingressos.length}</strong>
          </div>

          <div className="cart-ticket-list">
            <h3>Produtos escolhidos</h3>
            {checkout.produtos.length === 0 ? (
              <p>Nenhum produto adicionado.</p>
            ) : (
              checkout.produtos.map((produto) => (
                <div key={produto.produtoId} className="cart-product-row">
                  <div>
                    <strong>{produto.nome}</strong>
                    <span>{formatCurrency(produto.valorUnitario)} cada</span>
                  </div>
                  <div className="cart-product-actions">
                    <input
                      type="number"
                      min="1"
                      value={produto.quantidade}
                      onChange={(event) =>
                        updateProdutoQuantidade(produto.produtoId, Number(event.target.value))
                      }
                      aria-label={`Quantidade de ${produto.nome}`}
                    />
                    <button type="button" onClick={() => removeProduto(produto.produtoId)}>
                      Remover
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="checkout-total-box">
            <span>Total parcial</span>
            <strong>{formatCurrency(total)}</strong>
          </div>

          <div className="checkout-actions">
            <Link className="secondary-dark-action" to={`/checkout/${sessaoId}/ingressos`}>
              Voltar para ingressos
            </Link>
            <button
              type="button"
              className="primary-action"
              disabled={checkout.ingressos.length === 0}
              onClick={() => navigate(`/checkout/${sessaoId}/resumo`)}
            >
              Avançar para resumo
            </button>
          </div>
        </aside>
      </section>
    </main>
  )
}
