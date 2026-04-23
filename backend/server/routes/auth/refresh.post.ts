//не успевает проверить не истёк ли токен, а сразу перезаписывает, возможно будет выброс с 401 ошибкой
//ну и гонка по старинке, я не знаю как это фиксить

import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '../../lib/auth'

const schema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const data = schema.parse(body)

  const existingToken = await prisma.refreshToken.findUnique({
    where: { token: data.refreshToken },
  })

  if (!existingToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid refresh token',
    })
  }

  if (existingToken.revokedAt) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Refresh token revoked',
    })
  }

  if (existingToken.expiresAt < new Date()) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Refresh token expired',
    })
  }

  let payload: { userId: string; email: string }

  try {
    payload = verifyRefreshToken(data.refreshToken)
  } catch {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid refresh token',
    })
  }

  await prisma.refreshToken.update({
    where: { token: data.refreshToken },
    data: {
      revokedAt: new Date(),
    },
  })

  const newAccessToken = signAccessToken({
    userId: payload.userId,
    email: payload.email,
  })

  const newRefreshToken = signRefreshToken({
    userId: payload.userId,
    email: payload.email,
  })

  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: payload.userId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  }
})