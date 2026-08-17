import { useState, useRef } from "react";
import {
  Download,
  Upload,
  AlertTriangle,
  Settings as SettingsIcon,
} from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import { exportData, importData } from "../utils/backup";
import { useAppMode } from "../context/AppModeContext";
import AccountPanel from "../components/AccountPanel";
import { RefreshCw } from "lucide-react";

function Settings() {
  const { goToSelector } = useAppMode();
  const fileInputRef = useRef(null);
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
  const [status, setStatus] = useState(null); // { type: "success" | "error", message }
  const [confirmingImport, setConfirmingImport] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);

  const handleExport = async () => {
    try {
      await exportData();
      setStatus({
        type: "success",
        message: "Backup downloaded successfully.",
      });
    } catch (err) {
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
      await importData(pendingFile);
      setStatus({
        type: "success",
        message: "Data restored successfully. Reloading...",
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
      <AccountPanel />
      <div className="flex items-center gap-3 mt-6 mb-6">
        <SettingsIcon className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-heading font-bold">Settings</h1>
      </div>

      <Card className="mb-4">
        <p className="text-sm font-medium mb-1">Backup Your Data</p>
        <p className="text-xs text-textSecondary mb-3">
          Backs up everything — personal expenses, budgets, balance, AND your
          CBN CHAI business data (inventory, sales, Jama-Kharch). Download
          regularly, especially before switching phones or clearing browser
          data.
        </p>
        <Button
          variant="primary"
          onClick={handleExport}
          className="w-full flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" /> Export Backup
        </Button>
      </Card>

      <Card>
        <p className="text-sm font-medium mb-1">Restore from Backup</p>
        <p className="text-xs text-textSecondary mb-3">
          This will replace all current data with the contents of the backup
          file.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleFileSelect}
          className="hidden"
          id="import-file"
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

      <Card className="mb-4 mt-4">
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

      {/* Confirm dialog before destructive import */}

      {/* Confirm dialog before destructive import */}
      {confirmingImport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]">
          <Card className="w-full max-w-sm">
            <div className="flex items-center gap-2 text-warning mb-2">
              <AlertTriangle className="w-5 h-5" />
              <p className="font-medium">Replace all data?</p>
            </div>
            <p className="text-sm text-textSecondary mb-4">
              This will permanently delete your current expenses, budgets, and
              categories, replacing them with the backup file's contents. This
              cannot be undone.
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

export default Settings;
