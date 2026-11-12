import { NextResponse } from "next/server";
import { db } from "@/db";
import { pendingRegistrations } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { username, password, requestedRole } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Заполните все поля" }, { status: 400 });
    }

    if (username.length < 3) {
      return NextResponse.json({ error: "Логин минимум 3 символа" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Пароль минимум 6 символов" }, { status: 400 });
    }

    // Проверяем, нет ли уже такой заявки
    const existing = await db
      .select()
      .from(pendingRegistrations)
      .where(eq(pendingRegistrations.username, username));

    if (existing.length > 0) {
      return NextResponse.json({ error: "Заявка с таким логином уже существует" }, { status: 400 });
    }

    const hashed = await hashPassword(password);

    await db.insert(pendingRegistrations).values({
      username,
      password: hashed,
      requestedRole: requestedRole || "viewer",
    });

    return NextResponse.json({ success: true, message: "Заявка отправлена на рассмотрение" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}