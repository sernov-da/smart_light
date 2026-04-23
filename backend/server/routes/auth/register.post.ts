//считывания json-исправил
//проверка на рукожопа есть, ну надо будет дать потестить как фронт накину
//401 затестить, КРИВЫЕ ДЖСОНЫ 
//токены вроде как с божьей помощью законнектил


import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { hashPassword, signAccessToken, signRefreshToken } from '../../lib/auth'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2).optional(),
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

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  })

  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: 'User already exists',
    })
  }

  const passwordHash = await hashPassword(data.password)

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
    },
  })

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