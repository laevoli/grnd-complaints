import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const all = await db.select().from(admins).orderBy(admins.level, admins.username);
    return NextResponse.json(all);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, level, photoUrl, onVacation, vacationStart, vacationEnd, instructionPassed } = body;
    if (!username || !level) {
      return NextResponse.json({ error: "username and level are required" }, { status: 400 });
    }
    const inserted = await db.insert(admins).values({
      username,
      level: Number(level),
      photoUrl: photoUrl || null,
      onVacation: Boolean(onVacation),
      vacationStart: vacationStart || null,
      vacationEnd: vacationEnd || null,
      instructionPassed: Boolean(instructionPassed),
    }).returning();
    return NextResponse.json(inserted[0]);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
