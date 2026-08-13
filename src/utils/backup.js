import { supabase } from "../lib/supabaseClient";

// ---------- FULL BACKUP (Personal + Business) ----------

export async function exportData() {
  const [
    expenses,
    budgets,
    categories,
    balanceEntries,
    products,
    sales,
    ledgerEntries,
  ] = await Promise.all([
    fetchAll("expenses"),
    fetchAll("budgets"),
    fetchAll("categories"),
    fetchAll("balance_entries"),
    fetchAll("products"),
    fetchAll("sales"),
    fetchAll("ledger_entries"),
  ]);

  const backup = {
    version: 4,
    exportedAt: new Date().toISOString(),
    expenses,
    budgets,
    categories,
    balanceEntries,
    products,
    sales,
    ledgerEntries,
  };

  downloadJson(
    backup,
    `moneytrail-backup-${new Date().toISOString().split("T")[0]}.json`,
  );
}

function isValidBackup(data) {
  if (!data || typeof data !== "object") return false;
  if (!Array.isArray(data.expenses)) return false;
  if (!Array.isArray(data.budgets)) return false;
  if (!Array.isArray(data.categories)) return false;
  return true;
}

export async function importData(file) {
  const data = await parseJsonFile(file);
  if (!isValidBackup(data)) throw new Error("Invalid backup file format.");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to import data.");

  await clearTable("expenses");
  await clearTable("budgets");
  await clearTable("categories");
  await clearTable("balance_entries");
  await clearTable("products");
  await clearTable("sales");
  await clearTable("ledger_entries");

  await insertAll("expenses", data.expenses, user.id);
  await insertAll("budgets", data.budgets, user.id);
  await insertAll("categories", data.categories, user.id);
  await insertAll("balance_entries", data.balanceEntries || [], user.id);

  await insertLinkedBusinessData(
    data.products || [],
    data.sales || [],
    data.ledgerEntries || [],
    user.id,
  );
}

// ---------- BUSINESS-ONLY BACKUP ----------

export async function exportBusinessData() {
  const [products, sales, ledgerEntries] = await Promise.all([
    fetchAll("products"),
    fetchAll("sales"),
    fetchAll("ledger_entries"),
  ]);

  const backup = {
    version: 1,
    scope: "business",
    exportedAt: new Date().toISOString(),
    products,
    sales,
    ledgerEntries,
  };

  downloadJson(
    backup,
    `cbn-chai-backup-${new Date().toISOString().split("T")[0]}.json`,
  );
}

function isValidBusinessBackup(data) {
  if (!data || typeof data !== "object") return false;
  if (!Array.isArray(data.products)) return false;
  if (!Array.isArray(data.sales)) return false;
  if (!Array.isArray(data.ledgerEntries)) return false;
  return true;
}

export async function importBusinessData(file) {
  const data = await parseJsonFile(file);
  if (!isValidBusinessBackup(data))
    throw new Error("Invalid business backup file format.");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to import data.");

  await clearTable("products");
  await clearTable("sales");
  await clearTable("ledger_entries");

  await insertLinkedBusinessData(
    data.products,
    data.sales,
    data.ledgerEntries,
    user.id,
  );
}

// ---------- SHARED HELPERS ----------

// Products, sales, and ledger_entries reference each other via product_id.
// Since Supabase assigns brand-new uuids on insert, we insert products FIRST,
// build an old-id -> new-id map from the returned rows, then rewrite every
// product_id in sales/ledgerEntries to point to the correct new product
// before inserting those.
async function insertLinkedBusinessData(
  products,
  sales,
  ledgerEntries,
  userId,
) {
  const idMap = {}; // old product id (string) -> new product id (uuid)

  if (products.length > 0) {
    const cleanProducts = products.map(({ id, created_at, ...rest }) => ({
      ...rest,
      user_id: userId,
    }));
    const { data: inserted, error } = await supabase
      .from("products")
      .insert(cleanProducts)
      .select();
    if (error) {
      console.error("Supabase import products error:", error);
      throw error;
    }
    products.forEach((oldProduct, i) => {
      idMap[oldProduct.id] = inserted[i].id;
    });
  }

  if (sales && sales.length > 0) {
    const cleanSales = sales.map(({ id, created_at, product_id, ...rest }) => ({
      ...rest,
      user_id: userId,
      product_id: product_id ? idMap[product_id] || null : null,
    }));
    const { error } = await supabase.from("sales").insert(cleanSales);
    if (error) {
      console.error("Supabase import sales error:", error);
      throw error;
    }
  }

  if (ledgerEntries && ledgerEntries.length > 0) {
    const cleanLedger = ledgerEntries.map(
      ({ id, created_at, product_id, ...rest }) => ({
        ...rest,
        user_id: userId,
        product_id: product_id ? idMap[product_id] || null : null,
      }),
    );
    const { error } = await supabase.from("ledger_entries").insert(cleanLedger);
    if (error) {
      console.error("Supabase import ledger error:", error);
      throw error;
    }
  }
}

async function fetchAll(table) {
  const { data, error } = await supabase.from(table).select("*");
  if (error) {
    console.error(`Supabase export error (${table}):`, error);
    return [];
  }
  return data;
}

async function clearTable(table) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from(table).delete().eq("user_id", user.id);
  if (error) console.error(`Supabase clear error (${table}):`, error);
}

async function insertAll(table, rows, userId) {
  if (!rows || rows.length === 0) return;
  const clean = rows.map(({ id, created_at, ...rest }) => ({
    ...rest,
    user_id: userId,
  }));
  const { error } = await supabase.from(table).insert(clean);
  if (error) {
    console.error(`Supabase import error (${table}):`, error);
    throw error;
  }
}

function downloadJson(obj, filename) {
  const json = JSON.stringify(obj, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function parseJsonFile(file) {
  return new Promise((resolve, reject) => {
    file
      .text()
      .then((text) => {
        try {
          resolve(JSON.parse(text));
        } catch {
          reject(new Error("Invalid file — not valid JSON."));
        }
      })
      .catch(reject);
  });
}

// ---------- LEGACY IMPORT (one-time: old phone/local Dexie backups) ----------
// Old backups use camelCase field names from the pre-Supabase version of the app.
// This converts them to the snake_case shape our Supabase tables expect.
