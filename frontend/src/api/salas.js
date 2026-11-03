import { http } from './http'

export function listarSalas() {
  return http('/salas')
}

export function criarSala(sala) {
  return http('/salas', {
    method: 'POST',
    body: JSON.stringify(sala),
  })
}

export function atualizarSala(id, sala) {
  return http(`/salas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(sala),
  })
}

export function removerSala(id) {
  return http(`/salas/${id}`, {
    method: 'DELETE',
  })
}
