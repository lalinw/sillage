"use server";

import {
  type FormValues,
  missingField,
  optionalText,
  revalidateAdmin,
  type SaveResult,
  saveFailure,
} from "@/lib/admin-save";
import { prisma } from "@/lib/prisma";

export async function createPerfume(values: FormValues) {
  return savePerfume(values);
}

export async function updatePerfume(id: string, values: FormValues) {
  return savePerfume(values, id);
}

// Adds a perfume, or edits the perfume with this id.
async function savePerfume(
  values: FormValues,
  id?: string,
): Promise<SaveResult> {
  const missing = missingField(values, {
    name: "Name",
    brandId: "Brand",
    formulationTypeId: "Formulation type",
  });
  if (missing) return { ok: false, error: missing };

  const collectionId = optionalText(values, "collectionId");

  try {
    // The schema can't check this, so it's enforced here.
    if (collectionId) {
      const collection = await prisma.collection.findUnique({
        where: { id: collectionId },
        select: { brandId: true },
      });
      if (collection?.brandId !== values.brandId) {
        return {
          ok: false,
          error: "The collection must belong to the chosen brand.",
        };
      }
    }

    const data = {
      name: values.name.trim(),
      descr: optionalText(values, "descr"),
      brandId: values.brandId,
      formulationTypeId: values.formulationTypeId,
      collectionId,
    };
    if (id) await prisma.perfume.update({ where: { id }, data });
    else await prisma.perfume.create({ data });
    revalidateAdmin();
    return { ok: true };
  } catch (error) {
    return saveFailure(error, "That perfume already exists.");
  }
}
