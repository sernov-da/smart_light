//батечка надзиратель проверяет путь то что нужно пропускает, иначе требует заголовое, мимикрирование протестить надо
//возможна подмена токена, нужны тесты, также почему-то старые пользователи не кладутся в евентовских юзеров

import { defineEventHandler, getHeader, createError } from 'h3'
import { verifyAccessToken } from '../lib/auth'

export default defineEventHandler(async (event) => {
  const path = event.path || event.node?.req?.url || ''

  if (path.startsWith('/_')) return

  // public routes
  if (path === '/' || path.startsWith('/health')) return
  if (path.startsWith('/auth/register')) return
  if (path.startsWith('/auth/login')) return
  if (path.startsWith('/auth/refresh')) return

  if (path.startsWith('/_openapi.json')) return
  if (path.startsWith('/_scalar')) return
  if (path.startsWith('/_ws')) return

  const authHeader = getHeader(event, 'authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const token = authHeader.slice('Bearer '.length)

  try {
    const payload = verifyAccessToken(token)

    ;(event.context as any).user = payload
  } catch {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid or expired token',
    })
  }
})