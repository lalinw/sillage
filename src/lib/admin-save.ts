import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { isConnectionError, NO_CONNECTION_MESSAGE } from "@/lib/prisma";

// Shared pieces for the admin "Add" forms' server actions.

export type FormValues = Record<string, string>;

export type SaveResult = { ok: true } | { ok: false; error: string };

// Trimmed text, or null when left empty.
export function optionalText(values: FormValues, key: string) {
  return values[key]?.trim() || null;
}

// Returns an error message for the first required field left empty.
export function missingField(
  values: FormValues,
  required: Record<string, string>,
) {
  for (const [key, label] of Object.entries(required)) {
    if (!values[key]?.trim()) return `${label} is required.`;
  }
  return null;
}

// Returns an error message when a link isn't a full http(s) address.
export function invalidLink(link: string) {
  if (!URL.canParse(link)) return "Enter a full link, starting with https://.";
  if (!["http:", "https:"].includes(new URL(link).protocol)) {
    return "The link must start with http:// or https://.";
  }
  return null;
}

// A date from a date input (YYYY-MM-DD), null when empty, or "invalid".
export function parseDate(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(date.getTime())
    ? date
    : "invalid";
}

// New rows show up on other admin pages too (e.g. a new brand in the perfume form).
export function revalidateAdmin() {
  revalidatePath("/admin", "layout");
}

// Turns an expected database failure into a message for the form.
// Anything else is a bug, so it's rethrown.
export function saveFailure(
  error: unknown,
  duplicateMessage: string,
): SaveResult {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return { ok: false, error: duplicateMessage };
    if (error.code === "P2025") {
      return {
        ok: false,
        error: "This row no longer exists. Reload and try again.",
      };
    }
    if (error.code === "P2003") {
      return {
        ok: false,
        error:
          "One of the chosen options no longer exists. Reload and try again.",
      };
    }
  }
  if (isConnectionError(error)) {
    return { ok: false, error: NO_CONNECTION_MESSAGE };
  }
  throw error;
}
