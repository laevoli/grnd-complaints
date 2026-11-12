import { NextResponse } from "next/server";
import { db } from "@/db";
import { complaints, bonuses } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

function getWeekRange(dateStr?: string) {
  const now = dateStr ? new Date(dateStr) : new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday, weekKey: monday.toISOString().split("T")[0] };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const weekParam = searchParams.get("week") || undefined;
    const { monday, sunday, weekKey } = getWeekRange(weekParam);

    // Жалобы за неделю, сгруппированные по админу
    const weekComplaints = await db
      .select({
        admin: complaints.processedBy,
        count: sql<number>`count(*)::int`,
      })
      .from(complaints)
      .where(
        and(
          gte(complaints.closedAt, monday),
          lte(complaints.closedAt, sunday)
        )
      )
      .groupBy(complaints.processedBy);

    // Бонусы за эту неделю
    const weekBonuses = await db
      .select()
      .from(bonuses)
      .where(eq(bonuses.weekStart, weekKey));

    const RATE = 5;

    const salaryData = weekComplaints.map((item) => {
      const adminBonuses = weekBonuses.filter((b) => b.adminName === item.admin);
      const bonusTotal = adminBonuses.reduce((sum, b) => sum + b.amount, 0);
      const base = item.count * RATE;

      return {
        admin: item.admin,
        complaints: item.count,
        base,
        bonuses: adminBonuses.map((b) => ({
          id: b.id,
          type: b.type,
          amount: b.amount,
        })),
        bonusTotal,
        total: base + bonusTotal,
      };
    });

    // Сортировка по количеству жалоб (убывание)
    salaryData.sort((a, b) => b.complaints - a.complaints);

    return NextResponse.json({
      weekKey,
      monday: monday.toISOString(),
      sunday: sunday.toISOString(),
      data: salaryData,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}