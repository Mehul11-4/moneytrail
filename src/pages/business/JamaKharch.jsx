import { useState, useMemo } from "react";
import { BookText, TrendingUp, TrendingDown, Plus, Trash2 } from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { useSales } from "../../hooks/useSales";
import { useLedger } from "../../hooks/useLedger";
import { useProducts } from "../../hooks/useProducts";
import { PRODUCT_SECTIONS } from "../../utils/productSections";

const jamaSubtypes = [
  "Capital",
  "Loan Taken",
  "Borrowed (Friends/Family)",
  "Other",
];
const kharchSubtypes = [
  "Purchase Goods",
  "Loan Interest",
  "Rent",
  "Electricity",
  "Water Bill",
  "Other",
];

function JamaKharch() {
  const { sales, deleteSale } = useSales();
  const {
    entries,
    loading,
    addLedgerEntry,
    addPurchaseGoods,
    deleteLedgerEntry,
  } = useLedger();
  const { products, restoreStockQty } = useProducts();

  const [formType, setFormType] = useState(null);
  const [subtype, setSubtype] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const [purchaseMode, setPurchaseMode] = useState("existing");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [unitsPurchased, setUnitsPurchased] = useState("");
  const [newSection, setNewSection] = useState("");
  const [newName, setNewName] = useState("");
  const [newUnitLabel, setNewUnitLabel] = useState("");
  const [newQtyPerUnit, setNewQtyPerUnit] = useState("");
  const [newUnitPrice, setNewUnitPrice] = useState("");
  const [newMrp, setNewMrp] = useState("");

  const [confirmDelete, setConfirmDelete] = useState(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const totalJamaAllTime = useMemo(() => {
    const ledgerJama = entries
      .filter((e) => e.type === "jama")
      .reduce((s, e) => s + e.amount, 0);
    const salesJama = sales.reduce((s, sale) => s + sale.total, 0);
    return ledgerJama + salesJama;
  }, [entries, sales]);

  const totalKharchAllTime = useMemo(
    () =>
      entries
        .filter((e) => e.type === "kharch")
        .reduce((s, e) => s + e.amount, 0),
    [entries],
  );

  const todayJama = useMemo(() => {
    const ledgerToday = entries
      .filter((e) => e.type === "jama" && e.date === todayStr)
      .reduce((s, e) => s + e.amount, 0);
    const salesToday = sales
      .filter((s) => s.date === todayStr)
      .reduce((s, sale) => s + sale.total, 0);
    return ledgerToday + salesToday;
  }, [entries, sales, todayStr]);

  const todayKharch = useMemo(
    () =>
      entries
        .filter((e) => e.type === "kharch" && e.date === todayStr)
        .reduce((s, e) => s + e.amount, 0),
    [entries, todayStr],
  );

  const openingBalance =
    totalJamaAllTime - totalKharchAllTime - (todayJama - todayKharch);
  const closingBalance = openingBalance + todayJama - todayKharch;

  const combinedFeed = useMemo(() => {
    const salesAsFeed = sales.map((s) => ({
      kind: "sale",
      id: s.id,
      type: "jama",
      subtype: "Sale",
      amount: s.total,
      date: s.date,
      time: s.time,
      note: `${s.productName} × ${s.qtySold}${s.customerName ? ` — ${s.customerName}` : ""}`,
      createdAt: s.createdAt,
      raw: s,
    }));
    const ledgerAsFeed = entries.map((e) => ({
      kind: "ledger",
      id: e.id,
      type: e.type,
      subtype: e.subtype,
      amount: e.amount,
      date: e.date,
      time: null,
      note: e.note,
      createdAt: e.createdAt,
      raw: e,
    }));
    return [...salesAsFeed, ...ledgerAsFeed].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  }, [sales, entries]);

  const resetForm = () => {
    setFormType(null);
    setSubtype("");
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

  const openForm = (type) => {
    resetForm();
    setFormType(type);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!subtype) return setError("Select a type.");
    if (!date) return setError("Select a date.");

    if (subtype === "Purchase Goods") {
      const units = parseFloat(unitsPurchased);
      if (!units || units <= 0)
        return setError("Enter how many units purchased.");

      if (purchaseMode === "existing") {
        if (!selectedProductId) return setError("Select a product.");
        await addPurchaseGoods({
          productId: parseInt(selectedProductId),
          isNewProduct: false,
          unitsPurchased: units,
          date,
          note: note.trim().slice(0, 200),
        });
      } else {
        const qty = parseFloat(newQtyPerUnit);
        const unitPrice = parseFloat(newUnitPrice);
        const mrp = parseFloat(newMrp);
        if (!newSection)
          return setError("Select a section (e.g. Cigarette, Gutka).");
        if (!newName.trim()) return setError("Enter product name.");
        if (!newUnitLabel.trim()) return setError("Enter unit label.");
        if (!qty || qty <= 0) return setError("Enter valid qty per unit.");
        if (!unitPrice || unitPrice <= 0)
          return setError("Enter valid purchase price per unit.");
        if (!mrp || mrp <= 0) return setError("Enter valid MRP per piece.");

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
        type: formType,
        subtype,
        amount: numericAmount,
        date,
        note: note.trim().slice(0, 200),
        productId: null,
      });
    }

    resetForm();
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
        <BookText className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-heading font-bold">Jama-Kharch</h1>
      </div>
      <p className="text-xs text-textSecondary mb-4">Business cash book</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="border-white/10">
          <p className="text-textSecondary text-xs mb-1">Opening Balance</p>
          <p className="text-xl font-heading font-bold">
            ₹{openingBalance.toFixed(2)}
          </p>
        </Card>
        <Card
          className={
            closingBalance >= 0 ? "border-success/40" : "border-danger/40"
          }
        >
          <p className="text-textSecondary text-xs mb-1">Closing Balance</p>
          <p
            className={`text-xl font-heading font-bold ${closingBalance >= 0 ? "text-success" : "text-danger"}`}
          >
            ₹{closingBalance.toFixed(2)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-success" />
          <div>
            <p className="text-textSecondary text-xs">Today's Jama</p>
            <p className="font-heading font-bold text-success">
              ₹{todayJama.toFixed(2)}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-danger" />
          <div>
            <p className="text-textSecondary text-xs">Today's Kharch</p>
            <p className="font-heading font-bold text-danger">
              ₹{todayKharch.toFixed(2)}
            </p>
          </div>
        </Card>
      </div>

      <div className="flex gap-2 mb-4">
        <Button
          variant={formType === "jama" ? "primary" : "secondary"}
          onClick={() => openForm("jama")}
          className="flex-1 flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Jama
        </Button>
        <Button
          variant={formType === "kharch" ? "danger" : "secondary"}
          onClick={() => openForm("kharch")}
          className="flex-1 flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Kharch
        </Button>
      </div>

      {formType && (
        <Card className="mb-4">
          <p className="text-sm font-medium mb-3">
            New {formType === "jama" ? "Jama" : "Kharch"} Entry
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-textSecondary font-medium">
                Type
              </label>
              <select
                value={subtype}
                onChange={(e) => setSubtype(e.target.value)}
                className="bg-surface border border-white/10 rounded-control px-3 py-2.5 text-textPrimary text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Select type</option>
                {(formType === "jama" ? jamaSubtypes : kharchSubtypes).map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ),
                )}
              </select>
            </div>

            {subtype === "Purchase Goods" ? (
              <>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPurchaseMode("existing")}
                    className={`flex-1 py-2 rounded-control text-xs font-medium border ${purchaseMode === "existing" ? "bg-primary text-background border-primary" : "bg-surface border-white/10"}`}
                  >
                    Restock Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setPurchaseMode("new")}
                    className={`flex-1 py-2 rounded-control text-xs font-medium border ${purchaseMode === "new" ? "bg-primary text-background border-primary" : "bg-surface border-white/10"}`}
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
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.section} — {p.name} (₹{p.unitPurchasePrice}/
                          {p.unitLabel})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-textSecondary font-medium">
                        Section
                      </label>
                      <select
                        value={newSection}
                        onChange={(e) => setNewSection(e.target.value)}
                        className="bg-surface border border-white/10 rounded-control px-3 py-2.5 text-textPrimary text-sm focus:outline-none focus:border-primary"
                      >
                        <option value="">Select section</option>
                        {PRODUCT_SECTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Input
                      label="Product Name (subsection)"
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
                  label={`Units Purchased${purchaseMode === "existing" ? "" : " (first stock)"}`}
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

            <div className="flex gap-2">
              <Button
                type="submit"
                variant={formType === "jama" ? "primary" : "danger"}
                className="flex-1"
              >
                Save Entry
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={resetForm}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <p className="text-sm font-medium text-textSecondary mb-2">All Entries</p>
      {loading && <p className="text-textSecondary text-sm">Loading...</p>}
      {!loading && combinedFeed.length === 0 && (
        <p className="text-textSecondary text-sm">No entries yet.</p>
      )}

      <div className="flex flex-col gap-2">
        {combinedFeed.map((item) => (
          <Card key={`${item.kind}-${item.id}`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${item.type === "jama" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}
                  >
                    {item.type === "jama" ? "Jama" : "Kharch"} · {item.subtype}
                  </span>
                </div>
                <p className="text-xs text-textSecondary">{item.note}</p>
                <p className="text-[10px] text-textSecondary/70 mt-0.5">
                  {item.date}
                  {item.time ? ` · ${item.time}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p
                  className={`font-heading font-bold ${item.type === "jama" ? "text-success" : "text-danger"}`}
                >
                  {item.type === "jama" ? "+" : "−"} ₹{item.amount.toFixed(2)}
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
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default JamaKharch;
