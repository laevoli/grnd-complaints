import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { complaints } from "@/db/schema";

function parseDate(str: string): Date {
  const cleaned = str.trim();
  const match = cleaned.match(/^(\d{2})\.(\d{2})\.(\d{4}),?\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (!match) {
    throw new Error(`Неверный формат даты: "${str}". Ожидается: 08.11.2026, 22:07:51`);
  }
  const [, day, month, year, hh, mm, ss] = match;
  return new Date(`${year}-${month}-${day}T${hh}:${mm}:${ss}`);
}

function parseBulkForm(lines: string[]) {
  // Порядок строк:
  // 0: язык, 1: сервер, 2: номер жб, 3: от кого,
  // 4: на кого, 5: кто обработал, 6: время подачи, 7: время закрытия

  const language = lines[0];
  const server = lines[1];
  const complaintNumber = lines[2];
  const reportedBy = lines[3];
  const reportedAgainst = lines[4];
  const processedBy = lines[5];
  const submittedAtStr = lines[6];
  const closedAtStr = lines[7];

  if (!complaintNumber) throw new Error("Номер жб пустой");
  if (!reportedBy) throw new Error("От кого — пустое");
  if (!reportedAgainst) throw new Error("На кого — пустое");
  if (!processedBy) throw new Error("Кто обработал — пустое");

  const submittedAt = parseDate(submittedAtStr);
  const closedAt = parseDate(closedAtStr);

  return {
    language: language || "ru",
    server: server || "19",
    complaintNumber,
    reportedBy,
    reportedAgainst,
    processedBy,
    submittedAt,
    closedAt,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text field is required" }, { status: 400 });
    }

    // Убираем ВСЕ пустые строки и режем по 8 строк
    const allLines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (allLines.length === 0) {
      return NextResponse.json({ error: "Пустой текст" }, { status: 400 });
    }

    if (allLines.length % 8 !== 0) {
      return NextResponse.json(
        {
          error: `Нечётное количество строк: ${allLines.length}. Каждая жалоба = 8 строк. Лишних строк: ${allLines.length % 8}`,
        },
        { status: 400 }
      );
    }

    const totalComplaints = allLines.length / 8;
    const parsed = [];
    const errors = [];

    for (let i = 0; i < totalComplaints; i++) {
      const chunk = allLines.slice(i * 8, i * 8 + 8);
      try {
        const complaint = parseBulkForm(chunk);
        parsed.push(complaint);
      } catch (e) {
        errors.push({ block: i + 1, error: String(e) });
      }
    }

    if (parsed.length === 0) {
      return NextResponse.json(
        { error: "No valid complaints parsed", details: errors },
        { status: 400 }
      );
    }

    // Вставляем порциями по 50, чтобы не перегрузить БД
    const BATCH_SIZE = 50;
    const allInserted = [];

    for (let i = 0; i < parsed.length; i += BATCH_SIZE) {
      const batch = parsed.slice(i, i + BATCH_SIZE);
      const inserted = await db
        .insert(complaints)
        .values(
          batch.map((c) => ({
            language: c.language,
            server: c.server,
            complaintNumber: c.complaintNumber,
            reportedBy: c.reportedBy,
            reportedAgainst: c.reportedAgainst,
            processedBy: c.processedBy,
            submittedAt: c.submittedAt,
            closedAt: c.closedAt,
          }))
        )
        .returning();
      allInserted.push(...inserted);
    }

    return NextResponse.json({
      inserted: allInserted.length,
      errors,
      data: allInserted,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}