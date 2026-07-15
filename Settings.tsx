import React, { useRef, useState, useEffect } from "react";
import { 
  Sun, 
  Moon, 
  Smartphone, 
  QrCode as QrIcon, 
  Upload, 
  Trash2, 
  RefreshCcw,
  Check,
  Cloud,
  Mail,
  Download,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  X
} from "lucide-react";
import { signInWithGoogleDrive, backupToGoogleDrive, restoreFromGoogleDrive } from "../lib/googleDrive";

interface SettingsProps {
  theme: "light" | "dark" | "system";
  onThemeChange: (theme: "light" | "dark" | "system") => void;
  qrCode: string | null;
  onQrCodeChange: (dataUrl: string | null) => void;
  onResetData: () => void;
  students: any[];
  onRestoreData: (students: any[], qrCode: string | null) => void;
}

export default function Settings({ 
  theme, 
  onThemeChange, 
  qrCode, 
  onQrCodeChange, 
  onResetData,
  students,
  onRestoreData
}: SettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonImportInputRef = useRef<HTMLInputElement>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // States for state-based inline modal confirmations
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRemoveQrConfirm, setShowRemoveQrConfirm] = useState(false);

  // Google Drive Connection States
  const [connectedUser, setConnectedUser] = useState<any>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isDriveOperating, setIsDriveOperating] = useState(false);

  // Email storage for data recovery
  const [backupEmail, setBackupEmail] = useState(() => {
    return localStorage.getItem("tuition_backup_email") || "sumitprasadsaha@gmail.com";
  });

  const saveEmail = (email: string) => {
    setBackupEmail(email);
    localStorage.setItem("tuition_backup_email", email);
  };

  const triggerNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(""), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  const handleReset = () => {
    onResetData();
    setShowResetConfirm(false);
    triggerNotification("All application data has been permanently cleared.");
  };

  const handleRemoveQr = () => {
    onQrCodeChange(null);
    setShowRemoveQrConfirm(false);
    triggerNotification("Payment QR Code removed.");
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          onQrCodeChange(reader.result);
          triggerNotification("Payment QR Code updated successfully!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- GOOGLE DRIVE BACKUP & RESTORE INTEGRATION ---
  const handleConnectDrive = async () => {
    setIsDriveOperating(true);
    setErrorMsg("");
    try {
      const result = await signInWithGoogleDrive();
      if (result) {
        setConnectedUser(result.user);
        setGoogleAccessToken(result.accessToken);
        triggerNotification(`Connected successfully as ${result.user.email}!`);
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification(
        "Google Sign-In failed or OAuth is not configured. Please use the offline JSON backup feature below to secure your data instantly!", 
        true
      );
    } finally {
      setIsDriveOperating(false);
    }
  };

  const handleDriveBackup = async () => {
    if (!googleAccessToken) {
      triggerNotification("Please connect your Google Drive account first.", true);
      return;
    }
    setIsDriveOperating(true);
    try {
      const payload = {
        students,
        qrCode,
        backupEmail,
        timestamp: new Date().toISOString()
      };
      await backupToGoogleDrive(googleAccessToken, payload);
      triggerNotification(`Roster backup stored successfully on Drive for ${backupEmail}!`);
    } catch (err: any) {
      console.error(err);
      triggerNotification(`Drive backup failed: ${err.message || err}`, true);
    } finally {
      setIsDriveOperating(false);
    }
  };

  const handleDriveRestore = async () => {
    if (!googleAccessToken) {
      triggerNotification("Please connect your Google Drive account first.", true);
      return;
    }
    setIsDriveOperating(true);
    try {
      const restored = await restoreFromGoogleDrive(googleAccessToken);
      if (restored && Array.isArray(restored.students)) {
        onRestoreData(restored.students, restored.qrCode || null);
        if (restored.backupEmail) {
          saveEmail(restored.backupEmail);
        }
        triggerNotification("Application data recovered successfully from Google Drive!");
      } else {
        triggerNotification("Invalid backup file found on Google Drive.", true);
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification(`Restore failed: ${err.message || err}`, true);
    } finally {
      setIsDriveOperating(false);
    }
  };

  // --- OFFLINE JSON IMPORT/EXPORT (Iframe-proof alternative) ---
  const handleExportJSON = () => {
    try {
      const payload = {
        students,
        qrCode,
        backupEmail,
        exportDate: new Date().toISOString()
      };
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(payload, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `tuition_ledger_backup_${backupEmail.split("@")[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      triggerNotification("Offline backup file downloaded successfully!");
    } catch (err) {
      triggerNotification("Failed to export backup file.", true);
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && Array.isArray(parsed.students)) {
            onRestoreData(parsed.students, parsed.qrCode || null);
            if (parsed.backupEmail) {
              saveEmail(parsed.backupEmail);
            }
            triggerNotification("Offline data restored successfully from file!");
          } else {
            triggerNotification("Invalid file format. Student array is missing.", true);
          }
        } catch (err) {
          triggerNotification("Failed to parse file. Ensure it is a valid JSON backup.", true);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-24 animate-fadeIn" id="settings-view">
      {/* Title */}
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100" id="settings-title">
          Settings
        </h1>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
          Configure preferences, billing alerts, and local backups.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-105 dark:border-rose-900/30 rounded-xl text-xs font-bold flex items-start gap-2.5 animate-fadeIn leading-relaxed">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Settings Grid */}
      <div className="flex flex-col gap-5">
        
        {/* SECTION 1: App Theme (High Contrast Only) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sun className="w-4 h-4" />
              App Theme
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Select your preferred display mode or match your system settings.
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-1">
            {/* Light Option */}
            <button
              onClick={() => onThemeChange("light")}
              className={`py-3 px-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                theme === "light"
                  ? "border-blue-500 bg-blue-50/40 text-blue-600 dark:text-blue-400 font-black scale-[1.02] shadow-xs"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50"
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Light</span>
            </button>

            {/* Dark Option */}
            <button
              onClick={() => onThemeChange("dark")}
              className={`py-3 px-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                theme === "dark"
                  ? "border-blue-500 bg-blue-950/20 text-blue-500 dark:text-blue-400 font-black scale-[1.02] shadow-xs"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50"
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Dark</span>
            </button>

            {/* System Option */}
            <button
              onClick={() => onThemeChange("system")}
              className={`py-3 px-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                theme === "system"
                  ? "border-blue-500 bg-blue-50/40 text-blue-600 dark:text-blue-400 font-black scale-[1.02] shadow-xs"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>System</span>
            </button>
          </div>
        </div>

        {/* SECTION 2: Billing QR Code */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <QrIcon className="w-4 h-4" />
                Payment QR Code
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                Upload your GPay, PhonePe, or Paytm QR code to embed in WhatsApp alerts.
              </span>
            </div>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleQrUpload} 
            accept="image/*" 
            className="hidden" 
          />

          {qrCode ? (
            <div className="flex flex-col items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-900/50">
              <img 
                src={qrCode} 
                alt="Billing QR" 
                className="w-40 h-40 object-contain rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white p-2" 
              />
              <div className="flex gap-2.5 w-full">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200/50 dark:border-slate-700/50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Replace</span>
                </button>

                {showRemoveQrConfirm ? (
                  <div className="flex gap-1">
                    <button
                      onClick={handleRemoveQr}
                      className="py-2 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setShowRemoveQrConfirm(false)}
                      className="py-2 px-2.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRemoveQrConfirm(true)}
                    className="py-2 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-rose-100/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-600 hover:bg-blue-50/20 dark:hover:bg-blue-950/10 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-xs transition-all cursor-pointer group"
            >
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950/40 rounded-full group-hover:scale-105 transition-all">
                <QrIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              </div>
              <span className="text-slate-700 dark:text-slate-300">Upload GPay/PhonePe QR Image</span>
              <span className="text-[10px] text-slate-400 font-medium">PNG, JPG, or JPEG</span>
            </button>
          )}
        </div>

        {/* SECTION 3: Google Drive Data Recovery & Backup */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-blue-500" />
              Google Drive Cloud Sync & Data Recovery
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
              Enable data recovery by storing your tuition records securely in your Google Drive cloud account.
            </span>
          </div>

          <div className="flex flex-col gap-3.5">
            {/* Field: Backup Email address */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                Target Email Address for Ledger Tracking
              </label>
              <input
                type="email"
                placeholder="e.g. sumitprasadsaha@gmail.com"
                value={backupEmail}
                onChange={(e) => saveEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold transition-all"
                required
              />
            </div>

            {/* Cloud Action Buttons */}
            <div className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-900/50">
              <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Cloud Recovery Dashboard
              </span>
              
              {connectedUser ? (
                <div className="flex flex-col gap-2.5 mt-2">
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/20 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <span className="truncate">Connected: {connectedUser.email}</span>
                    <button 
                      onClick={() => { setConnectedUser(null); setGoogleAccessToken(null); }} 
                      className="text-[10px] uppercase font-black tracking-widest text-rose-500 hover:text-rose-600 pl-2 cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleDriveBackup}
                      disabled={isDriveOperating}
                      className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-xs"
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      <span>{isDriveOperating ? "Backing up..." : "Backup to Drive"}</span>
                    </button>
                    <button
                      onClick={handleDriveRestore}
                      disabled={isDriveOperating}
                      className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-xs"
                    >
                      <RefreshCcw className="w-3.5 h-3.5" />
                      <span>{isDriveOperating ? "Restoring..." : "Restore from Drive"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 mt-1">
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-1.5">
                    Connect your tuition manager to authorize secure cloud backup directories.
                  </p>
                  <button
                    onClick={handleConnectDrive}
                    disabled={isDriveOperating}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/10 transition-all"
                  >
                    <Cloud className="w-4 h-4" />
                    <span>{isDriveOperating ? "Authenticating..." : "Connect Google Drive account"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Robust 100% Offline fallback backup (Iframe-proof) */}
            <div className="flex flex-col gap-2.5 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-105 dark:border-slate-900/50 mt-1">
              <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4" />
                Offline Manual JSON Backup (100% Reliable Fallback)
              </span>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                If browser iframe security blocks the Google Login popup, download the raw JSON backup file to your device and import it instantly anytime!
              </p>

              <input 
                type="file" 
                ref={jsonImportInputRef} 
                onChange={handleImportJSON} 
                accept=".json" 
                className="hidden" 
              />

              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={handleExportJSON}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200/50 dark:border-slate-750"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup</span>
                </button>
                <button
                  onClick={() => jsonImportInputRef.current?.click()}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200/50 dark:border-slate-750"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Backup</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: System Operations (Danger/Reset) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm flex flex-col gap-4">
          <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <RefreshCcw className="w-4 h-4" />
            Factory Reset & Delete All Data
          </span>

          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
              This will permanently delete all student rosters, attendance logs, billing states, recorded dues, revenue data, and payment QR codes. The application will start completely clean.
            </p>
            
            {showResetConfirm ? (
              <div className="flex flex-col gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl animate-fadeIn">
                <span className="text-[11px] font-black text-rose-600 dark:text-rose-400">
                  This will erase ALL current student ledger entries! Are you sure?
                </span>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={handleReset}
                    className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black uppercase transition-all cursor-pointer"
                  >
                    Yes, Reset Everything
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-4 py-1.5 bg-slate-200 dark:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="mt-1 w-full py-3 bg-rose-50 dark:bg-rose-950/10 border border-rose-200/50 dark:border-rose-900/30 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                id="btn-reset-data"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>Reset & Start Clean</span>
              </button>
            )}
          </div>
        </div>

        {/* Branding Footer */}
        <div className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600 mt-4">
          <span>Tuition Ledger Manager • v2.0</span>
        </div>
      </div>
    </div>
  );
}
