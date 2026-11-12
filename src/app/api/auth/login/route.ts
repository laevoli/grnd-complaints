import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, createToken, ensureOwner } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await ensureOwner();
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Введите логин и пароль" }, { status: 400 });
    }

    const found = await db.select().from(users).where(eq(users.username, username)).limit(1);
    const user = found[0];
    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
    }

    await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, user.id));

    const token = createToken({ id: user.id, username: user.username, role: user.role });
    const res = NextResponse.json({
      user: { id: user.id, username: user.username, role: user.role },
    });
    res.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}