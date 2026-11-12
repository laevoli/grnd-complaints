import { NextResponse } from "next/server";
import { db } from "@/db";
import { bonuses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "owner") {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    const { adminName, type, weekStart } = await req.json();

    if (!adminName || !type || !weekStart) {
      return NextResponse.json({ error: "Не все поля заполнены" }, { status: 400 });
    }

    if (!["norm_first", "most_active"].includes(type)) {
      return NextResponse.json({ error: "Неверный тип бонуса" }, { status: 400 });
    }

    // Проверяем, не выдан ли уже такой бонус на эту неделю
    const existing = await db
      .select()
      .from(bonuses)
      .where(
        and(
          eq(bonuses.type, type),
          eq(bonuses.weekStart, weekStart)
        )
      );

    if (existing.length > 0) {
      // Удаляем старый и ставим новый
      await db
        .delete(bonuses)
        .where(
          and(
            eq(bonuses.type, type),
            eq(bonuses.weekStart, weekStart)
          )
        );
    }

    const amount = type === "norm_first" ? 100 : 150;

    await db.insert(bonuses).values({
      adminName,
      type,
      amount,
      weekStart,
      awardedBy: currentUser.username,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "owner") {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    const { id } = await req.json();
    await db.delete(bonuses).where(eq(bonuses.id, id));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}