// Imports perfumes and their formulations from a Notion CSV export.
//
// Dry run (default, changes nothing, prints what would happen):
//   npx tsx prisma/import-perfumes.ts "path/to/export.csv"
// Write to the database:
//   npx tsx prisma/import-perfumes.ts "path/to/export.csv" --apply
//
// Rules:
// - Only rows whose Brand already exists in the database are imported.
// - A perfume that already exists (same brand and name) is not created again.
//   It gets a formulation only if it has none yet, so the script is safe to rerun.
// - Notes are never created. If a note is missing from the notes table, nothing
//   is written and the missing names are listed, so they can be added first.
// - The "Files & media" link is saved as an image of the perfume.
// - Everything is written in one transaction: all of it is saved, or none of it.
import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type NoteType } from "../src/generated/prisma/client";

// CSV "Type" value -> formulation type name or varName in the database.
const TYPE_ALIASES: Record<string, string[]> = {
  edt: ["Eau de Toilette", "eauDeToilette"],
  edp: ["Eau de Parfum", "eauDeParfum"],
  edc: ["Eau de Cologne", "eauDeCologne"],
  parfum: ["Parfum", "parfum"],
  "body mist": ["Body Mist", "bodyMist"],
};

// CSV perfume name -> name to import it as (fixes typos in the export).
const NAME_FIXES: Record<string, string> = {
  "Ocen Whisperer": "Ocean Whisper",
};

// Used for rows with an empty Type. null skips those rows (they are listed).
// The only rows with an empty Type (all Niran, all Saynesta Fetish, and Janua's
// Dreamy Cloud) are all EDP.
const TYPE_WHEN_EMPTY: string | null = "EDP";

// CSV column -> note tier.
const NOTE_COLUMNS: [string, NoteType][] = [
  ["Top Notes", "TOP"],
  ["Middle Notes", "MIDDLE"],
  ["Base Notes", "BASE"],
];

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const key = (text: string) => text.trim().toLowerCase();

// Minimal CSV parser: handles quoted fields, "" escapes and newlines in quotes.
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  // Notion exports start with a byte order mark.
  const [header, ...body] = rows;
  const columns = header.map((name) => name.replace(/^﻿/, "").trim());
  return body
    .filter((cells) => cells.some((cell) => cell.trim()))
    .map((cells) =>
      Object.fromEntries(
        columns.map((name, i) => [name, cells[i]?.trim() ?? ""]),
      ),
    );
}

const splitList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

async function main() {
  const [csvPath, ...flags] = process.argv.slice(2);
  if (!csvPath) {
    throw new Error(
      'Usage: npx tsx prisma/import-perfumes.ts "export.csv" [--apply]',
    );
  }
  const apply = flags.includes("--apply");
  const rows = parseCsv(readFileSync(csvPath, "utf8"));

  const [brands, types, notes] = await Promise.all([
    prisma.brand.findMany({
      include: {
        perfumes: { include: { _count: { select: { formulations: true } } } },
      },
    }),
    prisma.formulationType.findMany(),
    prisma.note.findMany({ select: { id: true, name: true } }),
  ]);
  const brandByName = new Map(brands.map((brand) => [key(brand.name), brand]));
  const noteByName = new Map(notes.map((note) => [key(note.name), note]));

  function findType(csvType: string) {
    const wanted = csvType || TYPE_WHEN_EMPTY;
    if (!wanted) return undefined;
    const candidates = [wanted, ...(TYPE_ALIASES[key(wanted)] ?? [])].map(key);
    return types.find(
      (type) =>
        candidates.includes(key(type.name)) ||
        candidates.includes(key(type.varName)),
    );
  }

  const skippedBrands = new Map<string, number>();
  const skipped: string[] = [];
  const missingNotes = new Map<string, string[]>();
  const plans: {
    label: string;
    brandId: string;
    name: string;
    formulationTypeId: string;
    // Set when the perfume already exists, so only a formulation is added.
    existingPerfumeId?: string;
    image: string | null;
    notes: { noteId: string; type: NoteType }[];
  }[] = [];

  for (const row of rows) {
    const name = NAME_FIXES[row["Name"]] ?? row["Name"];
    const label = `${name} (${row["Brand"]})`;
    const brand = brandByName.get(key(row["Brand"]));
    if (!brand) {
      skippedBrands.set(
        row["Brand"],
        (skippedBrands.get(row["Brand"]) ?? 0) + 1,
      );
      continue;
    }

    const existing = brand.perfumes.find(
      (perfume) => key(perfume.name) === key(name),
    );
    if (existing && existing._count.formulations > 0) {
      skipped.push(`${label}: already exists with a formulation`);
      continue;
    }

    const type = findType(row["Type"]);
    if (!existing && !type) {
      skipped.push(
        `${label}: ${row["Type"] ? `no formulation type matches "${row["Type"]}"` : "Type is empty"}`,
      );
      continue;
    }

    // The same note can appear in a tier only once (unique in the database).
    const seen = new Set<string>();
    const formulationNotes: { noteId: string; type: NoteType }[] = [];
    for (const [column, tier] of NOTE_COLUMNS) {
      for (const noteName of splitList(row[column] ?? "")) {
        const note = noteByName.get(key(noteName));
        if (!note) {
          missingNotes.set(noteName, [
            ...(missingNotes.get(noteName) ?? []),
            label,
          ]);
          continue;
        }
        if (seen.has(`${note.id}:${tier}`)) continue;
        seen.add(`${note.id}:${tier}`);
        formulationNotes.push({ noteId: note.id, type: tier });
      }
    }

    plans.push({
      label,
      brandId: brand.id,
      name,
      formulationTypeId: existing?.formulationTypeId ?? type!.id,
      existingPerfumeId: existing?.id,
      image: row["Files & media"] || null,
      notes: formulationNotes,
    });
  }

  for (const plan of plans) {
    const action = plan.existingPerfumeId
      ? "add formulation to existing perfume"
      : "new perfume";
    console.log(`+ ${plan.label}: ${action}, ${plan.notes.length} notes`);
  }
  if (skipped.length) {
    console.log("\nSkipped:");
    skipped.forEach((line) => console.log(`- ${line}`));
  }
  if (skippedBrands.size) {
    console.log("\nSkipped, brand not in the database:");
    for (const [brand, count] of skippedBrands)
      console.log(`- ${brand}: ${count}`);
  }

  if (missingNotes.size) {
    console.log("\nMissing notes (add these first, nothing was written):");
    for (const [note, perfumes] of missingNotes) {
      console.log(`- ${note}: ${perfumes.join(", ")}`);
    }
    process.exitCode = 1;
    return;
  }
  if (!apply) {
    console.log(
      `\nDry run: ${plans.length} to import. Add --apply to write them.`,
    );
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const plan of plans) {
      const perfumeId =
        plan.existingPerfumeId ??
        (
          await tx.perfume.create({
            data: {
              name: plan.name,
              brandId: plan.brandId,
              formulationTypeId: plan.formulationTypeId,
            },
          })
        ).id;
      await tx.formulation.create({
        data: { perfumeId, notes: { create: plan.notes } },
      });
      // Images belong to the perfume, not the formulation.
      if (plan.image) {
        await tx.image.create({ data: { perfumeId, url: plan.image } });
      }
    }
  });
  console.log(`\nImported ${plans.length}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
