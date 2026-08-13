import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Wallet, Coffee } from "lucide-react";
import { useAppMode } from "../context/AppModeContext";

function ModeSwitcher() {
  const { setMode } = useAppMode();
  const navigate = useNavigate();

  const choosePersonal = () => {
    setMode("personal");
    navigate("/dashboard");
  };

  const chooseBusiness = () => {
    setMode("business");
    navigate("/business/counter");
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3, ease: "easeInOut" } }}
      className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-6"
    >
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        whileTap={{ scale: 0.95 }}
        onClick={choosePersonal}
        className="w-full max-w-xs aspect-square rounded-card bg-primary flex flex-col items-center justify-center gap-4 shadow-lg shadow-primary/20"
      >
        <Wallet className="w-20 h-20 text-background" />
        <span className="text-2xl font-heading font-bold text-background">
          Personal
        </span>
      </motion.button>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
        whileTap={{ scale: 0.95 }}
        onClick={chooseBusiness}
        className="w-full max-w-xs aspect-square rounded-card bg-amber-500 flex flex-col items-center justify-center gap-4 shadow-lg shadow-amber-500/20"
      >
        <Coffee className="w-20 h-20 text-background" />
        <span className="text-2xl font-heading font-bold text-background">
          CBN चाय
        </span>
      </motion.button>
    </motion.div>
  );
}

export default ModeSwitcher;
