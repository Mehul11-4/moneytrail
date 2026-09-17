import { useState, useMemo } from "react";
import { Users, Search, X, Phone } from "lucide-react";
import Card from "../../components/Card";
import { useSales } from "../../hooks/useSales";
import { formatDate } from "../../utils/formatDate";

function UdhaarGiven() {
  const { sales, loading, recordPayment } = useSales();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payError, setPayError] = useState("");

  // Always derive the LIVE version of whichever customer is open, so the
  // modal reflects payments immediately instead of showing a stale snapshot.
  const viewingCustomerLive = viewingCustomer
    ? grouped.find((g) => g.name === viewingCustomer.name) || null
    : null;

  const udhaarSales = useMemo(
    () => sales.filter((s) => s.paymentMode === "Udhaar"),
    [sales],
  );

  const grouped = useMemo(() => {
    const map = {};
    udhaarSales.forEach((s) => {
      const key = s.customerName || "Unknown";
      if (!map[key])
        map[key] = { name: key, phone: s.customerPhone, sales: [] };
      map[key].sales.push(s);
    });
    return Object.values(map)
      .map((g) => ({
        ...g,
        totalOwed: g.sales.reduce(
          (sum, s) => sum + Math.max(0, s.total - (s.receivedAmount || 0)),
          0,
        ),
      }))
      .filter((g) => g.totalOwed > 0); // fully-paid-off customers drop out of this list automatically
  }, [udhaarSales]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return grouped;
    const q = searchQuery.trim().toLowerCase();
    return grouped.filter((g) => g.name.toLowerCase().includes(q));
  }, [grouped, searchQuery]);

  const totalAllOwed = useMemo(
    () => grouped.reduce((s, g) => s + g.totalOwed, 0),
    [grouped],
  );

  const handleRecordPayment = async (sale) => {
    setPayError("");
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return setPayError("Enter a valid amount.");
    const balanceDue = sale.total - (sale.receivedAmount || 0);
    if (amount > balanceDue)
      return setPayError(
        `Cannot exceed balance due of ₹${balanceDue.toFixed(2)}.`,
      );

    try {
      await recordPayment(sale.id, amount);
      setPayingId(null);
      setPayAmount("");
    } catch (err) {
      setPayError(err.message || "Failed to record payment.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary font-body p-4 pb-24">
      <div className="flex items-center gap-3 mt-6 mb-1">
        <Users className="w-7 h-7 text-parties" />
        <h1 className="text-2xl font-heading font-bold">Parties</h1>
      </div>
      <p className="text-xs text-textSecondary mb-4">Money customers owe you</p>

      <Card className="mb-4 border-parties/40">
        <p className="text-textSecondary text-sm mb-1">
          Total Owed (All Customers)
        </p>
        <p className="text-2xl font-heading font-bold text-parties">
          ₹{totalAllOwed.toFixed(2)}
        </p>
      </Card>

      {grouped.length > 3 && (
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-textSecondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer name..."
            className="w-full bg-surface border border-white/10 rounded-control pl-9 pr-3 py-2.5 text-textPrimary text-sm focus:outline-none focus:border-primary"
          />
        </div>
      )}

      {loading && <p className="text-textSecondary text-sm">Loading...</p>}
      {!loading && filteredGroups.length === 0 && (
        <p className="text-textSecondary text-sm">
          No pending Udhaar right now.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {filteredGroups.map((group) => (
          <button
            key={group.name}
            onClick={() => setViewingCustomer(group)}
            className="text-left"
          >
            <Card>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{group.name}</p>
                  {group.phone && (
                    <p className="text-xs text-textSecondary flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {group.phone}
                    </p>
                  )}
                </div>
                <p className="font-heading font-bold text-parties">
                  ₹{group.totalOwed.toFixed(2)}
                </p>
              </div>
              <p className="text-xs text-textSecondary mt-1">
                {group.sales.length} purchase
                {group.sales.length !== 1 ? "s" : ""}
              </p>
            </Card>
          </button>
        ))}
      </div>

      {viewingCustomerLive && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]"
          onClick={() => {
            setViewingCustomer(null);
            setPayingId(null);
          }}
        >
          <Card
            className="w-full max-w-sm max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="font-heading font-bold text-lg">
                  {viewingCustomerLive.name}
                </p>
                {viewingCustomerLive.phone && (
                  <p className="text-xs text-textSecondary flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> {viewingCustomerLive.phone}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setViewingCustomer(null);
                  setPayingId(null);
                }}
                className="text-textSecondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <Card className="mb-3 border-parties/30">
              <p className="text-xs text-textSecondary">Total Owed</p>
              <p className="text-xl font-heading font-bold text-parties">
                ₹{viewingCustomerLive.totalOwed.toFixed(2)}
              </p>
            </Card>

            <p className="text-xs font-medium text-textSecondary mb-2">
              Purchase History
            </p>
            <div className="flex flex-col gap-2">
              {viewingCustomerLive.sales.map((s) => {
                const balanceDue = Math.max(
                  0,
                  s.total - (s.receivedAmount || 0),
                );
                const isPaid = balanceDue <= 0;
                return (
                  <Card key={s.id} className="!p-2.5">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <p className="text-sm font-medium">
                          {s.productName} × {s.qtySold}
                        </p>
                        <p className="text-xs text-textSecondary">
                          {formatDate(s.date)} · {s.time}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-heading font-bold text-sm">
                          ₹{s.total.toFixed(2)}
                        </p>
                        {isPaid ? (
                          <p className="text-[10px] text-success font-medium">
                            Paid
                          </p>
                        ) : (
                          <p className="text-[10px] text-danger font-medium">
                            Due ₹{balanceDue.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>

                    {!isPaid &&
                      (payingId === s.id ? (
                        <div className="flex flex-col gap-1.5 mt-1.5">
                          <div className="flex gap-1.5">
                            <input
                              type="number"
                              autoFocus
                              value={payAmount}
                              onChange={(e) => setPayAmount(e.target.value)}
                              placeholder={`up to ₹${balanceDue.toFixed(2)}`}
                              className="flex-1 bg-background border border-white/10 rounded-control px-2 py-1.5 text-xs"
                            />
                            <button
                              onClick={() => handleRecordPayment(s)}
                              className="bg-primary text-background text-xs font-medium px-3 rounded-control"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setPayingId(null);
                                setPayAmount("");
                                setPayError("");
                              }}
                              className="text-textSecondary text-xs px-2"
                            >
                              Cancel
                            </button>
                          </div>
                          {payError && (
                            <p className="text-danger text-[10px]">
                              {payError}
                            </p>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setPayingId(s.id);
                            setPayAmount("");
                            setPayError("");
                          }}
                          className="text-primary text-xs font-medium mt-1"
                        >
                          + Record Payment
                        </button>
                      ))}
                  </Card>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
export default UdhaarGiven;
