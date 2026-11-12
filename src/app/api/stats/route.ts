import { NextResponse } from "next/server";
import { db } from "@/db";
import { complaints, admins } from "@/db/schema";
import { eq, gte, and, sql, count } from "drizzle-orm";
import { startOfDay, startOfWeek, startOfMonth } from "date-fns";

export async function GET() {
  try {
    const now = new Date();
    const dayStart = startOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);

    const allAdmins = await db.select().from(admins).orderBy(admins.level, admins.username);

    // Total per admin
    const totalStats = await db
      .select({
        processedBy: complaints.processedBy,
        count: count(),
      })
      .from(complaints)
      .groupBy(complaints.processedBy);

    // Day per admin
    const dayStats = await db
      .select({
        processedBy: complaints.processedBy,
        count: count(),
      })
      .from(complaints)
      .where(gte(complaints.closedAt, dayStart))
      .groupBy(complaints.processedBy);

    // Week per admin
    const weekStats = await db
      .select({
        processedBy: complaints.processedBy,
        count: count(),
      })
      .from(complaints)
      .where(gte(complaints.closedAt, weekStart))
      .groupBy(complaints.processedBy);

    // Month per admin
    const monthStats = await db
      .select({
        processedBy: complaints.processedBy,
        count: count(),
      })
      .from(complaints)
      .where(gte(complaints.closedAt, monthStart))
      .groupBy(complaints.processedBy);

    const toMap = (arr: { processedBy: string; count: number }[]) => {
      const m: Record<string, number> = {};
      for (const row of arr) m[row.processedBy] = Number(row.count);
      return m;
    };

    const totalMap = toMap(totalStats);
    const dayMap = toMap(dayStats);
    const weekMap = toMap(weekStats);
    const monthMap = toMap(monthStats);

    const result = allAdmins.map((admin) => ({
      ...admin,
      stats: {
        total: totalMap[admin.username] ?? 0,
        day: dayMap[admin.username] ?? 0,
        week: weekMap[admin.username] ?? 0,
        month: monthMap[admin.username] ?? 0,
      },
    }));

    // Sort by total desc, then level desc
    result.sort((a, b) => {
      if (b.stats.total !== a.stats.total) return b.stats.total - a.stats.total;
      return b.level - a.level;
    });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
