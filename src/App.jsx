import { Wallet } from "lucide-react";

function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center gap-3">
      <Wallet className="w-8 h-8 text-emerald-400" />
      <h1 className="text-3xl font-bold">MoneyTrail</h1>
    </div>
  );
}

export default App;
