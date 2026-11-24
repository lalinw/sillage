"use server";

import { revalidatePath } from "next/cache";
import { NoteType } from "@/generated/prisma/enums";
import { isConnectionError, NO_CONNECTION_MESSAGE, prisma } from "@/lib/prisma";

export type UpdateFormulationResult =
  { ok: true } | { ok: false; error: string };

export type CreateFormulationResult =
  { ok: true; id: string } | { ok: false; error: string };

type FormulationNoteInput = { noteId: string; type: NoteType };

type FormulationFields = {
  year: number | null;
  discontinued: boolean;
  remarks: string;
  notes: FormulationNoteInput[];
};

// Returns an error message when the shared fields aren't valid.
function validateFields(fields: FormulationFields) {
  const { year, notes } = fields;
  if (
    year !== null &&
    (!Number.isInteger(year) || year < 1000 || year > 9999)
  ) {
    return "Enter a four-digit year.";
  }
  if (notes.some((note) => !Object.values(NoteType).includes(note.type))) {
    return "Unknown note type.";
  }
  return null;
}

export async function createFormulation(
  input: FormulationFields & { perfumeId: string | null },
): Promise<CreateFormulationResult> {
  if (!input.perfumeId) return { ok: false, error: "Choose a perfume." };

  const invalid = validateFields(input);
  if (invalid) return { ok: false, error: invalid };

  try {
    const perfume = await prisma.perfume.findUnique({
      where: { id: input.perfumeId },
      select: { id: true },
    });
    if (!perfume) return { ok: false, error: "That perfume no longer exists." };

    const { id } = await prisma.formulation.create({
      data: {
        perfumeId: perfume.id,
        year: input.year,
        discontinued: input.discontinued,
        remarks: input.remarks.trim() || null,
        notes: {
          create: input.notes.map(({ noteId, type }) => ({ noteId, type })),
        },
      },
      select: { id: true },
    });

    revalidatePath("/admin/formulations");
    return { ok: true, id };
  } catch (error) {
    if (isConnectionError(error)) {
      return { ok: false, error: NO_CONNECTION_MESSAGE };
    }
    throw error;
  }
}

export async function updateFormulation(
  input: FormulationFields & { id: string; name: string },
): Promise<UpdateFormulationResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Enter a name." };

  const invalid = validateFields(input);
  if (invalid) return { ok: false, error: invalid };

  try {
    await prisma.$transaction(async (tx) => {
      const formulation = await tx.formulation.update({
        where: { id: input.id },
        data: {
          year: input.year,
          discontinued: input.discontinued,
          remarks: input.remarks.trim() || null,
        },
        select: { perfumeId: true },
      });
      // The name lives on the perfume, shared by all of its formulations.
      await tx.perfume.update({
        where: { id: formulation.perfumeId },
        data: { name },
      });
      await tx.formulationNote.deleteMany({
        where: { formulationId: input.id },
      });
      await tx.formulationNote.createMany({
        data: input.notes.map(({ noteId, type }) => ({
          formulationId: input.id,
          noteId,
          type,
        })),
      });
    });

    revalidatePath("/admin/formulations");
    return { ok: true };
  } catch (error) {
    if (isConnectionError(error)) {
      return { ok: false, error: NO_CONNECTION_MESSAGE };
    }
    throw error;
  }
}
