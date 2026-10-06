import { useState, useMemo } from "react";
import { FileText, Search, Trash2, Pencil, X } from "lucide-react";
import Card from "../../components/Card";
import { useSales } from "../../hooks/useSales";
import { useProducts } from "../../hooks/useProducts";
import { formatDate } from "../../utils/formatDate";
import { roundMoney } from "../../utils/money";

function SaleList() {
  const { sales, loading, deleteSales, updateSaleBlock } = useSales();
  const { products, restoreStockQty, deductStock } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [editingKey, setEditingKey] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editRows, setEditRows] = useState([]);
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const uniqueProducts = useMemo(() => {
    const names = new Set(sales.map((s) => s.productName));
    return Array.from(names).sort();
  }, [sales]);

  // Group into transaction blocks (multi-item carts show as one block)
  const grouped = useMemo(() => {
    const map = {};
    const order = [];
    sales.forEach((s) => {
      const key = s.transactionId || s.id;
      if (!map[key]) {
        map[key] = {
          key,
          items: [],
          total: 0,
          received: 0,
          paymentMode: s.paymentMode,
          customerName: s.customerName,
          date: s.date,
          time: s.time,
        };
        order.push(key);
      }
      map[key].items.push(s);
      map[key].total += s.total;
      map[key].received += s.receivedAmount || 0;
    });
    return order.map((k) => map[k]);
  }, [sales]);

  // When a product/date filter is active, narrow each block down to ONLY
  // the matching items — not just show/hide the whole block — so you can
  // isolate one item's sale even inside a bigger multi-item transaction.
  const filtered = useMemo(() => {
    let result = grouped;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (g) =>
          (g.customerName || "").toLowerCase().includes(q) ||
          g.items.some((i) => i.productName.toLowerCase().includes(q)),
      );
    }

    if (dateFilter) {
      result = result.filter((g) => g.date === dateFilter);
    }

    if (productFilter) {
      result = result
        .map((g) => ({
          ...g,
          items: g.items.filter((i) => i.productName === productFilter),
        }))
        .filter((g) => g.items.length > 0);
    }

    return result;
  }, [grouped, searchQuery, dateFilter, productFilter]);

  const totalSale = useMemo(
    () => sales.reduce((sum, s) => sum + s.total, 0),
    [sales],
  );

  // Balance Due = what is still unpaid on Udhaar bills (total minus the
  // amount already received). Calculated per transaction, because for
  // multi-item bills the received amount is stored on the first row only.
  // This matches how the Parties page calculates "To Receive".
  const balanceDue = useMemo(
    () =>
      grouped
        .filter((g) => g.paymentMode === "Udhaar")
        .reduce(
          (sum, g) => sum + Math.max(0, roundMoney(g.total - g.received)),
          0,
        ),
    [grouped],
  );

  const handleDeleteBlock = async (block) => {
    setDeleteError("");
    // Delete every row of the bill in ONE request: all or nothing.
    const { error } = await deleteSales(block.items.map((item) => item.id));
    if (error) {
      // Nothing was deleted, so the stock must stay as it is.
      setDeleteError(
        "Could not delete this bill. Nothing was changed. Please try again.",
      );
      setConfirmDelete(null);
      return;
    }
    for (const item of block.items) {
      await restoreStockQty(item.productId, item.qtySold);
    }
    setConfirmDelete(null);
  };

  // The bill being edited, always the FULL bill (not the filtered view)
  const editingBlock = useMemo(
    () => grouped.find((g) => g.key === editingKey) || null,
    [grouped, editingKey],
  );

  const startEdit = (block) => {
    const original = grouped.find((g) => g.key === block.key);
    if (!original) return;
    setEditingKey(original.key);
    setEditDate(original.date);
    setEditRows(
      original.items.map((i) => ({
        id: i.id,
        productId: i.productId || "",
        qty: String(i.qtySold),
      })),
    );
    setEditError("");
  };

  const closeEdit = () => {
    if (editSaving) return;
    setEditingKey(null);
    setEditError("");
  };

  const updateEditRow = (index, field, value) => {
    setEditRows((rows) =>
      rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    );
  };

  const handleSaveEdit = async () => {
    if (editSaving || !editingBlock) return;
    setEditError("");
    if (!editDate) return setEditError("Select a date.");

    const isUdhaar = editingBlock.paymentMode === "Udhaar";
    const edits = [];
    for (const row of editRows) {
      const old = editingBlock.items.find((i) => i.id === row.id);
      const qty = parseFloat(row.qty);
      if (!qty || qty <= 0)
        return setEditError("Enter a valid quantity for every item.");

      const product = products.find((p) => p.id === row.productId);
      const productChanged = row.productId !== (old.productId || "");
      if (productChanged && !product)
        return setEditError("Select a product for every item.");

      // Same product: keep the rate and cost it was sold at.
      // New product: use that product's current rate and cost price.
      const rate = productChanged ? product.mrp_per_qty : old.mrpAtSale;
      const total = roundMoney(qty * rate);

      edits.push({
        id: old.id,
        old,
        product,
        productId: row.productId || null,
        productName: productChanged ? product.name : old.productName,
        qtySold: qty,
        mrpAtSale: rate,
        pricePerQtyAtSale: productChanged
          ? product.price_per_qty || 0
          : old.pricePerQtyAtSale,
        total,
      });
    }

    // Udhaar: the new bill total cannot go below what is already received.
    // The received amount belongs to the WHOLE bill (it is stored on one row),
    // so it is compared with the bill total, not with a single row.
    if (isUdhaar) {
      const newBillTotal = roundMoney(edits.reduce((s, e) => s + e.total, 0));
      const receivedSoFar = roundMoney(editingBlock.received);
      // Only block an edit that LOWERS the bill below the received money.
      // If the bill was already over-received before, raising it is allowed.
      if (
        newBillTotal < receivedSoFar &&
        newBillTotal < roundMoney(editingBlock.total)
      )
        return setEditError(
          `New bill total ₹${newBillTotal.toFixed(2)} is less than the ₹${receivedSoFar.toFixed(2)} already received.`,
        );
    }

    // Stock check: stock needed per product must fit what is in stock
    // PLUS what this bill had already taken from it.
    const need = {};
    const alreadyTaken = {};
    for (const e of edits) {
      if (!e.product || e.product.is_static) continue;
      need[e.productId] = (need[e.productId] || 0) + e.qtySold;
    }
    for (const i of editingBlock.items) {
      alreadyTaken[i.productId] = (alreadyTaken[i.productId] || 0) + i.qtySold;
    }
    for (const [productId, qty] of Object.entries(need)) {
      const product = products.find((p) => p.id === productId);
      const available = product.stock_qty + (alreadyTaken[productId] || 0);
      if (qty > available)
        return setEditError(
          `Only ${available} pcs of ${product.name} in stock.`,
        );
    }

    setEditSaving(true);
    try {
      const { error } = await updateSaleBlock(
        editingBlock.items,
        edits,
        editDate,
      );
      if (error) {
        setEditError("Could not save the changes. Please check and try again.");
        return;
      }
      // Bill is saved, now fix the stock: give back the old quantity,
      // take the new one.
      for (const e of edits) {
        if (e.old.productId === e.productId) {
          if (!e.product) continue; // product no longer exists
          const diff = e.qtySold - e.old.qtySold;
          if (diff > 0)
            await deductStock(e.productId, diff, e.product.is_static);
          else if (diff < 0) await restoreStockQty(e.productId, -diff);
        } else {
          await restoreStockQty(e.old.productId, e.old.qtySold);
          await deductStock(e.productId, e.qtySold, e.product.is_static);
        }
      }
      setEditingKey(null);
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary font-body p-4 pb-24">
      <div className="flex items-center gap-3 mt-6 mb-4">
        <FileText className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-heading font-bold">Sale List</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card>
          <p className="text-textSecondary text-xs mb-1">Total Sale</p>
          <p className="text-xl font-heading font-bold">
            ₹{totalSale.toFixed(2)}
          </p>
        </Card>
        <Card className={balanceDue > 0 ? "border-danger/30" : ""}>
          <p className="text-textSecondary text-xs mb-1">Balance Due</p>
          <p
            className={`text-xl font-heading font-bold ${balanceDue > 0 ? "text-danger" : ""}`}
          >
            ₹{balanceDue.toFixed(2)}
          </p>
        </Card>
      </div>

      {grouped.length > 3 && (
        <>
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-textSecondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer or item..."
              className="w-full bg-surface border border-white/10 rounded-control pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-2 mb-3">
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="flex-1 bg-surface border border-border rounded-control px-3 py-2 text-xs focus:outline-none focus:border-primary"
            >
              <option value="">All Products</option>
              {uniqueProducts.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="flex-1 bg-surface border border-border rounded-control px-3 py-2 text-xs focus:outline-none focus:border-primary"
            />
            {(productFilter || dateFilter) && (
              <button
                onClick={() => {
                  setProductFilter("");
                  setDateFilter("");
                }}
                className="text-textSecondary text-xs px-2"
              >
                Clear
              </button>
            )}
          </div>
        </>
      )}

      {deleteError && <p className="text-danger text-sm mb-3">{deleteError}</p>}
      {loading && <p className="text-textSecondary text-sm">Loading...</p>}
      {!loading && filtered.length === 0 && (
        <p className="text-textSecondary text-sm">No sales recorded yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((block) => {
          const displayTotal = block.items.reduce((sum, i) => sum + i.total, 0);
          const isPartialView =
            productFilter &&
            block.items.length <
              (grouped.find((g) => g.key === block.key)?.items.length || 0);
          return (
            <Card key={block.key}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  {block.customerName && (
                    <p className="text-sm font-medium">{block.customerName}</p>
                  )}
                  <p className="text-xs text-textSecondary">
                    {formatDate(block.date)} · {block.time} ·{" "}
                    {block.paymentMode}
                  </p>
                  {isPartialView && (
                    <p className="text-[10px] text-textSecondary/70">
                      Showing filtered item only
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-heading font-bold text-success">
                    ₹{displayTotal.toFixed(2)}
                  </p>
                  {confirmDelete === block.key ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteBlock(block)}
                        className="text-danger text-xs font-medium"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-textSecondary text-xs"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(block)}
                        className="text-textSecondary hover:text-primary"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(block.key)}
                        className="text-textSecondary hover:text-danger"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-control border border-white/10 overflow-hidden compact-table">
                <div className="grid grid-cols-12 bg-background/40 border-b border-white/10 px-2 py-1.5 text-[9px] font-medium text-textSecondary">
                  <div className="col-span-5">Item</div>
                  <div className="col-span-2 text-right">Qty</div>
                  <div className="col-span-2 text-right">Rate</div>
                  <div className="col-span-3 text-right">Amount</div>
                </div>
                {block.items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 px-2 py-1.5 text-xs border-b border-white/5 last:border-b-0"
                  >
                    <div className="col-span-5 truncate">
                      {item.productName}
                    </div>
                    <div className="col-span-2 text-right">{item.qtySold}</div>
                    <div className="col-span-2 text-right rupee-amount">
                      {item.mrpAtSale.toFixed(2)}
                    </div>
                    <div className="col-span-3 text-right font-medium rupee-amount">
                      {item.total.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {editingBlock && (
        <div
          className="fixed inset-0 bg-black/70 z-[80] flex items-end"
          onClick={closeEdit}
        >
          <div
            className="w-full bg-surface border-t border-white/10 rounded-t-2xl p-4 pb-8 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <p className="font-heading font-bold text-lg">Edit Sale</p>
              <button onClick={closeEdit} className="text-textSecondary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[10px] text-textSecondary mb-1">Date</p>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="w-full bg-background border border-border rounded-control px-3 py-2 text-sm mb-4 focus:outline-none focus:border-primary"
            />

            <div className="flex flex-col gap-3 mb-4">
              {editRows.map((row, index) => (
                <div key={row.id} className="grid grid-cols-12 gap-2">
                  <div className="col-span-8">
                    <p className="text-[10px] text-textSecondary mb-1">Item</p>
                    <select
                      value={row.productId}
                      onChange={(e) =>
                        updateEditRow(index, "productId", e.target.value)
                      }
                      className="w-full bg-background border border-border rounded-control px-2 py-2 text-sm focus:outline-none focus:border-primary"
                    >
                      {!row.productId && (
                        <option value="">Select product</option>
                      )}
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-4">
                    <p className="text-[10px] text-textSecondary mb-1">Qty</p>
                    <input
                      type="number"
                      min="0"
                      value={row.qty}
                      onChange={(e) =>
                        updateEditRow(index, "qty", e.target.value)
                      }
                      className="w-full bg-background border border-border rounded-control px-2 py-2 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-textSecondary mb-3">
              Rate stays the same unless you change the item. Changing the item
              uses that item's current rate.
            </p>
            {editError && (
              <p className="text-danger text-sm mb-3">{editError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={editSaving}
                className="flex-1 bg-primary text-background rounded-control py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={closeEdit}
                className="flex-1 border border-border rounded-control py-2.5 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SaleList;
