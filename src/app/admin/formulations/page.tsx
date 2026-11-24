import { Suspense } from "react";
import { connection } from "next/server";
import { prisma, queryOrEmpty } from "@/lib/prisma";
import { FormulationsAdmin } from "./formulations-admin";

async function FormulationsData() {
  // Always read fresh rows at request time, never at build time.
  await connection();

  const [formulations, allNotes, perfumes] = await Promise.all([
    queryOrEmpty(() =>
      prisma.formulation.findMany({
        select: {
          id: true,
          year: true,
          discontinued: true,
          remarks: true,
          createdAt: true,
          updatedAt: true,
          perfume: {
            select: {
              name: true,
              brand: { select: { name: true } },
              formulationType: { select: { name: true } },
              images: {
                select: { url: true },
                orderBy: { createdAt: "asc" },
                take: 1,
              },
            },
          },
          notes: {
            select: { type: true, note: { select: { id: true, name: true } } },
            orderBy: { note: { name: "asc" } },
          },
        },
        orderBy: [{ perfume: { name: "asc" } }, { year: "asc" }],
      }),
    ),
    queryOrEmpty(() =>
      prisma.note.findMany({
        select: { id: true, name: true, mainAliasId: true },
        orderBy: { name: "asc" },
      }),
    ),
    queryOrEmpty(() =>
      prisma.perfume.findMany({
        select: {
          id: true,
          name: true,
          brand: { select: { name: true } },
          formulationType: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      }),
    ),
  ]);

  return (
    <FormulationsAdmin
      formulations={formulations}
      allNotes={allNotes.map(({ mainAliasId, ...note }) => ({
        ...note,
        isMain: mainAliasId === note.id,
        isStandalone: mainAliasId === null,
      }))}
      perfumes={perfumes}
    />
  );
}

export default function AdminFormulationsPage() {
  return (
    <>
      <h1>Formulations</h1>
      <Suspense fallback={<p>Loading formulations...</p>}>
        <FormulationsData />
      </Suspense>
    </>
  );
}
