import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { username, level, photoUrl, onVacation, vacationStart, vacationEnd, instructionPassed } = body;
    const updated = await db.update(admins)
      .set({
        username,
        level: Number(level),
        photoUrl: photoUrl || null,
        onVacation: Boolean(onVacation),
        vacationStart: vacationStart || null,
        vacationEnd: vacationEnd || null,
        instructionPassed: Boolean(instructionPassed),
      })
      .where(eq(admins.id, Number(id)))
      .returning();
    return NextResponse.json(updated[0]);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(admins).where(eq(admins.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
