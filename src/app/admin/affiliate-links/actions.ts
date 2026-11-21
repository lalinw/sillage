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

export async function createAffiliateLink(values: FormValues) {
  return saveAffiliateLink(values);
}

export async function updateAffiliateLink(id: string, values: FormValues) {
  return saveAffiliateLink(values, id);
}

// Adds an affiliate link, or edits the link with this id.
async function saveAffiliateLink(
  values: FormValues,
  id?: string,
): Promise<SaveResult> {
  const missing = missingField(values, {
    perfumeId: "Perfume",
    platformId: "Platform",
    link: "Link",
    verificationTypeId: "Verification type",
  });
  if (missing) return { ok: false, error: missing };

  const link = values.link.trim();
  const badLink = invalidLink(link);
  if (badLink) return { ok: false, error: badLink };

  const expiresAt = parseDate(optionalText(values, "expiresAt"));
  if (expiresAt === "invalid") {
    return { ok: false, error: "Enter a valid expiry date." };
  }

  const data = {
    perfumeId: values.perfumeId,
    platformId: values.platformId,
    verificationTypeId: values.verificationTypeId,
    link,
    expiresAt,
  };
  try {
    if (id) await prisma.affiliateLink.update({ where: { id }, data });
    else await prisma.affiliateLink.create({ data });
    revalidateAdmin();
    return { ok: true };
  } catch (error) {
    return saveFailure(error, "That affiliate link already exists.");
  }
}
