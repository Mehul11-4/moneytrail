import { BrowserRouter, Routes, Route } from "react-router-dom";
import AddExpense from "./pages/AddExpense";
import ExpenseList from "./pages/ExpenseList";
import Dashboard from "./pages/Dashboard";
import Budgets from "./pages/Budgets";
import BottomNav from "./components/BottomNav";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AddExpense />} />
        <Route path="/expenses" element={<ExpenseList />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/budgets" element={<Budgets />} />
      </Routes>
      <BottomNav />
    </BrowserRouter>
  );
}

export default App;
