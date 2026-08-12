import Dexie from "dexie";

// Create the database
export const db = new Dexie("MoneyTrailDB");

// Define schema: tables and their indexed fields
db.version(4).stores({
  expenses: "++id, amount, category, date, createdAt",
  budgets: "++id, scope, month",
  categories: "++id, name",
  balanceEntries: "++id, amount, date, note, createdAt",
  products: "++id, name, section, createdAt",
  businessExpenses: "++id, amount, category, date, createdAt",
  sales: "++id, productId, paymentMode, date, createdAt",
  ledgerEntries: "++id, type, subtype, date, productId, createdAt",
});

// Seed default categories on first run
export async function seedDefaultCategories() {
  const count = await db.categories.count();
  if (count === 0) {
    await db.categories.bulkAdd([
      { name: "Food", color: "#10B981" },
      { name: "Transport", color: "#6366F1" },
      { name: "Rent", color: "#F59E0B" },
      { name: "Shopping", color: "#EC4899" },
      { name: "Bills", color: "#EF4444" },
      { name: "Entertainment", color: "#8B5CF6" },
      { name: "Other", color: "#9CA3AF" },
    ]);
  }
}
