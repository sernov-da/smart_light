import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'

import { prisma } from '../../lib/prisma'
import { hashPassword } from '../../lib/auth'

import crypto from 'crypto'

const schema = z.object({
  email: z.string().email(),

  password: z
    .string()
    .min(
      6,
      'Password must be at least 6 characters',
    ),

  name: z.string().min(2).optional(),
})

export default defineEventHandler(
  async (event) => {
    const body = await readBody(event)

    let parsedBody: unknown = body

    if (typeof body === 'string') {
      try {
        parsedBody = JSON.parse(body)
      } catch {
        throw createError({
          statusCode: 400,

          statusMessage:
            'Body must be valid JSON',
        })
      }
    }

    const data = schema.parse(
      parsedBody,
    )

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email: data.email,
        },
      })

    if (existingUser) {
      throw createError({
        statusCode: 409,

        statusMessage:
          'User already exists',
      })
    }

    const passwordHash =
      await hashPassword(
        data.password,
      )

    const otpCode = crypto
      .randomInt(100000, 999999)
      .toString()

    const otpExpiresAt = new Date(
      Date.now() +
        15 * 60 * 1000,
    )

    const user =
      await prisma.user.create({
        data: {
          email: data.email,

          passwordHash,

          name: data.name,

          isVerified: false,

          otpCode,

          otpExpiresAt,
        },
      })

    console.log(
      'OTP CODE:',
      otpCode,
    )

    return {
      success: true,

      message:
        'Verification code sent',

      user: {
        id: user.id,

        email: user.email,

        name: user.name,
      },
    }
  },
)