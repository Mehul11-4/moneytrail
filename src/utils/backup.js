import { supabase } from "../lib/supabaseClient";
import { fetchAllRows } from "../lib/fetchAllRows";

// ---------- FULL BACKUP (Personal + Business) ----------

// Backup-file key -> database table, for all BUSINESS data.
// Listed CHILD tables first (rows that point to other rows), so a restore
// always deletes them before the rows they point to.
const BUSINESS_TABLES = [
  ["purchasePayments", "purchase_payments"],
  ["udhaarPayments", "udhaar_payments"],
  ["loans", "loans"],
  ["purchases", "purchases"],
  ["sales", "sales"],
  ["ledgerEntries", "ledger_entries"],
  ["products", "products"],
  ["lenders", "lenders"],
  ["parties", "parties"],
  ["productTypes", "product_types"],
];

const PERSONAL_TABLES = [
  ["expenses", "expenses"],
  ["budgets", "budgets"],
  ["categories", "categories"],
  ["balanceEntries", "balance_entries"],
];

async function buildFullBackup() {
  const [
    expenses,
    budgets,
    categories,
    balanceEntries,
    products,
    sales,
    ledgerEntries,
    purchases,
    parties,
    lenders,
    loans,
    udhaarPayments,
    productTypes,
  ] = await Promise.all([
    fetchAll("expenses"),
    fetchAll("budgets"),
    fetchAll("categories"),
    fetchAll("balance_entries"),
    fetchAll("products"),
    fetchAll("sales"),
    fetchAll("ledger_entries"),
    fetchAll("purchases"),
    fetchAll("parties"),
    fetchAll("lenders"),
    fetchAll("loans"),
    fetchAll("udhaar_payments"),
    fetchAll("product_types"),
  ]);

  const purchasePayments = await fetchAll("purchase_payments");

  return {
    version: 5,
    purchasePayments,
    exportedAt: new Date().toISOString(),
    expenses,
    budgets,
    categories,
    balanceEntries,
    products,
    sales,
    ledgerEntries,
    purchases,
    parties,
    lenders,
    loans,
    udhaarPayments,
    productTypes,
  };
}

export async function exportData() {
  const backup = await buildFullBackup();
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

  // SAFETY NET: download a copy of what is in the database right now,
  // BEFORE anything is deleted. If the restore fails, this file is your way back.
  const safetyCopy = await buildFullBackup();
  downloadJson(
    safetyCopy,
    `moneytrail-BEFORE-restore-${new Date().toISOString().split("T")[0]}.json`,
  );

  // Only tables that the backup file actually contains are cleared.
  await clearTablesPresentIn(data, BUSINESS_TABLES);
  await clearTablesPresentIn(data, PERSONAL_TABLES);

  await insertAll("expenses", data.expenses, user.id);
  await insertAll("budgets", data.budgets, user.id);
  await insertAll("categories", data.categories, user.id);
  await insertAll("balance_entries", data.balanceEntries || [], user.id);
  await insertBusinessData(data, user.id);
}

// ---------- BUSINESS-ONLY BACKUP ----------

async function buildBusinessBackup() {
  const [
    products,
    sales,
    ledgerEntries,
    purchases,
    parties,
    lenders,
    loans,
    udhaarPayments,
    productTypes,
  ] = await Promise.all([
    fetchAll("products"),
    fetchAll("sales"),
    fetchAll("ledger_entries"),
    fetchAll("purchases"),
    fetchAll("parties"),
    fetchAll("lenders"),
    fetchAll("loans"),
    fetchAll("udhaar_payments"),
    fetchAll("product_types"),
  ]);

  const purchasePayments = await fetchAll("purchase_payments");

  return {
    version: 2,
    scope: "business",
    purchasePayments,
    exportedAt: new Date().toISOString(),
    products,
    sales,
    ledgerEntries,
    purchases,
    parties,
    lenders,
    loans,
    udhaarPayments,
    productTypes,
  };
}

