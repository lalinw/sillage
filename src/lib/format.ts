// Fixed format and timezone so server and browser render the same text.
export function formatDateTime(date: Date) {
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

export function formatDate(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : null;
}
