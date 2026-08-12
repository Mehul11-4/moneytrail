import { db } from "../db/database";

// Export all data as a downloadable JSON file
export async function exportData() {
  const expenses = await db.expenses.toArray();
  const budgets = await db.budgets.toArray();
  const categories = await db.categories.toArray();
  const balanceEntries = await db.balanceEntries.toArray();
  const products = await db.products.toArray();
  const sales = await db.sales.toArray();
  const ledgerEntries = await db.ledgerEntries.toArray();

  const backup = {
    version: 3,
    exportedAt: new Date().toISOString(),
    expenses,
    budgets,
    categories,
    balanceEntries,
    products,
    sales,
    ledgerEntries,
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
  // These are optional for backward compatibility with older backup versions
  if (data.balanceEntries !== undefined && !Array.isArray(data.balanceEntries))
    return false;
  if (data.products !== undefined && !Array.isArray(data.products))
    return false;
  if (data.sales !== undefined && !Array.isArray(data.sales)) return false;
  if (data.ledgerEntries !== undefined && !Array.isArray(data.ledgerEntries))
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

  await db.transaction(
    "rw",
    db.expenses,
    db.budgets,
    db.categories,
    db.balanceEntries,
    db.products,
    db.sales,
    db.ledgerEntries,
    async () => {
      await db.expenses.clear();
      await db.budgets.clear();
      await db.categories.clear();
      await db.balanceEntries.clear();
      await db.products.clear();
      await db.sales.clear();
      await db.ledgerEntries.clear();

      // Tables with NO cross-references — safe to strip ids and let Dexie reassign
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

      // Business tables: products, sales, and ledgerEntries reference each other
      // via productId — so we KEEP their original ids exactly as exported,
      // using db.products.put() / db.sales.put() (put = insert-with-specific-id)
      // instead of bulkAdd (which would auto-generate new ids and break the links).
      const products = data.products || [];
      const sales = data.sales || [];
      const ledgerEntries = data.ledgerEntries || [];

      for (const product of products) {
        await db.products.put(product);
      }
      for (const sale of sales) {
        await db.sales.put(sale);
      }
      for (const entry of ledgerEntries) {
        await db.ledgerEntries.put(entry);
      }
    },
  );
}

// Export ONLY business data (products, sales, ledger entries)
export async function exportBusinessData() {
  const products = await db.products.toArray();
  const sales = await db.sales.toArray();
  const ledgerEntries = await db.ledgerEntries.toArray();

  const backup = {
    version: 1,
    scope: "business",
    exportedAt: new Date().toISOString(),
    products,
    sales,
    ledgerEntries,
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `cbn-chai-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function isValidBusinessBackup(data) {
  if (!data || typeof data !== "object") return false;
  if (!Array.isArray(data.products)) return false;
  if (!Array.isArray(data.sales)) return false;
  if (!Array.isArray(data.ledgerEntries)) return false;
  return true;
}

// Import ONLY business data, replacing current business data (personal data untouched)
export async function importBusinessData(file) {
  const text = await file.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Invalid file — not valid JSON.");
  }

  if (!isValidBusinessBackup(data)) {
    throw new Error("Invalid business backup file format.");
  }

  await db.transaction(
    "rw",
    db.products,
    db.sales,
    db.ledgerEntries,
    async () => {
      await db.products.clear();
      await db.sales.clear();
      await db.ledgerEntries.clear();

      for (const product of data.products) {
        await db.products.put(product);
      }
      for (const sale of data.sales) {
        await db.sales.put(sale);
      }
      for (const entry of data.ledgerEntries) {
        await db.ledgerEntries.put(entry);
      }
    },
  );
}
