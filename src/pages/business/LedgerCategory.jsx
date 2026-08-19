import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Plus, X, Search, Pencil } from "lucide-react";
import { formatDate } from "../../utils/formatDate";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { useSales } from "../../hooks/useSales";
import { useLedger } from "../../hooks/useLedger";
import { useProducts } from "../../hooks/useProducts";
import { useProductTypes } from "../../hooks/useProductTypes";
import { usePersistedState } from "../../hooks/usePersistedState";
const LABELS = {
  sale: "Sale",
  capital: "Capital",
  "loan-taken": "Loan Taken",
  borrowed: "Borrowed (Friends/Family)",
  "purchase-goods": "Purchase Goods",
  "loan-interest": "Loan Interest",
  rent: "Rent",
  electricity: "Electricity",
  "water-bill": "Water Bill",
  "other-jama": "Other",
  "other-kharch": "Other",
};

const TYPE_OF = {
  sale: "jama",
  capital: "jama",
  "loan-taken": "jama",
  borrowed: "jama",
  "other-jama": "jama",
  "purchase-goods": "kharch",
  "loan-interest": "kharch",
  rent: "kharch",
  electricity: "kharch",
  "water-bill": "kharch",
  "other-kharch": "kharch",
};

function LedgerCategory() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const label = LABELS[slug] || "Entries";
  const type = TYPE_OF[slug] || "jama";
  const subtypeName =
    slug === "other-jama" || slug === "other-kharch" ? "Other" : label;

  const { sales, deleteSale, updateSale } = useSales();
  const [editingSaleId, setEditingSaleId] = useState(null);
  const [editSaleQty, setEditSaleQty] = useState("");
  const [editSaleDate, setEditSaleDate] = useState("");
  const {
    entries,
    loading,
    addLedgerEntry,
    addPurchaseGoods,
    deleteLedgerEntry,
    updateLedgerEntry,
    updatePurchaseGoods,
  } = useLedger();
  const [editingItem, setEditingItem] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editUnits, setEditUnits] = useState("");
  const [editError, setEditError] = useState("");
  const { products, restoreStockQty } = useProducts();
  const { productTypes, addProductType } = useProductTypes();
  const [addingNewType, setAddingNewType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeError, setNewTypeError] = useState("");

  const [amount, setAmount] = usePersistedState(`ledger_${slug}_amount`, "");
  const [date, setDate] = usePersistedState(
    `ledger_${slug}_date`,
    new Date().toISOString().split("T")[0],
  );
  const [note, setNote] = usePersistedState(`ledger_${slug}_note`, "");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewingDetail, setViewingDetail] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Purchase Goods specific
  // Only persist state for the purchase-goods form specifically, keyed by
  // slug so Rent/Electricity/etc. forms never collide with each other
  const [purchaseMode, setPurchaseMode] = usePersistedState(
    `ledger_${slug}_purchaseMode`,
    "existing",
  );
  const [selectedProductId, setSelectedProductId] = usePersistedState(
    `ledger_${slug}_selectedProductId`,
    "",
  );
  const [restockSearch, setRestockSearch] = useState("");
  const [showRestockList, setShowRestockList] = useState(false);
  const [unitsPurchased, setUnitsPurchased] = usePersistedState(
    `ledger_${slug}_unitsPurchased`,
    "",
  );
  const [newSection, setNewSection] = usePersistedState(
    `ledger_${slug}_newSection`,
    "",
  );
  const [newName, setNewName] = usePersistedState(`ledger_${slug}_newName`, "");
  const [newUnitLabel, setNewUnitLabel] = usePersistedState(
    `ledger_${slug}_newUnitLabel`,
    "",
  );
  const [newQtyPerUnit, setNewQtyPerUnit] = usePersistedState(
    `ledger_${slug}_newQtyPerUnit`,
    "",
  );
  const [newUnitPrice, setNewUnitPrice] = usePersistedState(
    `ledger_${slug}_newUnitPrice`,
    "",
  );
  const [newMrp, setNewMrp] = usePersistedState(`ledger_${slug}_newMrp`, "");
  // Unfiltered list — used to decide whether to show the search bar at all
  const allItems = useMemo(() => {
    if (slug === "sale") {
      return sales.map((s) => ({
        kind: "sale",
        id: s.id,
        amount: s.total,
        date: s.date,
        time: s.time,
        note: `${s.productName} × ${s.qtySold}${s.customerName ? ` — ${s.customerName}` : ""}`,
        raw: s,
        createdAt: s.createdAt,
      }));
    }
    return entries
      .filter((e) => e.subtype === subtypeName && e.type === type)
      .map((e) => ({
        kind: "ledger",
        id: e.id,
        amount: e.amount,
        date: e.date,
        time: null,
        note: e.note,
        raw: e,
        createdAt: e.createdAt,
      }));
  }, [slug, sales, entries, subtypeName, type]);

  // Filtered list — what's actually displayed below
  const items = useMemo(() => {
    if (!searchQuery.trim()) return allItems;
    const q = searchQuery.trim().toLowerCase();
    return allItems.filter((item) =>
      (item.note || "").toLowerCase().includes(q),
    );
  }, [allItems, searchQuery]);

  // For the Sale category only: group items by transaction (multi-item carts
  // show as one block), then group those blocks by date (newest date first),
  // with the date shown once as a header instead of repeated per row.
  const saleDateGroups = useMemo(() => {
    if (slug !== "sale") return [];

    const byTransaction = {};
    const order = [];
    items.forEach((item) => {
      const key = item.raw.transactionId || item.id;
      if (!byTransaction[key]) {
        byTransaction[key] = { key, date: item.date, items: [], total: 0 };
        order.push(key);
      }
      byTransaction[key].items.push(item);
      byTransaction[key].total += item.amount;
    });
    const blocks = order.map((k) => byTransaction[k]);

    const byDate = {};
    const dateOrder = [];
    blocks.forEach((block) => {
      if (!byDate[block.date]) {
        byDate[block.date] = [];
        dateOrder.push(block.date);
      }
      byDate[block.date].push(block);
    });
    dateOrder.sort((a, b) => (a < b ? 1 : -1)); // newest date first

    return dateOrder.map((date) => ({ date, blocks: byDate[date] }));
  }, [items, slug]);

  const total = useMemo(() => items.reduce((s, i) => s + i.amount, 0), [items]);

  const resetForm = () => {
    setAmount("");
    setNote("");
    setDate(new Date().toISOString().split("T")[0]);
    setError("");
    setPurchaseMode("existing");
    setSelectedProductId("");
    setUnitsPurchased("");
    setNewSection("");
    setNewName("");
    setNewUnitLabel("");
    setNewQtyPerUnit("");
    setNewUnitPrice("");
    setNewMrp("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!date) return setError("Select a date.");

    try {
      if (slug === "purchase-goods") {
        const units = parseFloat(unitsPurchased);
        if (!units || units <= 0)
          return setError("Enter how many units purchased.");

        if (purchaseMode === "existing") {
          if (!selectedProductId) return setError("Select a product.");
          await addPurchaseGoods({
            productId: selectedProductId,
            isNewProduct: false,
            unitsPurchased: units,
            date,
            note: note.trim().slice(0, 200),
          });
        } else {
          const qty = parseFloat(newQtyPerUnit);
          const unitPrice = parseFloat(newUnitPrice);
          const mrp = parseFloat(newMrp);
          if (!newSection) return setError("Select a section.");
          if (!newName.trim()) return setError("Enter product name.");
          if (!newUnitLabel.trim()) return setError("Enter unit label.");
          if (!qty || qty <= 0) return setError("Enter valid qty per unit.");
          if (!unitPrice || unitPrice <= 0)
            return setError("Enter valid purchase price.");
          if (!mrp || mrp <= 0) return setError("Enter valid MRP.");
          await addPurchaseGoods({
            isNewProduct: true,
            productDetails: {
              section: newSection,
              name: newName.trim(),
              unitLabel: newUnitLabel.trim(),
              qtyPerUnit: qty,
              unitPurchasePrice: unitPrice,
              unitsPurchased: units,
              mrpPerQty: mrp,
            },
            unitsPurchased: units,
            date,
            note: note.trim().slice(0, 200),
          });
        }
      } else {
        const numericAmount = parseFloat(amount);
        if (!numericAmount || numericAmount <= 0)
          return setError("Enter a valid amount.");
        await addLedgerEntry({
          type,
          subtype: subtypeName,
          amount: numericAmount,
          date,
          note: note.trim().slice(0, 200),
          productId: null,
        });
      }
      resetForm();
    } catch (err) {
      console.error("Ledger entry submit error:", err);
      setError(
        "Something went wrong saving this entry. Check the console for details.",
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    if (confirmDelete.kind === "sale") {
      await deleteSale(confirmDelete.item.id);
      await restoreStockQty(
        confirmDelete.item.productId,
        confirmDelete.item.qtySold,
      );
    } else {
      await deleteLedgerEntry(confirmDelete.item.id);
    }
    setConfirmDelete(null);
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary font-body p-4 pb-24">
      <div className="flex items-center gap-3 mt-6 mb-1">
        <button
          onClick={() => navigate("/business/jama-kharch")}
          className="text-textSecondary"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-heading font-bold">{label}</h1>
      </div>

      <Card
        className={`mb-4 ${type === "jama" ? "border-success/40" : "border-danger/40"}`}
      >
        <p className="text-textSecondary text-sm mb-1">Total {label}</p>
        <p
          className={`text-2xl font-heading font-bold ${type === "jama" ? "text-success" : "text-danger"}`}
        >
          ₹{total.toFixed(2)}
        </p>
      </Card>

      {slug !== "sale" && (
        <Card className="mb-4">
          <p className="text-sm font-medium mb-3">Add {label} Entry</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {slug === "purchase-goods" ? (
              <>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPurchaseMode("existing")}
                    className={`flex-1 py-2 rounded-control text-sm font-medium border ${purchaseMode === "existing" ? "bg-primary text-background border-primary" : "bg-surface border-white/10"}`}
                  >
                    Restock Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setPurchaseMode("new")}
                    className={`flex-1 py-2 rounded-control text-sm font-medium border ${purchaseMode === "new" ? "bg-primary text-background border-primary" : "bg-surface border-white/10"}`}
                  >
                    New Product
                  </button>
                </div>
                {purchaseMode === "existing" ? (
                  <div className="flex flex-col gap-1.5 relative">
                    <label className="text-xs text-textSecondary font-medium">
                      Product
                    </label>
                    {(() => {
                      const restockableProducts = products.filter(
                        (p) => !p.is_static,
                      );
                      const selectedRestockProduct = restockableProducts.find(
                        (p) => p.id === selectedProductId,
                      );
                      const filteredRestockProducts = restockSearch.trim()
                        ? restockableProducts.filter(
                            (p) =>
                              p.name
                                .toLowerCase()
                                .includes(restockSearch.trim().toLowerCase()) ||
                              p.section
                                .toLowerCase()
                                .includes(restockSearch.trim().toLowerCase()),
                          )
                        : restockableProducts;

                      return (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowRestockList(!showRestockList)}
                            className="bg-surface border border-white/10 rounded-control px-3 py-2.5 text-left text-sm focus:outline-none"
                          >
                            {selectedRestockProduct ? (
                              <span className="text-textPrimary">
                                {selectedRestockProduct.section} —{" "}
                                {selectedRestockProduct.name} (₹
                                {selectedRestockProduct.unit_purchase_price}/
                                {selectedRestockProduct.unit_label})
                              </span>
                            ) : (
                              <span className="text-textSecondary">
                                Select product
                              </span>
                            )}
                          </button>

                          {showRestockList && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-white/10 rounded-control z-20 max-h-72 overflow-y-auto">
                              <div className="relative p-2 border-b border-white/10 sticky top-0 bg-surface">
                                <Search className="w-4 h-4 text-textSecondary absolute left-5 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  autoFocus
                                  value={restockSearch}
                                  onChange={(e) =>
                                    setRestockSearch(e.target.value)
                                  }
                                  placeholder="Search products..."
                                  className="w-full bg-background border border-white/10 rounded-control pl-9 pr-3 py-2 text-textPrimary text-sm focus:outline-none focus:border-primary"
                                />
                              </div>
                              {filteredRestockProducts.length === 0 && (
                                <p className="text-textSecondary text-sm p-3">
                                  No products found.
                                </p>
                              )}
                              {filteredRestockProducts.map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedProductId(p.id);
                                    setShowRestockList(false);
                                    setRestockSearch("");
                                  }}
                                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-white/5 border-b border-white/5 last:border-b-0"
                                >
                                  {p.section} — {p.name} (₹
                                  {p.unit_purchase_price}/{p.unit_label})
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-textSecondary font-medium">
                        Product Type
                      </label>
                      {!addingNewType ? (
                        <>
                          <select
                            value={newSection}
                            onChange={(e) => setNewSection(e.target.value)}
                            className="bg-surface border border-white/10 rounded-control px-3 py-2.5 text-textPrimary text-sm focus:outline-none focus:border-primary"
                          >
                            <option value="">Select product type</option>
                            {productTypes.map((t) => (
                              <option key={t.id} value={t.name}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setAddingNewType(true)}
                            className="text-primary text-xs font-medium text-left mt-1"
                          >
                            + Add new product type
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            value={newTypeName}
                            onChange={(e) => setNewTypeName(e.target.value)}
                            placeholder="e.g. Snacks, Cold Drinks"
                            className="bg-surface border border-white/10 rounded-control px-3 py-2.5 text-textPrimary text-sm focus:outline-none focus:border-primary"
                          />
                          {newTypeError && (
                            <p className="text-danger text-xs">
                              {newTypeError}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                setNewTypeError("");
                                const { error } =
                                  await addProductType(newTypeName);
                                if (error) {
                                  setNewTypeError(error.message);
                                } else {
                                  setNewSection(newTypeName.trim());
                                  setNewTypeName("");
                                  setAddingNewType(false);
                                }
                              }}
                              className="flex-1 bg-primary text-background rounded-control py-2 text-sm font-medium"
                            >
                              Save Type
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAddingNewType(false);
                                setNewTypeName("");
                                setNewTypeError("");
                              }}
                              className="flex-1 bg-surface border border-white/10 rounded-control py-2 text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <Input
                      label="Product Name"
                      name="newName"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Gold Flake"
                    />
                    <Input
                      label="Unit Label"
                      name="newUnitLabel"
                      value={newUnitLabel}
                      onChange={(e) => setNewUnitLabel(e.target.value)}
                      placeholder="e.g. Pack"
                    />
                    <Input
                      label="Qty per Unit"
                      name="newQtyPerUnit"
                      type="number"
                      value={newQtyPerUnit}
                      onChange={(e) => setNewQtyPerUnit(e.target.value)}
                      placeholder="e.g. 10"
                    />
                    <Input
                      label="Purchase Price per Unit (₹)"
                      name="newUnitPrice"
                      type="number"
                      value={newUnitPrice}
                      onChange={(e) => setNewUnitPrice(e.target.value)}
                      placeholder="e.g. 244"
                    />
                    <Input
                      label="MRP per Piece (₹)"
                      name="newMrp"
                      type="number"
                      value={newMrp}
                      onChange={(e) => setNewMrp(e.target.value)}
                      placeholder="e.g. 30"
                    />
                  </>
                )}
                <Input
                  label="Units Purchased"
                  name="unitsPurchased"
                  type="number"
                  value={unitsPurchased}
                  onChange={(e) => setUnitsPurchased(e.target.value)}
                  placeholder="e.g. 5"
                />
              </>
            ) : (
              <Input
                label="Amount (₹)"
                name="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 2000"
              />
            )}
            <Input
              label="Date"
              name="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Input
              label="Note (optional)"
              name="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any detail"
            />
            {error && <p className="text-danger text-sm">{error}</p>}
            <Button
              type="submit"
              variant={type === "jama" ? "primary" : "danger"}
              className="flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Save Entry
            </Button>
          </form>
        </Card>
      )}

      {allItems.length > 3 && (
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-textSecondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${label.toLowerCase()} entries...`}
            className="w-full bg-surface border border-white/10 rounded-control pl-9 pr-3 py-2.5 text-textPrimary text-sm focus:outline-none focus:border-primary"
          />
        </div>
      )}
      <p className="text-sm font-medium text-textSecondary mb-2">
        {label} Entries
      </p>
      {items.length === 0 && (
        <p className="text-textSecondary text-sm">No entries yet.</p>
      )}

      {slug === "sale" ? (
        <div className="flex flex-col gap-4">
          {saleDateGroups.map((group) => {
            const dayTotal = group.blocks.reduce((sum, b) => sum + b.total, 0);
            return (
              <div key={group.date}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-medium text-textSecondary">
                    {formatDate(group.date)}
                  </p>
                  <p className="text-xs font-bold text-success">
                    ₹{dayTotal.toFixed(2)}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {group.blocks.map((block) => (
                    <Card key={block.key}>
                      <button
                        onClick={() =>
                          setViewingDetail({ kind: "sale-block", block })
                        }
                        className="text-left w-full"
                      >
                        {block.items.map((item) => (
                          <p
                            key={item.id}
                            className="text-sm text-textSecondary"
                          >
                            {item.note}
                          </p>
                        ))}
                      </button>
                      <div className="flex justify-end items-center gap-3 mt-1">
                        <p className="font-heading font-bold text-success">
                          +₹{block.total.toFixed(2)}
                        </p>
                        {confirmDelete &&
                        confirmDelete.blockKey === block.key ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={async () => {
                                for (const item of block.items) {
                                  await deleteSale(item.raw.id);
                                  await restoreStockQty(
                                    item.raw.productId,
                                    item.raw.qtySold,
                                  );
                                }
                                setConfirmDelete(null);
                              }}
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
                          <button
                            onClick={() =>
                              setConfirmDelete({ blockKey: block.key })
                            }
                            className="text-textSecondary hover:text-danger"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <Card key={`${item.kind}-${item.id}`}>
              <button
                onClick={() => setViewingDetail(item)}
                className="text-left w-full"
              >
                <p className="text-sm text-textSecondary">{item.note}</p>
                <p className="text-xs text-textSecondary/70 mt-0.5">
                  {formatDate(item.date)}
                  {item.time ? ` · ${item.time}` : ""}
                </p>
              </button>
              <div className="flex justify-end items-center gap-3 mt-1">
                <p
                  className={`font-heading font-bold ${type === "jama" ? "text-success" : "text-danger"}`}
                >
                  {type === "jama" ? "+" : "−"}₹{item.amount.toFixed(2)}
                </p>
                {confirmDelete &&
                confirmDelete.item.id === item.id &&
                confirmDelete.kind === item.kind ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleConfirmDelete}
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
                  <button
                    onClick={() =>
                      setConfirmDelete({ kind: item.kind, item: item.raw })
                    }
                    className="text-textSecondary hover:text-danger"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {viewingDetail && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]"
          onClick={() => {
            setViewingDetail(null);
            setEditingItem(null);
          }}
        >
          <Card
            className="w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <p className="font-heading font-bold text-lg">
                {editingItem ? "Edit Entry" : "Entry Details"}
              </p>
              <button
                onClick={() => {
                  setViewingDetail(null);
                  setEditingItem(null);
                }}
                className="text-textSecondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {viewingDetail?.kind === "sale-block" ? (
              <div className="flex flex-col gap-3">
                <DetailRow
                  label="Date"
                  value={formatDate(viewingDetail.block.date)}
                />
                {viewingDetail.block.items.map((item) => (
                  <Card key={item.id} className="!p-2.5">
                    {editingSaleId === item.raw.id ? (
                      <div className="flex flex-col gap-2">
                        <Input
                          label="Quantity"
                          name="editSaleQty"
                          type="number"
                          value={editSaleQty}
                          onChange={(e) => setEditSaleQty(e.target.value)}
                        />
                        <Input
                          label="Date"
                          name="editSaleDate"
                          type="date"
                          value={editSaleDate}
                          onChange={(e) => setEditSaleDate(e.target.value)}
                        />
                        {editError && (
                          <p className="text-danger text-xs">{editError}</p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            onClick={async () => {
                              setEditError("");
                              const newQty = parseFloat(editSaleQty);
                              if (!newQty || newQty <= 0)
                                return setEditError("Enter a valid quantity.");
                              if (!editSaleDate)
                                return setEditError("Select a date.");
                              try {
                                await updateSale(
                                  item.raw,
                                  newQty,
                                  editSaleDate,
                                );
                                setEditingSaleId(null);
                                setViewingDetail(null);
                              } catch (err) {
                                setEditError(
                                  err.message || "Failed to update sale.",
                                );
                              }
                            }}
                            className="flex-1"
                          >
                            Save
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => setEditingSaleId(null)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">
                            {item.raw.productName} × {item.raw.qtySold}
                          </p>
                          <p className="text-xs text-textSecondary">
                            ₹{item.raw.total.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {viewingDetail.block.items.length === 1 && (
                            <button
                              onClick={() => {
                                setEditingSaleId(item.raw.id);
                                setEditSaleQty(item.raw.qtySold.toString());
                                setEditSaleDate(item.raw.date);
                                setEditError("");
                              }}
                              className="text-textSecondary hover:text-primary"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {confirmDelete &&
                          confirmDelete.saleItemId === item.raw.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={async () => {
                                  await deleteSale(item.raw.id);
                                  await restoreStockQty(
                                    item.raw.productId,
                                    item.raw.qtySold,
                                  );
                                  setConfirmDelete(null);
                                  setViewingDetail(null);
                                }}
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
                            <button
                              onClick={() =>
                                setConfirmDelete({ saleItemId: item.raw.id })
                              }
                              className="text-textSecondary hover:text-danger"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
                {viewingDetail.block.items.length > 1 && (
                  <p className="text-[10px] text-textSecondary/70">
                    Multi-item sales can't be edited here — delete and re-enter
                    if needed.
                  </p>
                )}
              </div>
            ) : editingItem ? (
              <div className="flex flex-col gap-3">
                {slug === "purchase-goods" ? (
                  <Input
                    label="Units Purchased"
                    name="editUnits"
                    type="number"
                    value={editUnits}
                    onChange={(e) => setEditUnits(e.target.value)}
                  />
                ) : (
                  <Input
                    label="Amount (₹)"
                    name="editAmount"
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                  />
                )}
                <Input
                  label="Date"
                  name="editDate"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
                <Input
                  label="Note"
                  name="editNote"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Any detail"
                />
                {editError && (
                  <p className="text-danger text-sm">{editError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    onClick={async () => {
                      setEditError("");
                      try {
                        if (!editDate) return setEditError("Select a date.");

                        if (slug === "purchase-goods") {
                          const newUnits = parseFloat(editUnits);
                          if (!newUnits || newUnits <= 0)
                            return setEditError("Enter valid units purchased.");

                          const raw = viewingDetail.raw;
                          // Parse the original units purchased back out of the auto-generated note description
                          // (we don't store it separately, so we infer it from the amount / product's unit price)
                          const product = products.find(
                            (p) => p.id === raw.productId,
                          );
                          if (!product)
                            return setEditError(
                              "Linked product not found — cannot edit safely.",
                            );
                          const oldUnits =
                            raw.amount / product.unit_purchase_price;

                          await updatePurchaseGoods(raw.id, {
                            productId: raw.productId,
                            oldUnitsPurchased: oldUnits,
                            newUnitsPurchased: newUnits,
                            date: editDate,
                            note: editNote,
                          });
                        } else {
                          const numericAmount = parseFloat(editAmount);
                          if (!numericAmount || numericAmount <= 0)
                            return setEditError("Enter a valid amount.");
                          await updateLedgerEntry(viewingDetail.raw.id, {
                            amount: numericAmount,
                            date: editDate,
                            note: editNote,
                          });
                        }

                        setViewingDetail(null);
                        setEditingItem(null);
                      } catch (err) {
                        setEditError(err.message || "Failed to save changes.");
                      }
                    }}
                    className="flex-1"
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setEditingItem(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <DetailRow label="Type" value={label} />
                <DetailRow
                  label="Amount"
                  value={`₹${viewingDetail.amount.toFixed(2)}`}
                />
                <DetailRow
                  label="Date"
                  value={formatDate(viewingDetail.date)}
                />
                {viewingDetail.time && (
                  <DetailRow label="Time" value={viewingDetail.time} />
                )}
                <DetailRow label="Note" value={viewingDetail.note || "—"} />

                {viewingDetail.kind === "ledger" && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingItem(viewingDetail);
                      setEditAmount(viewingDetail.amount.toString());
                      setEditDate(viewingDetail.date);
                      setEditNote("");
                      if (slug === "purchase-goods") {
                        const product = products.find(
                          (p) => p.id === viewingDetail.raw.productId,
                        );
                        if (product) {
                          setEditUnits(
                            (
                              viewingDetail.amount / product.unit_purchase_price
                            ).toFixed(0),
                          );
                        }
                      }
                    }}
                    className="flex items-center justify-center gap-1.5"
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-center border-b border-white/5 pb-2">
      <p className="text-xs text-textSecondary">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

export default LedgerCategory;
