//ВСЁ ПРИВЯЗТЬ К АЙДИ, НЕ СОЗДАВАТЬ НОВЫЕ АЙДИ ДЛЯ КОНТЕКСТА, БРАТЬ СТАРЫЕ
//ПОТОМ КАК УСТРОЙСТВА БУДУТ ТАКЖЕ СЮДА ИХ ВЯЗАТЬ
import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '../../lib/prisma'

export default defineEventHandler(async (event) => {
  const userId = (event.context as any).user?.userId

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
    })
  }

  return user
})