import { useState, useRef } from "react";
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  AlertTriangle,
  Store,
} from "lucide-react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { exportBusinessData, importBusinessData } from "../../utils/backup";
import { useAppMode } from "../../context/AppModeContext";
import { useAuth } from "../../context/AuthContext";
import { RefreshCw, LogOut } from "lucide-react";
function BusinessSettings() {
  const { goToSelector } = useAppMode();
  const { signOut, user, updateEmail, updatePassword } = useAuth();
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState(null);
  const [confirmingImport, setConfirmingImport] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
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

  const handleExport = async () => {
    try {
      await exportBusinessData();
      setStatus({ type: "success", message: "CBN CHAI backup downloaded." });
    } catch {
      setStatus({ type: "error", message: "Export failed. Please try again." });
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPendingFile(file);
    setConfirmingImport(true);
  };

  const handleConfirmImport = async () => {
    if (!pendingFile) return;
    try {
      await importBusinessData(pendingFile);
      setStatus({
        type: "success",
        message: "Business data restored. Reloading...",
      });
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Import failed." });
    } finally {
      setConfirmingImport(false);
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCancelImport = () => {
    setConfirmingImport(false);
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary font-body p-4 pb-24">
      <div className="flex items-center gap-3 mt-6 mb-6">
        <SettingsIcon className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-heading font-bold">Business Settings</h1>
      </div>

      <Card className="mb-4 flex items-center gap-3">
        <Store className="w-8 h-8 text-primary" />
        <div>
          <p className="font-heading font-bold">CBN CHAI</p>
          <p className="text-xs text-textSecondary">Sole Proprietorship</p>
        </div>
      </Card>

      <Card className="mb-4">
        <p className="text-sm font-medium mb-1">Backup Business Data</p>
        <p className="text-xs text-textSecondary mb-3">
          Exports only Inventory, Counter sales, and Jama-Kharch — your personal
          expense data is not included.
        </p>
        <Button
          variant="primary"
          onClick={handleExport}
          className="w-full flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" /> Export CBN CHAI Backup
        </Button>
      </Card>

      <Card>
        <p className="text-sm font-medium mb-1">Restore Business Data</p>
        <p className="text-xs text-textSecondary mb-3">
          Replaces current Inventory, Sales, and Jama-Kharch data. Personal data
          is untouched.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleFileSelect}
          className="hidden"
          id="import-business-file"
        />
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" /> Choose Backup File
        </Button>
      </Card>

      {status && (
        <p
          className={`text-sm mt-4 ${status.type === "success" ? "text-success" : "text-danger"}`}
        >
          {status.message}
        </p>
      )}

      <Card className="mb-4">
        <p className="text-sm font-medium mb-1">Switch Mode</p>
        <p className="text-xs text-textSecondary mb-3">
          Go back to the Personal / CBN CHAI selector screen.
        </p>
        <Button
          variant="secondary"
          onClick={goToSelector}
          className="w-full flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Switch Mode
        </Button>
      </Card>

      <Card className="mb-4">
        <p className="text-sm font-medium mb-1">Account</p>
        <p className="text-xs text-textSecondary mb-3">
          Logged in as {user?.email}
        </p>

        <form onSubmit={handleUpdateEmail} className="flex flex-col gap-2 mb-4">
          <Input
            label="Change Email"
            name="newEmailBusiness"
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
          className="flex flex-col gap-2 mb-4 pt-4 border-t border-white/5"
        >
          <Input
            label="New Password"
            name="newPasswordBusiness"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
          <Input
            label="Confirm New Password"
            name="confirmPasswordBusiness"
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

      {confirmingImport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]">
          <Card className="w-full max-w-sm">
            <div className="flex items-center gap-2 text-warning mb-2">
              <AlertTriangle className="w-5 h-5" />
              <p className="font-medium">Replace business data?</p>
            </div>
            <p className="text-sm text-textSecondary mb-4">
              This will permanently replace all Inventory, Sales, and
              Jama-Kharch entries with the backup file's contents. Personal data
              will not be affected. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleCancelImport}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmImport}
                className="flex-1"
              >
                Replace Data
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default BusinessSettings;
