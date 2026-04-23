//гонка на рефреше- исправить



import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { verifyPassword, signAccessToken, signRefreshToken } from '../../lib/auth'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  let parsedBody: unknown = body

  if (typeof body === 'string') {
    try {
      parsedBody = JSON.parse(body)
    } catch {
      throw createError({
        statusCode: 400,
        statusMessage: 'Body must be valid JSON',
      })
    }
  }

  const data = schema.parse(parsedBody)

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials',
    })
  }

  const isValidPassword = await verifyPassword(data.password, user.passwordHash)

  if (!isValidPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials',
    })
  }

  const payload = {
    userId: user.id,
    email: user.email,
  }

  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    accessToken,
    refreshToken,
  }
})