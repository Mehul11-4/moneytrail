// Supabase returns at most 1000 rows per request by default. This helper keeps
// asking for the next 1000 until everything has been loaded, and gives back
// the same { data, error } shape as a normal Supabase query, so the hooks
// only need a tiny change.
//
// IMPORTANT: the query you pass in must have a stable order (we add
// .order("id") at the end) so rows are never skipped or repeated between pages.

const PAGE_SIZE = 1000;

export async function fetchAllRows(makeQuery) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await makeQuery().range(from, from + PAGE_SIZE - 1);
    if (error) return { data: null, error };
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return { data: rows, error: null };
}
