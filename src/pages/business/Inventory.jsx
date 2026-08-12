import { useMemo } from "react";
import { Package, AlertTriangle } from "lucide-react";
import Card from "../../components/Card";
import { useProducts } from "../../hooks/useProducts";
import { PRODUCT_SECTIONS } from "../../utils/productSections";

const LOW_STOCK_THRESHOLD = 5;

function Inventory() {
  const { products, loading } = useProducts();

  const grouped = useMemo(() => {
    const map = {};
    PRODUCT_SECTIONS.forEach((s) => (map[s] = []));
    products.forEach((p) => {
      const section = p.section || "Other";
      if (!map[section]) map[section] = [];
      map[section].push(p);
    });
    return map;
  }, [products]);

  return (
    <div className="min-h-screen bg-background text-textPrimary font-body p-4 pb-24">
      <div className="flex items-center gap-3 mt-6 mb-2">
        <Package className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-heading font-bold">Inventory</h1>
      </div>
      <p className="text-xs text-textSecondary mb-4">
        Stock updates automatically from Jama-Kharch purchases and Counter
        sales.
      </p>

      {loading && <p className="text-textSecondary text-sm">Loading...</p>}
      {!loading && products.length === 0 && (
        <p className="text-textSecondary text-sm">
          No products yet. Log a "Purchase Goods" entry in Jama-Kharch to add
          your first item.
        </p>
      )}

      {PRODUCT_SECTIONS.map((section) => {
        const items = grouped[section] || [];
        if (items.length === 0) return null;

        return (
          <div key={section} className="mb-5">
            <p className="text-sm font-heading font-bold text-primary mb-2">
              {section}
            </p>
            <div className="flex flex-col gap-3">
              {items.map((p) => {
                const isLow = p.stockQty <= LOW_STOCK_THRESHOLD;
                return (
                  <Card key={p.id} className={isLow ? "border-warning/40" : ""}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-textSecondary">
                          1 {p.unitLabel} = {p.qtyPerUnit} pcs · Cost ₹
                          {p.pricePerQty.toFixed(2)}/pc · MRP ₹
                          {p.mrpPerQty.toFixed(2)}/pc
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-textSecondary">
                        Stock remaining
                      </p>
                      <p
                        className={`font-heading font-bold ${isLow ? "text-warning" : "text-textPrimary"}`}
                      >
                        {p.stockQty} pcs
                      </p>
                    </div>
                    {isLow && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-warning">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Low stock — restock via Jama-Kharch
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Inventory;
