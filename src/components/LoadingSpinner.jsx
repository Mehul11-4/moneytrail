import { motion } from "framer-motion";

function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full"
      />
      <p className="text-textSecondary text-sm">{label}</p>
    </div>
  );
}

export default LoadingSpinner;
