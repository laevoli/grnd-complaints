import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const all = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      isActive: users.isActive,
      createdBy: users.createdBy,
      lastLogin: users.lastLogin,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  if (me.role !== "owner") return NextResponse.json({ error: "Только владелец может создавать пользователей" }, { status: 403 });

  const { username, password, role } = await req.json();
  if (!username || !password) return NextResponse.json({ error: "Логин и пароль обязательны" }, { status: 400 });

  const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (existing.length > 0) return NextResponse.json({ error: "Пользователь уже существует" }, { status: 400 });

  const hash = await hashPassword(password);
  const inserted = await db.insert(users).values({
    username,
    password: hash,
    role: role || "admin",
    createdBy: me.username,
  }).returning();

  return NextResponse.json({
    id: inserted[0].id,
    username: inserted[0].username,
    role: inserted[0].role,
  });
}

export async function PATCH(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me || me.role !== "owner") return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });

  const { id, role, isActive, newPassword } = await req.json();
  const updates: Record<string, unknown> = {};
  if (role !== undefined) updates.role = role;
  if (isActive !== undefined) updates.isActive = isActive;
  if (newPassword) updates.password = await hashPassword(newPassword);

  await db.update(users).set(updates).where(eq(users.id, id));
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me || me.role !== "owner") return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (id === me.id) return NextResponse.json({ error: "Нельзя удалить себя" }, { status: 400 });

  await db.delete(users).where(eq(users.id, id));
  return NextResponse.json({ success: true });
}