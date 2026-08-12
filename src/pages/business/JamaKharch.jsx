import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BookText } from "lucide-react";
import Card from "../../components/Card";
import { useSales } from "../../hooks/useSales";
import { useLedger } from "../../hooks/useLedger";

const CATEGORY_BUTTONS = [
  { slug: "sale", label: "Sale", type: "jama" },
  { slug: "capital", label: "Capital", type: "jama" },
  { slug: "loan-taken", label: "Loan Taken", type: "jama" },
  { slug: "borrowed", label: "Borrowed", type: "jama" },
  { slug: "other-jama", label: "Other", type: "jama" },
  { slug: "purchase-goods", label: "Purchase Goods", type: "kharch" },
  { slug: "loan-interest", label: "Loan Interest", type: "kharch" },
  { slug: "rent", label: "Rent", type: "kharch" },
  { slug: "electricity", label: "Electricity", type: "kharch" },
  { slug: "water-bill", label: "Water Bill", type: "kharch" },
  { slug: "other-kharch", label: "Other", type: "kharch" },
];

function JamaKharch() {
  const navigate = useNavigate();
  const { sales } = useSales();
  const { entries } = useLedger();

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

  const totalBalance = totalJamaAllTime - totalKharchAllTime;

  const balanceHistory = useMemo(() => {
    const byDate = {};
    sales.forEach((s) => {
      byDate[s.date] = byDate[s.date] || { jama: 0, kharch: 0 };
      byDate[s.date].jama += s.total;
    });
    entries.forEach((e) => {
      byDate[e.date] = byDate[e.date] || { jama: 0, kharch: 0 };
      if (e.type === "jama") byDate[e.date].jama += e.amount;
      else byDate[e.date].kharch += e.amount;
    });
    const sortedDates = Object.keys(byDate).sort();
    let running = 0;
    return sortedDates
      .map((date) => {
        running += byDate[date].jama - byDate[date].kharch;
        return {
          date,
          jama: byDate[date].jama,
          kharch: byDate[date].kharch,
          closingBalance: running,
        };
      })
      .reverse();
  }, [sales, entries]);

  const totalFor = (slug, type, subtypeName) => {
    if (slug === "sale") return sales.reduce((s, sale) => s + sale.total, 0);
    return entries
      .filter((e) => e.type === type && e.subtype === subtypeName)
      .reduce((s, e) => s + e.amount, 0);
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary font-body p-4 pb-24">
      <div className="flex items-center gap-3 mt-6 mb-1">
        <BookText className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-heading font-bold">Jama-Kharch</h1>
      </div>
      <p className="text-xs text-textSecondary mb-4">Business cash book</p>

      <Card
        className={`mb-4 ${totalBalance >= 0 ? "border-success/40" : "border-danger/40"}`}
      >
        <p className="text-textSecondary text-sm mb-1">Total Balance</p>
        <p
          className={`text-3xl font-heading font-bold ${totalBalance >= 0 ? "text-success" : "text-danger"}`}
        >
          ₹{totalBalance.toFixed(2)}
        </p>
      </Card>

      <p className="text-sm font-medium text-textSecondary mb-2">Categories</p>
      <div className="grid grid-cols-2 gap-3 mb-5 items-start">
        {/* JAMA column */}
        <div className="flex flex-col gap-3">
          {CATEGORY_BUTTONS.filter((c) => c.type === "jama").map((cat) => {
            const subtypeName = cat.slug === "other-jama" ? "Other" : cat.label;
            const total = totalFor(cat.slug, cat.type, subtypeName);
            return (
              <button
                key={cat.slug}
                onClick={() => navigate(`/business/jama-kharch/${cat.slug}`)}
                className="text-left p-3 rounded-card border transition-colors bg-success/10 border-success/20"
              >
                <p className="text-xs font-medium text-textSecondary">
                  {cat.label}
                </p>
                <p className="font-heading font-bold text-success">
                  ₹{total.toFixed(2)}
                </p>
              </button>
            );
          })}
        </div>

        {/* KHARCH column */}
        <div className="flex flex-col gap-3">
          {CATEGORY_BUTTONS.filter((c) => c.type === "kharch").map((cat) => {
            const subtypeName =
              cat.slug === "other-kharch" ? "Other" : cat.label;
            const total = totalFor(cat.slug, cat.type, subtypeName);
            return (
              <button
                key={cat.slug}
                onClick={() => navigate(`/business/jama-kharch/${cat.slug}`)}
                className="text-left p-3 rounded-card border transition-colors bg-danger/10 border-danger/20"
              >
                <p className="text-xs font-medium text-textSecondary">
                  {cat.label}
                </p>
                <p className="font-heading font-bold text-danger">
                  ₹{total.toFixed(2)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {balanceHistory.length > 0 && (
        <div className="mb-2">
          <p className="text-sm font-medium text-textSecondary mb-2">
            Balance History
          </p>
          <div className="flex flex-col gap-2">
            {balanceHistory.map((day) => (
              <Card key={day.date}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{day.date}</p>
                    <p className="text-xs text-textSecondary">
                      Jama ₹{day.jama.toFixed(2)} · Kharch ₹
                      {day.kharch.toFixed(2)}
                    </p>
                  </div>
                  <p
                    className={`font-heading font-bold ${day.closingBalance >= 0 ? "text-success" : "text-danger"}`}
                  >
                    ₹{day.closingBalance.toFixed(2)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default JamaKharch;
