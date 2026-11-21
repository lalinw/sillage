"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { isConnectionError, NO_CONNECTION_MESSAGE, prisma } from "@/lib/prisma";

export type SavedNote = { id: string; name: string; isMain: boolean };

export type SaveNoteResult =
  { ok: true; note: SavedNote } | { ok: false; error: string };

type NoteFields = {
  name: string;
  isMain: boolean;
  mainAliasId: string | null;
};

// A main note points to itself, an alias points to a main note, and a
// standalone note points nowhere.

// Thrown inside a transaction to stop the save with a message for the form.
class SaveRejected extends Error {}

export async function createNote(input: NoteFields): Promise<SaveNoteResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Enter a name." };

  // Made here so a main note can point to itself in the same insert.
  const id = crypto.randomUUID();
  const mainAliasId = input.isMain ? id : input.mainAliasId;

  try {
    const note = await prisma.$transaction(async (tx) => {
      await prepareMainAlias(tx, id, input.isMain, mainAliasId);
      return tx.note.create({
        data: { id, name, mainAliasId },
        select: { id: true, name: true },
      });
    });
    revalidateNotes();
    return { ok: true, note: { ...note, isMain: input.isMain } };
  } catch (error) {
    return saveFailure(error, name);
  }
}

export async function updateNote(
  input: NoteFields & { id: string },
): Promise<SaveNoteResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Enter a name." };

  const mainAliasId = input.isMain ? input.id : input.mainAliasId;

  try {
    const note = await prisma.$transaction(async (tx) => {
      // A note that stops being main would leave its aliases pointing at a non-main note.
      if (!input.isMain) {
        const aliasCount = await tx.note.count({
          where: { mainAliasId: input.id, id: { not: input.id } },
        });
        if (aliasCount > 0) {
          throw new SaveRejected(
            `This is the main note for ${aliasCount} other ${aliasCount === 1 ? "note" : "notes"}. Point ${aliasCount === 1 ? "it" : "them"} elsewhere first.`,
          );
        }
      }

      await prepareMainAlias(tx, input.id, input.isMain, mainAliasId);
      return tx.note.update({
        where: { id: input.id },
        data: { name, mainAliasId },
        select: { id: true, name: true },
      });
    });
    revalidateNotes();
    return { ok: true, note: { ...note, isMain: input.isMain } };
  } catch (error) {
    return saveFailure(error, name);
  }
}

// Checks the chosen main alias. A main note can be chosen as is; a standalone
// note is turned into a main note (pointing to itself) so the alias is valid.
async function prepareMainAlias(
  tx: Prisma.TransactionClient,
  id: string,
  isMain: boolean,
  mainAliasId: string | null,
) {
  if (isMain || !mainAliasId) return;
  if (mainAliasId === id) {
    throw new SaveRejected(
      "Tick Main note for a note to be its own main alias.",
    );
  }

  const target = await tx.note.findUnique({
    where: { id: mainAliasId },
    select: { id: true, mainAliasId: true },
  });
  if (!target) {
    throw new SaveRejected("The chosen main alias no longer exists.");
  }
  if (target.mainAliasId === null) {
    await tx.note.update({
      where: { id: target.id },
      data: { mainAliasId: target.id },
    });
  } else if (target.mainAliasId !== target.id) {
    throw new SaveRejected(
      "The main alias must be a main note or a standalone note.",
    );
  }
}

function revalidateNotes() {
  revalidatePath("/admin/notes");
  revalidatePath("/admin/formulations");
}

function saveFailure(error: unknown, name: string): SaveNoteResult {
  if (error instanceof SaveRejected) {
    return { ok: false, error: error.message };
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return { ok: false, error: `A note named "${name}" already exists.` };
    }
    if (error.code === "P2025") {
      return { ok: false, error: "That note no longer exists." };
    }
  }
  if (isConnectionError(error)) {
    return { ok: false, error: NO_CONNECTION_MESSAGE };
  }
  throw error;
}
