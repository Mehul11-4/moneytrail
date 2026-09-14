import { useState } from "react";
import { Search, X, Plus } from "lucide-react";

function BilledItemsTable({ items, setItems, products }) {
  const [pickerRowIndex, setPickerRowIndex] = useState(null);
  const [search, setSearch] = useState("");

  const updateRow = (index, updates) => {
    setItems((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const merged = { ...row, ...updates };
        merged.amount =
          (parseFloat(merged.qty) || 0) * (parseFloat(merged.rate) || 0);
        return merged;
      }),
    );
  };

  const addRow = () => {
    setItems((prev) => [
      ...prev,
      {
        productId: "",
        productName: "",
        isStatic: false,
        qty: "",
        rate: "",
        amount: 0,
      },
    ]);
    setPickerRowIndex(items.length); // immediately open item picker for the new row
    setSearch("");
  };

  const removeRow = (index) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const openPicker = (index) => {
    setPickerRowIndex(index);
    setSearch("");
  };

  const selectProduct = (product) => {
    updateRow(pickerRowIndex, {
      productId: product.id,
      productName: product.name,
      isStatic: product.is_static,
      rate: product.mrp_per_qty,
      qty: items[pickerRowIndex]?.qty || "1",
    });
    setPickerRowIndex(null);
  };

  const filteredProducts = products.filter(
    (p) =>
      !search.trim() ||
      p.name.toLowerCase().includes(search.trim().toLowerCase()) ||
      p.section.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const total = items.reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div>
      <div className="rounded-control border border-white/10 overflow-hidden">
        <div className="grid grid-cols-12 bg-background/40 border-b border-white/10 px-2 py-2 text-[10px] font-medium text-textSecondary">
          <div className="col-span-5">Item Name</div>
          <div className="col-span-2 text-right">Qty</div>
          <div className="col-span-2 text-right">Rate</div>
          <div className="col-span-3 text-right">Amount</div>
        </div>

        {items.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-12 items-center px-1.5 py-1.5 text-xs border-b border-white/5 gap-1"
          >
            <button
              type="button"
              onClick={() => openPicker(i)}
              className="col-span-5 text-left px-1 py-1.5 truncate"
            >
              {row.productName || (
                <span className="text-textSecondary">Tap to select</span>
              )}
            </button>
            <input
              type="number"
              inputMode="decimal"
              value={row.qty}
              onChange={(e) => updateRow(i, { qty: e.target.value })}
              placeholder="0"
              className="col-span-2 bg-surface border border-white/10 rounded px-1 py-1.5 text-right text-xs focus:outline-none focus:border-primary"
            />
            <input
              type="number"
              inputMode="decimal"
              value={row.rate}
              onChange={(e) => updateRow(i, { rate: e.target.value })}
              placeholder="0"
              className="col-span-2 bg-surface border border-white/10 rounded px-1 py-1.5 text-right text-xs focus:outline-none focus:border-primary"
            />
            <div className="col-span-3 flex items-center justify-end gap-1.5">
              <span className="font-medium">
                ₹{(row.amount || 0).toFixed(2)}
              </span>
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="text-textSecondary hover:text-danger"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        <div className="grid grid-cols-12 px-2 py-2.5 bg-surface text-sm font-bold">
          <div className="col-span-9">Total</div>
          <div className="col-span-3 text-right">₹{total.toFixed(2)}</div>
        </div>
      </div>

      <button
        type="button"
        onClick={addRow}
        className="w-full flex items-center justify-center gap-2 mt-2 py-2.5 text-primary text-sm font-medium border border-dashed border-primary/30 rounded-control"
      >
        <Plus className="w-4 h-4" /> Add Item
      </button>

      {/* Item picker — bottom sheet, opens with search focused */}
      {pickerRowIndex !== null && (
        <div
          className="fixed inset-0 bg-black/70 z-[90] flex items-end"
          onClick={() => setPickerRowIndex(null)}
        >
          <div
            className="w-full bg-surface border-t border-white/10 rounded-t-2xl p-4 max-h-[75vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <p className="font-heading font-bold">Select Item</p>
              <button
                onClick={() => setPickerRowIndex(null)}
                className="text-textSecondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-textSecondary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items..."
                className="w-full bg-background border border-white/10 rounded-control pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div className="overflow-y-auto flex-1">
              {filteredProducts.length === 0 && (
                <p className="text-textSecondary text-sm p-2">
                  No items found.
                </p>
              )}
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectProduct(p)}
                  className="w-full text-left px-3 py-3 text-sm hover:bg-white/5 border-b border-white/5 last:border-b-0"
                >
                  {p.section} — {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BilledItemsTable;
