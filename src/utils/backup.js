import { db } from "../db/database";

// Export all data as a downloadable JSON file
export async function exportData() {
  const expenses = await db.expenses.toArray();
  const budgets = await db.budgets.toArray();
  const categories = await db.categories.toArray();
  const balanceEntries = await db.balanceEntries.toArray();

  const backup = {
    version: 2,
    exportedAt: new Date().toISOString(),
    expenses,
    budgets,
    categories,
    balanceEntries,
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `moneytrail-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Validate the shape of an uploaded backup file before trusting it
function isValidBackup(data) {
  if (!data || typeof data !== "object") return false;
  if (!Array.isArray(data.expenses)) return false;
  if (!Array.isArray(data.budgets)) return false;
  if (!Array.isArray(data.categories)) return false;
  // balanceEntries is optional for backward compatibility with older (v1) backup files
  if (data.balanceEntries !== undefined && !Array.isArray(data.balanceEntries))
    return false;
  return true;
}

// Import data from an uploaded JSON file, replacing current data
export async function importData(file) {
  const text = await file.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Invalid file — not valid JSON.");
  }

  if (!isValidBackup(data)) {
    throw new Error("Invalid backup file format.");
  }

  // Clear existing data, then restore from backup — done as a transaction
  // so it either fully succeeds or fully fails, never leaves a half-imported state
  await db.transaction(
    "rw",
    db.expenses,
    db.budgets,
    db.categories,
    db.balanceEntries,
    async () => {
      await db.expenses.clear();
      await db.budgets.clear();
      await db.categories.clear();
      await db.balanceEntries.clear();

      // Strip old "id" fields so Dexie re-assigns fresh auto-increment ids
      // (prevents ID collisions if the backup came from a different install)
      const cleanExpenses = data.expenses.map(({ id, ...rest }) => rest);
      const cleanBudgets = data.budgets.map(({ id, ...rest }) => rest);
      const cleanCategories = data.categories.map(({ id, ...rest }) => rest);
      const cleanBalanceEntries = (data.balanceEntries || []).map(
        ({ id, ...rest }) => rest,
      );

      await db.expenses.bulkAdd(cleanExpenses);
      await db.budgets.bulkAdd(cleanBudgets);
      await db.categories.bulkAdd(cleanCategories);
      await db.balanceEntries.bulkAdd(cleanBalanceEntries);
    },
  );
}
