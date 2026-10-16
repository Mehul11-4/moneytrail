import { useState } from "react";
import { Wallet } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import Input from "../components/Input";
import Card from "../components/Card";

function ResetPassword() {
  const { updatePassword, finishRecovery } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await updatePassword(newPassword);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // Password saved — go straight into the app.
    finishRecovery();
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
        <p className="text-lg font-heading font-bold mb-4">Set New Password</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            label="New Password"
            name="resetNewPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
          <Input
            label="Confirm New Password"
            name="resetConfirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
          />
          {error && <p className="text-danger text-sm">{error}</p>}
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Please wait..." : "Save Password"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default ResetPassword;
