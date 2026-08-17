import { useState } from "react";
import { UserCircle, X, LogOut } from "lucide-react";
import Card from "./Card";
import Button from "./Button";
import Input from "./Input";
import { useAuth } from "../context/AuthContext";

function AccountPanel() {
  const { user, signOut, updateEmail, updatePassword } = useAuth();
  const [open, setOpen] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState(null);

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setEmailStatus(null);
    if (!newEmail.trim()) return;
    const { error } = await updateEmail(newEmail.trim());
    if (error) {
      setEmailStatus({ type: "error", message: error.message });
    } else {
      setEmailStatus({
        type: "success",
        message:
          "Confirmation email sent. Check your inbox to confirm the change.",
      });
      setNewEmail("");
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordStatus(null);
    if (!newPassword || newPassword.length < 6) {
      setPasswordStatus({
        type: "error",
        message: "Password must be at least 6 characters.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", message: "Passwords do not match." });
      return;
    }
    const { error } = await updatePassword(newPassword);
    if (error) {
      setPasswordStatus({ type: "error", message: error.message });
    } else {
      setPasswordStatus({
        type: "success",
        message: "Password updated successfully.",
      });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 right-3 z-50 bg-surface border border-white/10 rounded-control p-2"
      >
        <UserCircle className="w-5 h-5 text-textPrimary" />
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <Card
            className="w-full max-w-sm max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <p className="font-heading font-bold text-lg">Account</p>
              <button
                onClick={() => setOpen(false)}
                className="text-textSecondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-textSecondary mb-4">
              Logged in as {user?.email}
            </p>

            <form
              onSubmit={handleUpdateEmail}
              className="flex flex-col gap-2 mb-4 pb-4 border-b border-white/5"
            >
              <Input
                label="Change Email"
                name="accountNewEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="your-real-email@example.com"
              />
              {emailStatus && (
                <p
                  className={`text-xs ${emailStatus.type === "success" ? "text-success" : "text-danger"}`}
                >
                  {emailStatus.message}
                </p>
              )}
              <Button type="submit" variant="secondary">
                Update Email
              </Button>
            </form>

            <form
              onSubmit={handleUpdatePassword}
              className="flex flex-col gap-2 mb-4 pb-4 border-b border-white/5"
            >
              <Input
                label="New Password"
                name="accountNewPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
              <Input
                label="Confirm New Password"
                name="accountConfirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
              {passwordStatus && (
                <p
                  className={`text-xs ${passwordStatus.type === "success" ? "text-success" : "text-danger"}`}
                >
                  {passwordStatus.message}
                </p>
              )}
              <Button type="submit" variant="secondary">
                Update Password
              </Button>
            </form>

            <Button
              variant="danger"
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Log Out
            </Button>
          </Card>
        </div>
      )}
    </>
  );
}

export default AccountPanel;
