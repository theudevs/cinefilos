import { http } from './http'

export function listarProdutos() {
  return http('/produtos')
}

export function criarProduto(produto) {
  return http('/produtos', {
    method: 'POST',
    body: JSON.stringify(produto),
  })
}

export function atualizarProduto(id, produto) {
  return http(`/produtos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(produto),
  })
}

export function removerProduto(id) {
  return http(`/produtos/${id}`, {
    method: 'DELETE',
  })
}
