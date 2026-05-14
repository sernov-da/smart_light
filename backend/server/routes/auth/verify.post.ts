import {
  defineEventHandler,
  readBody,
  createError,
} from 'h3'

import { prisma } from '../../lib/prisma'

import {
  signAccessToken,
  signRefreshToken,
} from '../../lib/auth'

export default defineEventHandler(
  async (event) => {
    const body = await readBody(event)

    const email = body.email
    const code = body.code

    const user =
      await prisma.user.findUnique({
        where: { email },
      })

    if (!user) {
      throw createError({
        statusCode: 404,

        statusMessage:
          'User not found',
      })
    }

    if (
      user.otpCode !== code ||
      !user.otpExpiresAt ||
      user.otpExpiresAt <
        new Date()
    ) {
      throw createError({
        statusCode: 400,

        statusMessage:
          'Invalid or expired code',
      })
    }

    await prisma.user.update({
      where: { email },

      data: {
        isVerified: true,

        otpCode: null,

        otpExpiresAt: null,
      },
    })

    const payload = {
      userId: user.id,
      email: user.email,
    }

    const accessToken =
      signAccessToken(payload)

    const refreshToken =
      signRefreshToken(payload)

    return {
      accessToken,
      refreshToken,
    }
  },
)