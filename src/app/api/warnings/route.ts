import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { warnings } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db
      .select()
      .from(warnings)
      .where(eq(warnings.type, "player"))
      .orderBy(desc(warnings.createdAt));
    return NextResponse.json(result);
  } catch (e) {
    console.error("Warnings GET error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { playerName, reason, complaintNumber, issuedBy } = body;
    if (!playerName || !reason || !issuedBy) {
      return NextResponse.json({ error: "Обязательные поля отсутствуют" }, { status: 400 });
    }
    const inserted = await db
      .insert(warnings)
      .values({
        type: "player",
        playerName,
        reason,
        complaintNumber: complaintNumber || null,
        issuedBy,
      })
      .returning();
    return NextResponse.json(inserted[0]);
  } catch (e) {
    console.error("Warnings POST error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id обязателен" }, { status: 400 });
    await db.delete(warnings).where(eq(warnings.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}