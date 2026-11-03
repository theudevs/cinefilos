import { createContext, useContext, useMemo, useState } from 'react'

const STORAGE_KEY = 'cineweb_checkout'
const CheckoutContext = createContext(null)

const initialCheckout = {
  sessaoId: null,
  sessao: null,
  ingressos: [],
  produtos: [],
}

function readCheckout() {
  const stored = sessionStorage.getItem(STORAGE_KEY)

  if (!stored) return initialCheckout

  try {
    return { ...initialCheckout, ...JSON.parse(stored) }
  } catch {
    sessionStorage.removeItem(STORAGE_KEY)
    return initialCheckout
  }
}

function writeCheckout(checkout) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(checkout))
}

export function CheckoutProvider({ children }) {
  const [checkout, setCheckout] = useState(readCheckout)

  function updateCheckout(updater) {
    setCheckout((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater
      writeCheckout(next)
      return next
    })
  }

  function startCheckout(sessao) {
    updateCheckout((current) => {
      if (current.sessaoId === sessao.id) {
        return { ...current, sessaoId: sessao.id, sessao }
      }

      return {
        ...initialCheckout,
        sessaoId: sessao.id,
        sessao,
      }
    })
  }

  function addIngresso(ingresso) {
    updateCheckout((current) => ({
      ...current,
      ingressos: [...current.ingressos, ingresso],
    }))
  }

  function removeIngresso(poltronaId) {
    updateCheckout((current) => ({
      ...current,
      ingressos: current.ingressos.filter((ingresso) => ingresso.poltronaId !== poltronaId),
    }))
  }

  function addProduto(produto, quantidade = 1) {
    updateCheckout((current) => {
      const existingProduct = current.produtos.find((item) => item.produtoId === produto.id)

      if (existingProduct) {
        return {
          ...current,
          produtos: current.produtos.map((item) =>
            item.produtoId === produto.id
              ? { ...item, quantidade: item.quantidade + quantidade }
              : item,
          ),
        }
      }

      return {
        ...current,
        produtos: [
          ...current.produtos,
          {
            produtoId: produto.id,
            nome: produto.nome,
            tipo: produto.tipo,
            quantidade,
            valorUnitario: Number(produto.valorUnitario),
          },
        ],
      }
    })
  }

  function updateProdutoQuantidade(produtoId, quantidade) {
    updateCheckout((current) => ({
      ...current,
      produtos: current.produtos
        .map((produto) =>
          produto.produtoId === produtoId ? { ...produto, quantidade } : produto,
        )
        .filter((produto) => produto.quantidade > 0),
    }))
  }

  function removeProduto(produtoId) {
    updateCheckout((current) => ({
      ...current,
      produtos: current.produtos.filter((produto) => produto.produtoId !== produtoId),
    }))
  }

  function clearCheckout() {
    sessionStorage.removeItem(STORAGE_KEY)
    setCheckout(initialCheckout)
  }

  const total = useMemo(() => {
    const ingressosTotal = checkout.ingressos.reduce((sum, ingresso) => sum + Number(ingresso.valor), 0)
    const produtosTotal = checkout.produtos.reduce(
      (sum, produto) => sum + Number(produto.valorUnitario) * Number(produto.quantidade),
      0,
    )

    return ingressosTotal + produtosTotal
  }, [checkout.ingressos, checkout.produtos])

  const value = useMemo(
    () => ({
      checkout,
      total,
      startCheckout,
      addIngresso,
      removeIngresso,
      addProduto,
      updateProdutoQuantidade,
      removeProduto,
      clearCheckout,
    }),
    [checkout, total],
  )

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>
}

export function useCheckout() {
  const context = useContext(CheckoutContext)

  if (!context) {
    throw new Error('useCheckout deve ser usado dentro de CheckoutProvider')
  }

  return context
}
