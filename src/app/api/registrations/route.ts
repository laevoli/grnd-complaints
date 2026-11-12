import { NextResponse } from "next/server";
import { db } from "@/db";
import { pendingRegistrations, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "owner") {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    const pending = await db
      .select()
      .from(pendingRegistrations)
      .where(eq(pendingRegistrations.status, "pending"));

    return NextResponse.json(pending);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "owner") {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    const { id, action } = await req.json();

    if (!id || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
    }

    const [registration] = await db
      .select()
      .from(pendingRegistrations)
      .where(eq(pendingRegistrations.id, id));

    if (!registration) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    }

    if (action === "approve") {
      // Создаём пользователя
      await db.insert(users).values({
        username: registration.username,
        password: registration.password,
        role: registration.requestedRole,
        createdBy: currentUser.username,
      });

      // Обновляем статус заявки
      await db
        .update(pendingRegistrations)
        .set({ status: "approved", reviewedBy: currentUser.username, reviewedAt: new Date() })
        .where(eq(pendingRegistrations.id, id));

      return NextResponse.json({ success: true, message: "Пользователь создан" });
    }

    if (action === "reject") {
      await db
        .update(pendingRegistrations)
        .set({ status: "rejected", reviewedBy: currentUser.username, reviewedAt: new Date() })
        .where(eq(pendingRegistrations.id, id));

      return NextResponse.json({ success: true, message: "Заявка отклонена" });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}