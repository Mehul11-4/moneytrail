import { useState } from "react";
import { Wallet, Mail, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import Input from "../components/Input";
import Card from "../components/Card";

function Auth() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim() || !password) {
      setError("Enter both email and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    if (mode === "login") {
      const { error } = await signIn(email.trim(), password);
      if (error) setError(error.message);
    } else {
      const { error } = await signUp(email.trim(), password);
      if (error) {
        setError(error.message);
      } else {
        setMessage(
          "Account created! Check your email to confirm, then log in.",
        );
        setMode("login");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="flex items-center gap-3 mb-8">
        <Wallet className="w-10 h-10 text-primary" />
        <h1 className="text-3xl font-heading font-bold text-textPrimary">
          MoneyTrail
        </h1>
      </div>

      <Card className="w-full max-w-sm">
        <p className="text-lg font-heading font-bold mb-4">
          {mode === "login" ? "Log In" : "Create Account"}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />

          {error && <p className="text-danger text-sm">{error}</p>}
          {message && <p className="text-success text-sm">{message}</p>}

          <Button type="submit" variant="primary" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Log In"
                : "Sign Up"}
          </Button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
            setMessage("");
          }}
          className="text-textSecondary text-sm mt-4 text-center w-full"
        >
          {mode === "login"
            ? "Don't have an account? Sign up"
            : "Already have an account? Log in"}
        </button>
      </Card>
    </div>
  );
}

export default Auth;
