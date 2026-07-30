import React, { useState, useEffect } from "react";
import { 
  auth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  sendPasswordResetEmail,
  User 
} from "../lib/firebase";
import { useAppConfig, PortalConfig } from "../context/AppConfigContext";
import { fetchCSVFromGoogleSheet } from "../utils/csvParser";
import { motion, AnimatePresence } from "motion/react";
import { 
  Lock, 
  Mail, 
  Key, 
  LogOut, 
  FileSpreadsheet, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Save, 
  RefreshCw, 
  Bell, 
  Eye, 
  ShieldCheck, 
  ArrowLeft, 
  HelpCircle,
  Check,
  Loader2,
  GraduationCap,
  Layers,
  Clock
} from "lucide-react";

export function AdminPanel() {
  const { config, saveConfig, isFirebaseAvailable } = useAppConfig();

  // Auth States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Editable Form States
  const [formState, setFormState] = useState<PortalConfig>(config);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Spreadsheet Test / Sync States
  const [testingClassSheet, setTestingClassSheet] = useState(false);
  const [classSheetResult, setClassSheetResult] = useState<{ success: boolean; msg: string } | null>(null);

  const [testingExamSheet, setTestingExamSheet] = useState(false);
  const [examSheetResult, setExamSheetResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Keep form state in sync with loaded Firestore config
  useEffect(() => {
    if (config) {
      setFormState(config);
    }
  }, [config]);

  // Handle Login
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setIsSubmittingAuth(true);

    try {
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
      setCurrentUser(userCred.user);
    } catch (err: any) {
      console.error("Auth error:", err);
      let message = "Authentication failed. Please check your credentials.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        message = "Invalid email or password. Please try again.";
      } else if (err.code === "auth/user-not-found") {
        message = "No admin account found with this email.";
      } else if (err.code === "auth/too-many-requests") {
        message = "Access temporarily blocked due to too many failed attempts. Try resetting password or wait a few minutes.";
      }
      setAuthError(message);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Password Reset Email
  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setAuthError("Please enter your admin email address first.");
      return;
    }
    setAuthError("");
    setAuthSuccess("");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setAuthSuccess(`Password reset email sent to ${email.trim()}. Please check your inbox.`);
    } catch (err: any) {
      setAuthError("Failed to send password reset email. " + (err.message || ""));
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  // Save Config to Firestore
  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSaveToast(null);

    try {
      await saveConfig(formState, currentUser?.email || "admin");
      setSaveToast({
        type: "success",
        msg: "All configurations published successfully! Students will now see the updated routines live."
      });
      setTimeout(() => setSaveToast(null), 6000);
    } catch (err: any) {
      console.error("Save config error:", err);
      setSaveToast({
        type: "error",
        msg: "Failed to save configuration to database: " + (err.message || "Unknown error")
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to convert sheet URL to direct CSV download URL
  const convertToCSVUrl = (url: string): string => {
    if (!url) return "";
    let trimmed = url.trim();
    if (trimmed.includes("output=csv") || trimmed.endsWith(".csv")) return trimmed;
    if (trimmed.includes("docs.google.com/spreadsheets/d/")) {
      const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        const id = match[1];
        let gid = "0";
        const gidMatch = trimmed.match(/[?&]gid=([0-9]+)/);
        if (gidMatch && gidMatch[1]) gid = gidMatch[1];
        return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
      }
    }
    return trimmed;
  };

  // Test Class Routine Spreadsheet
  const handleTestClassSheet = async () => {
    setTestingClassSheet(true);
    setClassSheetResult(null);

    const sheetUrl = formState.classRoutineSheetUrl?.trim();
    if (!sheetUrl) {
      setClassSheetResult({ success: false, msg: "Spreadsheet URL is empty or invalid." });
      setTestingClassSheet(false);
      return;
    }

    try {
      const text = await fetchCSVFromGoogleSheet(sheetUrl);
      const lines = text.split("\n").filter(l => l.trim().length > 0);
      if (lines.length > 1) {
        setClassSheetResult({
          success: true,
          msg: `Connected successfully! Spreadsheet contains ${lines.length - 1} data rows.`
        });
      } else {
        setClassSheetResult({
          success: false,
          msg: "Spreadsheet reached, but appears empty or lacks routine data."
        });
      }
    } catch (err: any) {
      setClassSheetResult({
        success: false,
        msg: `Failed to fetch CSV: ${err.message || "Make sure Google Sheet access is set to 'Anyone with the link'."}`
      });
    } finally {
      setTestingClassSheet(false);
    }
  };

  // Test Exam Routine Spreadsheet
  const handleTestExamSheet = async () => {
    setTestingExamSheet(true);
    setExamSheetResult(null);

    const sheetUrl = formState.examRoutineSheetUrl?.trim();
    if (!sheetUrl) {
      setExamSheetResult({ success: false, msg: "Spreadsheet URL is empty or invalid." });
      setTestingExamSheet(false);
      return;
    }

    try {
      const text = await fetchCSVFromGoogleSheet(sheetUrl);
      const lines = text.split("\n").filter(l => l.trim().length > 0);
      if (lines.length > 1) {
        setExamSheetResult({
          success: true,
          msg: `Connected successfully! Exam spreadsheet contains ${lines.length - 1} schedule entries.`
        });
      } else {
        setExamSheetResult({
          success: false,
          msg: "Spreadsheet reached, but appears empty or lacks exam schedule data."
        });
      }
    } catch (err: any) {
      setExamSheetResult({
        success: false,
        msg: `Failed to fetch CSV: ${err.message || "Make sure Google Sheet access is set to 'Anyone with the link'."}`
      });
    } finally {
      setTestingExamSheet(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading secure admin portal...</p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // LOGIN / AUTH FORM (If Admin Not Logged In)
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 select-none">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden"
        >
          {/* Subtle Accent Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4 shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              BUFT Hub Management
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Restricted Portal • Authorized Admin Only
            </p>
          </div>

          {!isFirebaseAvailable && (
            <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>
                Firebase connection error. Ensure your Firebase project ID and permissions are active.
              </span>
            </div>
          )}

          {authError && (
            <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{authSuccess}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@buft.edu.bd"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-600 transition-colors outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-600 transition-colors outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingAuth}
              className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white font-medium text-sm py-2.5 rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              {isSubmittingAuth ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In as Admin</span>
                </>
              )}
            </button>
          </form>

          {/* Action Links */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center text-xs text-slate-400">
            <button
              type="button"
              onClick={handlePasswordReset}
              className="hover:text-emerald-400 transition-colors underline cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>

          <div className="mt-6 text-center">
            <a 
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Portal</span>
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // DASHBOARD FOR LOGGED-IN ADMIN
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Admin Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight flex items-center gap-2">
              BUFT HUB Admin Panel
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Live System
              </span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              Logged in as <span className="text-emerald-400 font-mono">{currentUser.email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">View Public Site</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Toast Alert */}
        <AnimatePresence>
          {saveToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-2xl border text-sm flex items-start justify-between gap-3 shadow-xl ${
                saveToast.type === "success" 
                  ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-200" 
                  : "bg-rose-950/80 border-rose-500/30 text-rose-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {saveToast.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span>{saveToast.msg}</span>
              </div>
              <button 
                onClick={() => setSaveToast(null)}
                className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overview Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Dynamic Routine & Schedule Controller
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Updates saved here instantly update the public website (<code className="text-emerald-400">bufthub.vercel.app</code>) without making code changes or redeploying the app!
              </p>
            </div>

            <button
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-medium text-sm px-6 py-3 rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 shrink-0"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Publish Updates Live</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Configuration Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SECTION 1: CLASS ROUTINE CONFIGURATION */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Class Routine Settings</h3>
                  <p className="text-xs text-slate-400">Weekly class timetable configurations</p>
                </div>
              </div>

              <span className="text-[10px] px-2 py-1 rounded-md bg-blue-500/10 text-blue-300 font-mono">
                Class Routine
              </span>
            </div>

            <div className="space-y-4">
              {/* Sheet URL */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Class Routine Google Sheet CSV URL</span>
                  <a 
                    href="https://docs.google.com/spreadsheets/d/1vdPoJPxAwUDKblyyUv5Nd8cchFRxhcqe4FUAuUA-mTs/edit?usp=sharing" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                  >
                    Open Current Sheet <ExternalLink className="w-3 h-3" />
                  </a>
                </label>
                <input
                  type="text"
                  value={formState.classRoutineSheetUrl}
                  onChange={(e) => setFormState({ ...formState, classRoutineSheetUrl: e.target.value })}
                  placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl py-2.5 px-3 text-xs text-slate-100 font-mono placeholder-slate-600 transition-colors outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 Tip: You can paste either the standard Google Sheet edit link OR the published CSV format link.
                </p>
              </div>

              {/* Test Spreadsheet Button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestClassSheet}
                  disabled={testingClassSheet}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {testingClassSheet ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" /> : <RefreshCw className="w-3.5 h-3.5 text-blue-400" />}
                  <span>Test Connection</span>
                </button>

                {classSheetResult && (
                  <span className={`text-xs flex items-center gap-1.5 ${classSheetResult.success ? "text-emerald-400" : "text-rose-400"}`}>
                    {classSheetResult.success ? <Check className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                    {classSheetResult.msg}
                  </span>
                )}
              </div>

              {/* Semester Name & Last Updated Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Semester Name
                  </label>
                  <input
                    type="text"
                    value={formState.classRoutineSemester}
                    onChange={(e) => setFormState({ ...formState, classRoutineSemester: e.target.value })}
                    placeholder="Spring 2026 (261)"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-xs text-slate-100 transition-colors outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Last Updated Date
                  </label>
                  <input
                    type="text"
                    value={formState.classRoutineLastUpdate}
                    onChange={(e) => setFormState({ ...formState, classRoutineLastUpdate: e.target.value })}
                    placeholder="14/07/2026"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-xs text-slate-100 transition-colors outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: EXAM ROUTINE CONFIGURATION */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Exam Routine Settings</h3>
                  <p className="text-xs text-slate-400">Midterm & Final examination schedules</p>
                </div>
              </div>

              <span className="text-[10px] px-2 py-1 rounded-md bg-purple-500/10 text-purple-300 font-mono">
                Exam Routine
              </span>
            </div>

            <div className="space-y-4">
              {/* Sheet URL */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Exam Routine Google Sheet CSV URL</span>
                  <a 
                    href="https://docs.google.com/spreadsheets/d/1DcEso5N-DUqfLXcOJxCg5efXJyahZwk4IEdWoGqe0Do/edit?usp=sharing" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[11px] text-purple-400 hover:underline flex items-center gap-1"
                  >
                    Open Current Sheet <ExternalLink className="w-3 h-3" />
                  </a>
                </label>
                <input
                  type="text"
                  value={formState.examRoutineSheetUrl}
                  onChange={(e) => setFormState({ ...formState, examRoutineSheetUrl: e.target.value })}
                  placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 px-3 text-xs text-slate-100 font-mono placeholder-slate-600 transition-colors outline-none"
                />
              </div>

              {/* Test Exam Spreadsheet Button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestExamSheet}
                  disabled={testingExamSheet}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {testingExamSheet ? <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" /> : <RefreshCw className="w-3.5 h-3.5 text-purple-400" />}
                  <span>Test Connection</span>
                </button>

                {examSheetResult && (
                  <span className={`text-xs flex items-center gap-1.5 ${examSheetResult.success ? "text-emerald-400" : "text-rose-400"}`}>
                    {examSheetResult.success ? <Check className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                    {examSheetResult.msg}
                  </span>
                )}
              </div>

              {/* Semester Name & Last Updated Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Exam Term / Semester
                  </label>
                  <input
                    type="text"
                    value={formState.examRoutineSemester}
                    onChange={(e) => setFormState({ ...formState, examRoutineSemester: e.target.value })}
                    placeholder="Spring 2026 (261)"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2 px-3 text-xs text-slate-100 transition-colors outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Exam Tag / Type
                  </label>
                  <input
                    type="text"
                    value={formState.examName || "SEE"}
                    onChange={(e) => setFormState({ ...formState, examName: e.target.value })}
                    placeholder="SEE / Midterm / Final"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2 px-3 text-xs text-slate-100 transition-colors outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: ANNOUNCEMENT BANNER */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Broadcast Announcement Notice</h3>
                <p className="text-xs text-slate-400">Display an urgent notice at the top of the portal for all students</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={formState.noticeBannerEnabled}
                onChange={(e) => setFormState({ ...formState, noticeBannerEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <div>
            <textarea
              rows={2}
              value={formState.noticeBannerText}
              onChange={(e) => setFormState({ ...formState, noticeBannerText: e.target.value })}
              placeholder="e.g. 📢 Class routine for Spring 2026 semester has been updated with new room assignments!"
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 transition-colors outline-none resize-none"
            />
          </div>
        </div>

        {/* Save Bar Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="text-xs text-slate-500">
            {formState.updatedAt ? (
              <span>Last published on: {new Date(formState.updatedAt).toLocaleString()}</span>
            ) : (
              <span>No published updates recorded yet</span>
            )}
          </div>

          <button
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-medium text-sm px-8 py-3 rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Publish Updates</span>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
