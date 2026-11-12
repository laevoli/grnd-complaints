import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { complaints, admins } from "@/db/schema";
import { eq, gte, and, sql } from "drizzle-orm";
import { startOfDay, startOfWeek, startOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminUsername = searchParams.get("admin");

    if (adminUsername) {
      const all = await db.select().from(complaints)
        .where(eq(complaints.processedBy, adminUsername))
        .orderBy(complaints.closedAt);
      return NextResponse.json(all);
    }

    const all = await db.select().from(complaints).orderBy(complaints.closedAt);
    return NextResponse.json(all);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      language,
      server,
      complaintNumber,
      reportedBy,
      reportedAgainst,
      processedBy,
      submittedAt,
      closedAt,
    } = body;

    if (!complaintNumber || !reportedBy || !reportedAgainst || !processedBy || !submittedAt || !closedAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const inserted = await db.insert(complaints).values({
      language: language || "ru",
      server: server || "19",
      complaintNumber,
      reportedBy,
      reportedAgainst,
      processedBy,
      submittedAt: new Date(submittedAt),
      closedAt: new Date(closedAt),
    }).returning();

    return NextResponse.json(inserted[0]);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;
    await db.delete(complaints).where(eq(complaints.id, Number(id)));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
