import bcrypt from 'bcryptjs'
import jwt, { type SignOptions } from 'jsonwebtoken'

const accessSecret = process.env.JWT_ACCESS_SECRET || 'access_secret'
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh_secret'

const accessExpires = (process.env.JWT_ACCESS_EXPIRES || '15m') as SignOptions['expiresIn']
const refreshExpires = (process.env.JWT_REFRESH_EXPIRES || '30d') as SignOptions['expiresIn']

export type JwtPayload = {
  userId: string
  email: string
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}//hash

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}//proverka

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, accessSecret, {
    expiresIn: accessExpires,
  })
}//token, разобарться с гонкой, иногда багается(предположтьельно гонка, протестить)

export function signRefreshToken(payload: JwtPayload) {
  return jwt.sign(payload, refreshSecret, {
    expiresIn: refreshExpires,
  })
}//возможно гонка тут при обновлении, пока не разобрался

export function verifyAccessToken(token: string) {
  return jwt.verify(token, accessSecret) as JwtPayload
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, refreshSecret) as JwtPayload
}