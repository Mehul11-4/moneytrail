import { useState, useMemo } from "react";
import { ShoppingCart, Search, Trash2 } from "lucide-react";
import Card from "../../components/Card";
import { usePurchases } from "../../hooks/usePurchases";
import { formatDate } from "../../utils/formatDate";

function PurchaseList() {
  const { purchases, loading, deletePurchase } = usePurchases();
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const grouped = useMemo(() => {
    const map = {};
    const order = [];
    purchases.forEach((p) => {
      const key = p.transactionId || p.id;
      if (!map[key]) {
        map[key] = {
          key,
          items: [],
          total: 0,
          paymentMode: p.paymentMode,
          partyName: p.partyName,
          date: p.date,
          time: p.time,
        };
        order.push(key);
      }
      map[key].items.push(p);
      map[key].total += p.total;
    });
    return order.map((k) => map[k]);
  }, [purchases]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return grouped;
    const q = searchQuery.trim().toLowerCase();
    return grouped.filter(
      (g) =>
        (g.partyName || "").toLowerCase().includes(q) ||
        g.items.some((i) => i.productName.toLowerCase().includes(q)),
    );
  }, [grouped, searchQuery]);

  const totalPurchase = useMemo(
    () => purchases.reduce((sum, p) => sum + p.total, 0),
    [purchases],
  );
  const balanceDue = useMemo(
    () =>
      purchases
        .filter((p) => p.paymentMode === "Credit")
        .reduce((sum, p) => sum + p.total, 0),
    [purchases],
  );

  const handleDeleteBlock = async (block) => {
    for (const item of block.items) await deletePurchase(item);
    setConfirmDelete(null);
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary font-body p-4 pb-24">
      <div className="flex items-center gap-3 mt-6 mb-4">
        <ShoppingCart className="w-7 h-7 text-danger" />
        <h1 className="text-2xl font-heading font-bold">Purchase List</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card>
          <p className="text-textSecondary text-xs mb-1">Total Purchase</p>
          <p className="text-xl font-heading font-bold">
            ₹{totalPurchase.toFixed(2)}
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
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-textSecondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by party or item..."
            className="w-full bg-surface border border-white/10 rounded-control pl-9 pr-3 py-2.5 text-sm"
          />
        </div>
      )}

      {loading && <p className="text-textSecondary text-sm">Loading...</p>}
      {!loading && filtered.length === 0 && (
        <p className="text-textSecondary text-sm">No purchases recorded yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((block) => (
          <Card key={block.key}>
            <div className="flex justify-between items-start mb-2">
              <div>
                {block.partyName && (
                  <p className="text-sm font-medium">{block.partyName}</p>
                )}
                <p className="text-xs text-textSecondary">
                  {formatDate(block.date)} · {block.time} · {block.paymentMode}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-heading font-bold text-danger">
                  ₹{block.total.toFixed(2)}
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
                  <button
                    onClick={() => setConfirmDelete(block.key)}
                    className="text-textSecondary hover:text-danger"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="rounded-control border border-white/10 overflow-hidden">
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
                  <div className="col-span-5 truncate">{item.productName}</div>
                  <div className="col-span-2 text-right">{item.qty}</div>
                  <div className="col-span-2 text-right">
                    ₹{item.rate.toFixed(2)}
                  </div>
                  <div className="col-span-3 text-right font-medium">
                    ₹{item.total.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default PurchaseList;