export async function exportBusinessData() {
  const backup = await buildBusinessBackup();
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

  // SAFETY NET: download the current business data before deleting anything.
  const safetyCopy = await buildBusinessBackup();
  downloadJson(
    safetyCopy,
    `cbn-chai-BEFORE-restore-${new Date().toISOString().split("T")[0]}.json`,
  );

  await clearTablesPresentIn(data, BUSINESS_TABLES);
  await insertBusinessData(data, user.id);
}

// ---------- SHARED HELPERS ----------

// Inserts all business tables in the right order. Supabase gives every
// inserted row a brand-new id, so for each table we remember "old id -> new id"
// and use it to repair the links in the tables that point to it
// (e.g. sales.product_id, sales.party_id, loans.lender_id, udhaar_payments.sale_id).
async function insertBusinessData(data, userId) {
  // Tables that other tables point to come first.
  const partyIds = await insertWithIdMap("parties", data.parties, userId);
  const lenderIds = await insertWithIdMap("lenders", data.lenders, userId);
  const productIds = await insertWithIdMap("products", data.products, userId);
  await insertWithIdMap("product_types", data.productTypes, userId);

  const saleIds = await insertWithIdMap("sales", data.sales, userId, {
    product_id: productIds,
    party_id: partyIds,
  });
  const purchaseIds = await insertWithIdMap(
    "purchases",
    data.purchases,
    userId,
    {
      product_id: productIds,
      party_id: partyIds,
    },
  );
  await insertWithIdMap("loans", data.loans, userId, {
    lender_id: lenderIds,
  });
  await insertWithIdMap("ledger_entries", data.ledgerEntries, userId, {
    product_id: productIds,
  });
  await insertWithIdMap("udhaar_payments", data.udhaarPayments, userId, {
    sale_id: saleIds,
  });
  await insertWithIdMap("purchase_payments", data.purchasePayments, userId, {
    purchase_id: purchaseIds,
  });
}

// Inserts rows in batches of 500 and returns { oldId: newId }.
// - If the backup file does not contain this table at all, returns null
//   (so links pointing at it are left exactly as they were).
// - `links` says which columns point to other tables, e.g.
//   { product_id: productIds } repairs product_id using that map.
async function insertWithIdMap(table, rows, userId, links = {}) {
  if (!Array.isArray(rows)) return null;

  const idMap = {};
  const BATCH_SIZE = 500;

  for (let start = 0; start < rows.length; start += BATCH_SIZE) {
    const batch = rows
      .slice(start, start + BATCH_SIZE)
      .map(({ id, created_at, ...rest }) => {
        const row = { ...rest, user_id: userId };
        for (const [column, map] of Object.entries(links)) {
          if (map && row[column]) row[column] = map[row[column]] || null;
        }
        return row;
      });

    const { data: inserted, error } = await supabase
      .from(table)
      .insert(batch)
      .select("id");
    if (error) {
      console.error(`Supabase import error (${table}):`, error);
      throw error;
    }
    inserted.forEach((newRow, i) => {
      idMap[rows[start + i].id] = newRow.id;
    });
  }

  return idMap;
}

async function clearTablesPresentIn(data, tables) {
  for (const [key, table] of tables) {
    if (
      Array.isArray(data[key]) ||
      (key === "purchasePayments" && Array.isArray(data.purchases))
    )
      await clearTable(table);
  }
}

async function fetchAll(table) {
  const { data, error } = await fetchAllRows(() =>
    supabase.from(table).select("*").order("id"),
  );
  if (error) {
    console.error(`Supabase export error (${table}):`, error);
    // Stop instead of quietly producing a backup that is missing a table.
    throw new Error(`Could not read "${table}". Backup cancelled.`);
  }
  return data;
}

async function clearTable(table) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from(table).delete().eq("user_id", user.id);
  if (error) {
    console.error(`Supabase clear error (${table}):`, error);
    // Stop instead of carrying on and inserting duplicates.
    throw new Error(`Could not clear "${table}". Restore stopped.`);
  }
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
