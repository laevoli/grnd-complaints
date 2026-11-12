import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createToken(payload: { id: number; username: string; role: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = await db.select().from(users).where(eq(users.id, payload.id)).limit(1);
  return user[0] || null;
}

// Автосоздание владельца при первом запуске
export async function ensureOwner() {
  const existing = await db.select().from(users).where(eq(users.username, "Maxim_Bulkin")).limit(1);
  if (existing.length === 0) {
    const hash = await hashPassword("qpwoeiruty");
    await db.insert(users).values({
      username: "Maxim_Bulkin",
      password: hash,
      role: "owner",
      isActive: true,
    });
    console.log("✅ Создан владелец: Maxim_Bulkin / qpwoeiruty");
  }
}