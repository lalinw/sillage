"use server";

import {
  type FormValues,
  missingField,
  revalidateAdmin,
  type SaveResult,
  saveFailure,
} from "@/lib/admin-save";
import { prisma } from "@/lib/prisma";

export async function createPlatform(values: FormValues) {
  return saveLookup("platform", values);
}

export async function updatePlatform(id: string, values: FormValues) {
  return saveLookup("platform", values, id);
}

export async function createFormulationType(values: FormValues) {
  return saveLookup("formulationType", values);
}

export async function updateFormulationType(id: string, values: FormValues) {
  return saveLookup("formulationType", values, id);
}

export async function createVerificationType(values: FormValues) {
  return saveLookup("verificationType", values);
}

export async function updateVerificationType(id: string, values: FormValues) {
  return saveLookup("verificationType", values, id);
}

type LookupModel = "platform" | "formulationType" | "verificationType";

const NOUNS: Record<LookupModel, string> = {
  platform: "platform",
  formulationType: "formulation type",
  verificationType: "verification type",
};

// A name code can use as an identifier, e.g. authorizedRetailer.
const VAR_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

// The three lookup tables have the same columns, so one table type covers them.
function lookupTable(model: LookupModel) {
  return prisma[model] as unknown as typeof prisma.platform;
}

// Adds a row, or edits the row with this id.
async function saveLookup(
  model: LookupModel,
  values: FormValues,
  id?: string,
): Promise<SaveResult> {
  const missing = missingField(values, {
    name: "Name",
    varName: "Variable name",
  });
  if (missing) return { ok: false, error: missing };

  const name = values.name.trim();
  const varName = values.varName.trim();
  if (!VAR_NAME.test(varName)) {
    return {
      ok: false,
      error:
        "The variable name can only use letters, numbers and underscores, and can't start with a number.",
    };
  }

  const noun = NOUNS[model];
  try {
    const table = lookupTable(model);
    // Checked up front so the message can say which value is taken.
    const clash = await table.findFirst({
      where: { OR: [{ name }, { varName }], NOT: id ? { id } : undefined },
      select: { name: true },
    });
    if (clash) {
      return {
        ok: false,
        error:
          clash.name === name
            ? `A ${noun} named "${name}" already exists.`
            : `The variable name "${varName}" is already used by "${clash.name}".`,
      };
    }

    const data = { name, varName };
    if (id) await table.update({ where: { id }, data });
    else await table.create({ data });
    revalidateAdmin();
    return { ok: true };
  } catch (error) {
    return saveFailure(
      error,
      `A ${noun} with that name or variable name already exists.`,
    );
  }
}
