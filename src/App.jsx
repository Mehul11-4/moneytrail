import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import AddExpense from "./pages/AddExpense";
import ExpenseList from "./pages/ExpenseList";
import Balance from "./pages/Balance";
import Dashboard from "./pages/Dashboard";
import Budgets from "./pages/Budgets";
import Settings from "./pages/Settings";
import BottomNav from "./components/BottomNav";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageWrapper>
              <Dashboard />
            </PageWrapper>
          }
        />
        <Route
          path="/add"
          element={
            <PageWrapper>
              <AddExpense />
            </PageWrapper>
          }
        />
        <Route
          path="/expenses"
          element={
            <PageWrapper>
              <ExpenseList />
            </PageWrapper>
          }
        />
        <Route
          path="/balance"
          element={
            <PageWrapper>
              <Balance />
            </PageWrapper>
          }
        />
        <Route
          path="/budgets"
          element={
            <PageWrapper>
              <Budgets />
            </PageWrapper>
          }
        />
        <Route
          path="/settings"
          element={
            <PageWrapper>
              <Settings />
            </PageWrapper>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
      <BottomNav />
    </BrowserRouter>
  );
}

export default App;
