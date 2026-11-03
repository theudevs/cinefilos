import { http } from './http'

export function criarUsuario(usuario) {
  return http('/users', {
    method: 'POST',
    body: JSON.stringify(usuario),
  })
}
