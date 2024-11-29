import bcrypt from "bcrypt"
import jwt, { JwtPayload } from "jsonwebtoken"

// Code sourced from Lecture 6 Repl

const BCRYPT_SALT_ROUNDS: number = parseInt(process.env.BCRYPT_SALT_ROUNDS!)
const JWT_SECRET: string = process.env.JWT_SECRET!
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN!
const JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET!
const JWT_REFRESH_EXPIRES_IN: string = process.env.JWT_REFRESH_EXPIRES_IN!

export async function hashPassword(password: string) {
    return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
}

export async function comparePassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash)
}

export function generateToken(obj: JSON) {
    return jwt.sign(obj, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    })
}

export function generateRefreshToken(obj: JSON) {
    return jwt.sign(obj, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
    })
}

export function verifyToken(token?: string) {
    if (!token?.startsWith("Bearer ")) {
        return null
    }

    token = token.split(" ")[1];

    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (err) {
        return null
    }
}

export function verifyRefreshToken(token: string) {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
    } catch (err) {
        return null
    }
}
