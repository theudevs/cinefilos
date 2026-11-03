import { http } from './http'

export function listarSessoes() {
  return http('/sessoes')
}

export function listarSessoesPorFilme(filmeId) {
  return http(`/sessoes?filmeId=${filmeId}`)
}

export function buscarSessao(id) {
  return http(`/sessoes/${id}`)
}

export function listarPoltronasSessao(id) {
  return http(`/sessoes/${id}/poltronas`)
}

export function criarSessao(sessao) {
  return http('/sessoes', {
    method: 'POST',
    body: JSON.stringify(sessao),
  })
}

export function atualizarSessao(id, sessao) {
  return http(`/sessoes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(sessao),
  })
}

export function removerSessao(id) {
  return http(`/sessoes/${id}`, {
    method: 'DELETE',
  })
}
