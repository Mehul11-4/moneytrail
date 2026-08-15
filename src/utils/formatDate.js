// Converts a stored ISO date ("2026-08-14") to DD/MM/YYYY for display.
// Never changes what's stored in the database — only how it's shown.
export function formatDate(isoDate) {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate; // fallback if format is unexpected
  return `${day}/${month}/${year}`;
}
