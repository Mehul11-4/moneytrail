import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Plus, X, Search } from "lucide-react";
import { formatDate } from "../../utils/formatDate";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { useSales } from "../../hooks/useSales";
import { useLedger } from "../../hooks/useLedger";
import { useProducts } from "../../hooks/useProducts";
import { useProductTypes } from "../../hooks/useProductTypes";
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

  const { sales, deleteSale } = useSales();
  const { entries, addLedgerEntry, addPurchaseGoods, deleteLedgerEntry } =
    useLedger();
  const { products, restoreStockQty } = useProducts();
  const { productTypes, addProductType } = useProductTypes();
  const [addingNewType, setAddingNewType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeError, setNewTypeError] = useState("");

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewingDetail, setViewingDetail] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Purchase Goods specific
  const [purchaseMode, setPurchaseMode] = useState("existing");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [unitsPurchased, setUnitsPurchased] = useState("");
  const [newSection, setNewSection] = useState("");
  const [newName, setNewName] = useState("");
  const [newUnitLabel, setNewUnitLabel] = useState("");
  const [newQtyPerUnit, setNewQtyPerUnit] = useState("");
  const [newUnitPrice, setNewUnitPrice] = useState("");
  const [newMrp, setNewMrp] = useState("");
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
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-textSecondary font-medium">
                      Product
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="bg-surface border border-white/10 rounded-control px-3 py-2.5 text-textPrimary text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="">Select product</option>
                      {products
                        .filter((p) => !p.is_static)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.section} — {p.name} (₹{p.unit_purchase_price}/
                            {p.unit_label})
                          </option>
                        ))}
                    </select>
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

      {/* Detail modal */}
      {viewingDetail && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]"
          onClick={() => setViewingDetail(null)}
        >
          <Card
            className="w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <p className="font-heading font-bold text-lg">Entry Details</p>
              <button
                onClick={() => setViewingDetail(null)}
                className="text-textSecondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <DetailRow label="Type" value={label} />
              <DetailRow
                label="Amount"
                value={`₹${viewingDetail.amount.toFixed(2)}`}
              />
              <DetailRow label="Date" value={formatDate(viewingDetail.date)} />
              {viewingDetail.time && (
                <DetailRow label="Time" value={viewingDetail.time} />
              )}
              <DetailRow label="Note" value={viewingDetail.note || "—"} />
            </div>
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
