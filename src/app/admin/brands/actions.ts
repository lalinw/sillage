"use server";

import {
  type FormValues,
  invalidLink,
  missingField,
  optionalText,
  parseDate,
  revalidateAdmin,
  type SaveResult,
  saveFailure,
} from "@/lib/admin-save";
import { prisma } from "@/lib/prisma";

export async function createBrand(values: FormValues) {
  return saveBrand(values);
}

export async function updateBrand(id: string, values: FormValues) {
  return saveBrand(values, id);
}

export async function createBrandLink(values: FormValues) {
  return saveBrandLink(values);
}

export async function updateBrandLink(id: string, values: FormValues) {
  return saveBrandLink(values, id);
}

export async function createCollection(values: FormValues) {
  return saveCollection(values);
}

export async function updateCollection(id: string, values: FormValues) {
  return saveCollection(values, id);
}

// Each save adds a row, or edits the row with the given id.

async function saveBrand(values: FormValues, id?: string): Promise<SaveResult> {
  const name = values.name?.trim();
  if (!name) return { ok: false, error: "Name is required." };

  const data = {
    name,
    address: optionalText(values, "address"),
    owner: optionalText(values, "owner"),
    company: optionalText(values, "company"),
    descr: optionalText(values, "descr"),
    remarks: optionalText(values, "remarks"),
  };
  try {
    if (id) await prisma.brand.update({ where: { id }, data });
    else await prisma.brand.create({ data });
    revalidateAdmin();
    return { ok: true };
  } catch (error) {
    return saveFailure(error, `A brand named "${name}" already exists.`);
  }
}

async function saveBrandLink(
  values: FormValues,
  id?: string,
): Promise<SaveResult> {
  const missing = missingField(values, {
    brandId: "Brand",
    platformId: "Platform",
    link: "Link",
    verificationTypeId: "Verification type",
  });
  if (missing) return { ok: false, error: missing };

  const link = values.link.trim();
  const badLink = invalidLink(link);
  if (badLink) return { ok: false, error: badLink };

  const verificationDate = parseDate(optionalText(values, "verificationDate"));
  if (verificationDate === "invalid") {
    return { ok: false, error: "Enter a valid verification date." };
  }

  const data = {
    brandId: values.brandId,
    platformId: values.platformId,
    verificationTypeId: values.verificationTypeId,
    link,
    verificationDate,
  };
  try {
    if (id) await prisma.brandLink.update({ where: { id }, data });
    else await prisma.brandLink.create({ data });
    revalidateAdmin();
    return { ok: true };
  } catch (error) {
    return saveFailure(error, "That brand link already exists.");
  }
}

async function saveCollection(
  values: FormValues,
  id?: string,
): Promise<SaveResult> {
  const missing = missingField(values, { brandId: "Brand", name: "Name" });
  if (missing) return { ok: false, error: missing };

  const name = values.name.trim();
  const data = {
    brandId: values.brandId,
    name,
    descr: optionalText(values, "descr"),
  };
  try {
    if (id) {
      // Perfumes in this collection must keep the same brand as the collection.
      const current = await prisma.collection.findUnique({
        where: { id },
        select: { brandId: true, _count: { select: { perfumes: true } } },
      });
      if (
        current &&
        current.brandId !== data.brandId &&
        current._count.perfumes
      ) {
        return {
          ok: false,
          error: `This collection has ${current._count.perfumes} perfume(s), so its brand can't change. Move or edit them first.`,
        };
      }
      await prisma.collection.update({ where: { id }, data });
    } else {
      await prisma.collection.create({ data });
    }
    revalidateAdmin();
    return { ok: true };
  } catch (error) {
    return saveFailure(
      error,
      `This brand already has a collection named "${name}".`,
    );
  }
}
