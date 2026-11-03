import { http } from './http'

export function listarPedidos(filmeId) {
  const query = filmeId ? `?filmeId=${filmeId}` : ''
  return http(`/pedidos${query}`)
}

export function criarPedido(pedido) {
  return http('/pedidos', {
    method: 'POST',
    body: JSON.stringify(pedido),
  })
}

export function finalizarPedido(pedido) {
  return http('/pedidos/finalizar', {
    method: 'POST',
    body: JSON.stringify(pedido),
  })
}

export function pagarPedido(id) {
  return http(`/pedidos/${id}/pagar`, {
    method: 'PATCH',
  })
}

export function cancelarPedido(id) {
  return http(`/pedidos/${id}`, {
    method: 'DELETE',
  })
}
