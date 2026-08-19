import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AppModeProvider, useAppMode } from "./context/AppModeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Auth from "./pages/Auth";

import AddExpense from "./pages/AddExpense";
import ExpenseList from "./pages/ExpenseList";
import Balance from "./pages/Balance";
import Dashboard from "./pages/Dashboard";
import Budgets from "./pages/Budgets";
import Settings from "./pages/Settings";
import BottomNav from "./components/BottomNav";

import Counter from "./pages/business/Counter";
import Inventory from "./pages/business/Inventory";
import JamaKharch from "./pages/business/JamaKharch";
import LedgerCategory from "./pages/business/LedgerCategory";
import ProfitLoss from "./pages/business/ProfitLoss";
import LoanTaken from "./pages/business/LoanTaken";
import UdhaarGiven from "./pages/business/UdhaarGiven";
import BusinessSettings from "./pages/business/BusinessSettings";
import BusinessBottomNav from "./components/BusinessBottomNav";
import BusinessTopBar from "./components/BusinessTopBar";
import PersonalTopBar from "./components/PersonalTopBar";

import ModeSwitcher from "./components/ModeSwitcher";

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

function AnimatedRoutes() {
  const location = useLocation();
  const { mode } = useAppMode();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
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
          path="/dashboard"
          element={
            <PageWrapper>
              <Dashboard />
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

        <Route
          path="/business/counter"
          element={
            <PageWrapper>
              <Counter />
            </PageWrapper>
          }
        />
        <Route
          path="/business/inventory"
          element={
            <PageWrapper>
              <Inventory />
            </PageWrapper>
          }
        />
        <Route
          path="/business/jama-kharch"
          element={
            <PageWrapper>
              <JamaKharch />
            </PageWrapper>
          }
        />
        <Route
          path="/business/jama-kharch/:slug"
          element={
            <PageWrapper>
              <LedgerCategory />
            </PageWrapper>
          }
        />
        <Route
          path="/business/profit-loss"
          element={
            <PageWrapper>
              <ProfitLoss />
            </PageWrapper>
          }
        />
        <Route
          path="/business/loan-taken"
          element={
            <PageWrapper>
              <LoanTaken />
            </PageWrapper>
          }
        />
        <Route
          path="/business/udhaar-given"
          element={
            <PageWrapper>
              <UdhaarGiven />
            </PageWrapper>
          }
        />
        <Route
          path="/business/settings"
          element={
            <PageWrapper>
              <BusinessSettings />
            </PageWrapper>
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to={mode === "business" ? "/business/counter" : "/"}
              replace
            />
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function AppShell() {
  const { mode } = useAppMode();

  return (
    <AnimatePresence mode="wait">
      {!mode ? (
        <ModeSwitcher key="selector" />
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {mode === "business" && <BusinessTopBar />}
          {mode === "personal" && <PersonalTopBar />}
          <AnimatedRoutes />
          {mode === "personal" ? <BottomNav /> : <BusinessBottomNav />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AuthGate() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-textSecondary text-sm">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <AppModeProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AppModeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

export default App;
