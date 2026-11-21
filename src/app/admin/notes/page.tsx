import { Suspense } from "react";
import { connection } from "next/server";
import { prisma, queryOrEmpty } from "@/lib/prisma";
import { NotesTable } from "./notes-table";

async function NotesData() {
  // Always read fresh rows at request time, never at build time.
  await connection();

  const notes = await queryOrEmpty(() =>
    prisma.note.findMany({
      select: {
        id: true,
        name: true,
        mainAliasId: true,
        createdAt: true,
        updatedAt: true,
        mainAlias: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
  );

  return (
    <NotesTable
      notes={notes.map((note) => ({
        ...note,
        isMain: note.mainAliasId === note.id,
      }))}
    />
  );
}

export default function AdminNotesPage() {
  return (
    <>
      <h1>Notes</h1>
      <Suspense fallback={<p>Loading notes...</p>}>
        <NotesData />
      </Suspense>
    </>
  );
}
