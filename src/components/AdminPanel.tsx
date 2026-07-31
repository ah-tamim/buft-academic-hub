import React, { useState, useEffect, useMemo } from "react";
import { 
  auth, 
  db,
  doc,
  setDoc,
  onSnapshot,
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  sendPasswordResetEmail,
  User 
} from "../lib/firebase";
import { useAppConfig, PortalConfig, DEFAULT_PORTAL_CONFIG } from "../context/AppConfigContext";
import { fetchCSVFromGoogleSheet } from "../utils/csvParser";
import { NoteHubItem, NoteCategory, ExamType, AdminProfile, AdminTab, AdminFieldPermissions } from "../types";
import { BUFT_SEMESTERS, BUFT_DEPARTMENTS, INITIAL_NOTE_HUB_ITEMS } from "../data/sampleNoteHub";
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
  Clock,
  Globe,
  Link2,
  Wrench,
  ShieldAlert,
  Sliders,
  Info,
  CheckCircle,
  AlertTriangle,
  Phone,
  Building,
  Layout,
  MessageSquare,
  Zap,
  Activity,
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  FileCode,
  Search,
  FolderPlus,
  UserCheck,
  Users,
  UserPlus,
  Shield
} from "lucide-react";

export function AdminPanel() {
  const { config, saveConfig, isFirebaseAvailable } = useAppConfig();

  // Active Admin Tab State
  const [activeTab, setActiveTab] = useState<AdminTab>("routines");

  // Admin Profiles & Granular Access State
  const [adminProfiles, setAdminProfiles] = useState<AdminProfile[]>([]);
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [isSavingProfiles, setIsSavingProfiles] = useState(false);
  const [isEditingMyName, setIsEditingMyName] = useState(false);
  const [myNameInput, setMyNameInput] = useState("");

  // Admin Profile Form State
  const [adminForm, setAdminForm] = useState<{
    email: string;
    name: string;
    role: "superadmin" | "editor";
    allowedTabs: AdminTab[];
    allowedFields: AdminFieldPermissions;
  }>({
    email: "",
    name: "",
    role: "editor",
    allowedTabs: ["routines", "notehub"],
    allowedFields: {
      canEditClassRoutine: true,
      canEditExamRoutine: true,
      canManageNoteHub: true,
      canEditBroadcastBanner: false,
      canEditPortalBranding: false,
      canEditQuickLinks: false,
      canEditFeatureToggles: false,
      canEditMaintenanceMode: false,
      canManageAdmins: false,
    },
  });

  // Note HUB State
  const [noteHubItems, setNoteHubItems] = useState<NoteHubItem[]>(INITIAL_NOTE_HUB_ITEMS);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [isSavingNoteHub, setIsSavingNoteHub] = useState(false);
  
  // Note HUB Form State
  const [noteForm, setNoteForm] = useState<{
    title: string;
    courseCode: string;
    batch: string;
    authorName: string;
    examType: ExamType;
    semester: string;
    department: string;
    category: NoteCategory;
    fileUrl: string;
    description: string;
    fileType: string;
  }>({
    title: "",
    courseCode: "",
    batch: "",
    authorName: "",
    examType: "SME",
    semester: "1st Semester",
    department: "CSE",
    category: "notes",
    fileUrl: "",
    description: "",
    fileType: "Google Drive"
  });

  // Note HUB Filter State for Admin List
  const [adminNoteFilterSemester, setAdminNoteFilterSemester] = useState<string>("All");
  const [adminNoteFilterDept, setAdminNoteFilterDept] = useState<string>("All");
  const [adminNoteSearch, setAdminNoteSearch] = useState<string>("");

  // Sync Note HUB from Firestore
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const docRef = doc(db, "settings", "notehub");
      unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (Array.isArray(data.items)) {
              setNoteHubItems(data.items);
            }
          }
        },
        (error) => {
          console.warn("Error fetching NoteHub items in admin:", error);
        }
      );
    } catch (e) {
      console.warn("NoteHub init error in admin:", e);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleSaveNoteHubToFirestore = async (newItems: NoteHubItem[]) => {
    setIsSavingNoteHub(true);
    try {
      const docRef = doc(db, "settings", "notehub");
      await setDoc(docRef, { items: newItems, updatedAt: new Date().toISOString() }, { merge: true });
      setSaveToast({ type: "success", msg: "Note HUB resources published live!" });
    } catch (err: any) {
      console.error("Failed to save Note HUB:", err);
      setSaveToast({ type: "error", msg: `Failed to save Note HUB: ${err.message}` });
    } finally {
      setIsSavingNoteHub(false);
    }
  };

  const handleAddOrUpdateNoteItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.title.trim() || !noteForm.fileUrl.trim()) {
      setSaveToast({ type: "error", msg: "Please fill in title and valid file URL link!" });
      return;
    }

    let updatedList: NoteHubItem[];
    if (editingNoteId) {
      // Edit existing
      updatedList = noteHubItems.map(item => item.id === editingNoteId ? {
        ...item,
        ...noteForm,
        dateAdded: item.dateAdded || new Date().toLocaleDateString('en-GB')
      } : item);
      setEditingNoteId(null);
    } else {
      // Add new
      const newItem: NoteHubItem = {
        id: `nh-${Date.now()}`,
        ...noteForm,
        dateAdded: new Date().toLocaleDateString('en-GB'),
        uploadedBy: currentUser?.email || "Admin"
      };
      updatedList = [newItem, ...noteHubItems];
    }

    setNoteHubItems(updatedList);
    handleSaveNoteHubToFirestore(updatedList);

    // Reset Form
    setNoteForm({
      title: "",
      courseCode: "",
      batch: "",
      authorName: "",
      examType: "SME",
      semester: "1st Semester",
      department: "CSE",
      category: "notes",
      fileUrl: "",
      description: "",
      fileType: "Google Drive"
    });
  };

  const handleEditNoteClick = (item: NoteHubItem) => {
    setEditingNoteId(item.id);
    setNoteForm({
      title: item.title,
      courseCode: item.courseCode || "",
      batch: item.batch || "",
      authorName: item.authorName || "",
      examType: item.examType || "SME",
      semester: item.semester,
      department: item.department,
      category: item.category,
      fileUrl: item.fileUrl,
      description: item.description || "",
      fileType: item.fileType || "Google Drive"
    });
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleDeleteNoteClick = (id: string) => {
    if (window.confirm("Are you sure you want to delete this Note HUB item?")) {
      const updatedList = noteHubItems.filter(item => item.id !== id);
      setNoteHubItems(updatedList);
      handleSaveNoteHubToFirestore(updatedList);
    }
  };

  const handleSeedDefaultNotes = () => {
    if (window.confirm("This will load/reset pre-seeded default resources for BUFT semesters and departments. Continue?")) {
      setNoteHubItems(INITIAL_NOTE_HUB_ITEMS);
      handleSaveNoteHubToFirestore(INITIAL_NOTE_HUB_ITEMS);
    }
  };

  // Auth States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Editable Form States (safely merge loaded config with defaults)
  const [formState, setFormState] = useState<PortalConfig>(() => ({
    ...DEFAULT_PORTAL_CONFIG,
    ...config
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Spreadsheet Test / Sync States
  const [testingClassSheet, setTestingClassSheet] = useState(false);
  const [classSheetResult, setClassSheetResult] = useState<{ success: boolean; msg: string } | null>(null);

  const [testingExamSheet, setTestingExamSheet] = useState(false);
  const [examSheetResult, setExamSheetResult] = useState<{ success: boolean; msg: string } | null>(null);

  const [testingAcademicCalendarSheet, setTestingAcademicCalendarSheet] = useState(false);
  const [academicCalendarSheetResult, setAcademicCalendarSheetResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync Admin Profiles from Firestore
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const docRef = doc(db, "settings", "admin_profiles");
      unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (Array.isArray(data.profiles)) {
              setAdminProfiles(data.profiles);
            }
          }
        },
        (error) => {
          console.warn("Error fetching Admin Profiles in admin:", error);
        }
      );
    } catch (e) {
      console.warn("Admin profiles init error in admin:", e);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Compute Active Admin Profile & Permissions
  const currentAdminProfile: AdminProfile = useMemo(() => {
    if (!currentUser?.email) {
      return {
        id: "superadmin-default",
        email: "admin@buft.edu.bd",
        name: "Super Administrator",
        role: "superadmin",
        allowedTabs: ["routines", "notehub", "broadcast", "portal", "features", "status", "admins"],
        allowedFields: {
          canEditClassRoutine: true,
          canEditExamRoutine: true,
          canEditAcademicCalendar: true,
          canManageNoteHub: true,
          canEditBroadcastBanner: true,
          canEditPortalBranding: true,
          canEditQuickLinks: true,
          canEditFeatureToggles: true,
          canEditMaintenanceMode: true,
          canManageAdmins: true,
        },
        createdAt: new Date().toISOString()
      };
    }

    const matched = adminProfiles.find(p => p.email.toLowerCase() === currentUser.email?.toLowerCase());
    if (matched) return matched;

    return {
      id: `admin-${currentUser.uid}`,
      email: currentUser.email,
      name: currentUser.displayName || currentUser.email.split("@")[0],
      role: "superadmin",
      allowedTabs: ["routines", "notehub", "broadcast", "portal", "features", "status", "admins"],
      allowedFields: {
        canEditClassRoutine: true,
        canEditExamRoutine: true,
        canEditAcademicCalendar: true,
        canManageNoteHub: true,
        canEditBroadcastBanner: true,
        canEditPortalBranding: true,
        canEditQuickLinks: true,
        canEditFeatureToggles: true,
        canEditMaintenanceMode: true,
        canManageAdmins: true,
      },
      createdAt: new Date().toISOString()
    };
  }, [currentUser, adminProfiles]);

  const hasTabPermission = (tab: AdminTab) => {
    if (tab === "admins") return true; // All logged in admins can view their own profile tab
    if (currentAdminProfile.role === "superadmin") return true;
    return currentAdminProfile.allowedTabs.includes(tab);
  };

  const hasFieldPermission = (field: keyof AdminFieldPermissions) => {
    if (currentAdminProfile.role === "superadmin") return true;
    return !!currentAdminProfile.allowedFields[field];
  };

  const handleSaveMyName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myNameInput.trim()) return;
    const targetEmail = currentUser?.email?.toLowerCase();
    if (!targetEmail) return;

    let updatedList: AdminProfile[];
    const existingIndex = adminProfiles.findIndex(p => p.email.toLowerCase() === targetEmail);
    if (existingIndex >= 0) {
      updatedList = adminProfiles.map((p, i) => i === existingIndex ? { ...p, name: myNameInput.trim() } : p);
    } else {
      const newProf: AdminProfile = {
        ...currentAdminProfile,
        name: myNameInput.trim()
      };
      updatedList = [newProf, ...adminProfiles];
    }

    setAdminProfiles(updatedList);
    await handleSaveAdminProfilesToFirestore(updatedList);
    setIsEditingMyName(false);
    setSaveToast({ type: "success", msg: "Your profile display name has been updated!" });
  };

  // Redirect if current activeTab is not allowed for logged in user
  useEffect(() => {
    if (!hasTabPermission(activeTab)) {
      const allTabs: AdminTab[] = ["routines", "notehub", "broadcast", "portal", "features", "status", "admins"];
      const allowed = allTabs.find(tab => hasTabPermission(tab));
      if (allowed) setActiveTab(allowed);
    }
  }, [currentAdminProfile, activeTab]);

  const handleSaveAdminProfilesToFirestore = async (newProfiles: AdminProfile[]) => {
    setIsSavingProfiles(true);
    try {
      const docRef = doc(db, "settings", "admin_profiles");
      await setDoc(docRef, { profiles: newProfiles, updatedAt: new Date().toISOString() }, { merge: true });
      setSaveToast({ type: "success", msg: "Admin Profiles & Field Permissions updated live!" });
    } catch (err: any) {
      console.error("Failed to save Admin Profiles:", err);
      setSaveToast({ type: "error", msg: `Failed to save Admin Profiles: ${err.message}` });
    } finally {
      setIsSavingProfiles(false);
    }
  };

  const handleAddOrUpdateAdminProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminForm.email.trim() || !adminForm.name.trim()) {
      setSaveToast({ type: "error", msg: "Please enter a valid admin email and full name." });
      return;
    }

    let updatedList: AdminProfile[];
    if (editingAdminId) {
      updatedList = adminProfiles.map(p => p.id === editingAdminId ? {
        ...p,
        ...adminForm,
        email: adminForm.email.trim().toLowerCase(),
        updatedAt: new Date().toISOString()
      } : p);
      setEditingAdminId(null);
    } else {
      const newProfile: AdminProfile = {
        id: `prof-${Date.now()}`,
        ...adminForm,
        email: adminForm.email.trim().toLowerCase(),
        createdAt: new Date().toISOString(),
        createdByUser: currentUser?.email || "Super Admin"
      };
      updatedList = [newProfile, ...adminProfiles];
    }

    setAdminProfiles(updatedList);
    handleSaveAdminProfilesToFirestore(updatedList);

    setAdminForm({
      email: "",
      name: "",
      role: "editor",
      allowedTabs: ["routines", "notehub"],
      allowedFields: {
        canEditClassRoutine: true,
        canEditExamRoutine: true,
        canManageNoteHub: true,
        canEditBroadcastBanner: false,
        canEditPortalBranding: false,
        canEditQuickLinks: false,
        canEditFeatureToggles: false,
        canEditMaintenanceMode: false,
        canManageAdmins: false,
      }
    });
  };

  const handleEditAdminClick = (prof: AdminProfile) => {
    setEditingAdminId(prof.id);
    setAdminForm({
      email: prof.email,
      name: prof.name,
      role: prof.role,
      allowedTabs: prof.allowedTabs || ["routines", "notehub"],
      allowedFields: prof.allowedFields || {
        canEditClassRoutine: true,
        canEditExamRoutine: true,
        canManageNoteHub: true,
        canEditBroadcastBanner: false,
        canEditPortalBranding: false,
        canEditQuickLinks: false,
        canEditFeatureToggles: false,
        canEditMaintenanceMode: false,
        canManageAdmins: false,
      }
    });
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleDeleteAdminClick = (id: string, profileEmail: string) => {
    if (profileEmail.toLowerCase() === currentUser?.email?.toLowerCase()) {
      alert("You cannot delete your own logged-in admin profile!");
      return;
    }
    if (window.confirm(`Are you sure you want to delete admin profile for ${profileEmail}?`)) {
      const updatedList = adminProfiles.filter(p => p.id !== id);
      setAdminProfiles(updatedList);
      handleSaveAdminProfilesToFirestore(updatedList);
    }
  };

  const applyPreset = (preset: "superadmin" | "routines_only" | "notehub_only" | "broadcast_only") => {
    if (preset === "superadmin") {
      setAdminForm(prev => ({
        ...prev,
        role: "superadmin",
        allowedTabs: ["routines", "notehub", "broadcast", "portal", "features", "status", "admins"],
        allowedFields: {
          canEditClassRoutine: true,
          canEditExamRoutine: true,
          canManageNoteHub: true,
          canEditBroadcastBanner: true,
          canEditPortalBranding: true,
          canEditQuickLinks: true,
          canEditFeatureToggles: true,
          canEditMaintenanceMode: true,
          canManageAdmins: true,
        }
      }));
    } else if (preset === "routines_only") {
      setAdminForm(prev => ({
        ...prev,
        role: "editor",
        allowedTabs: ["routines"],
        allowedFields: {
          canEditClassRoutine: true,
          canEditExamRoutine: true,
          canManageNoteHub: false,
          canEditBroadcastBanner: false,
          canEditPortalBranding: false,
          canEditQuickLinks: false,
          canEditFeatureToggles: false,
          canEditMaintenanceMode: false,
          canManageAdmins: false,
        }
      }));
    } else if (preset === "notehub_only") {
      setAdminForm(prev => ({
        ...prev,
        role: "editor",
        allowedTabs: ["notehub"],
        allowedFields: {
          canEditClassRoutine: false,
          canEditExamRoutine: false,
          canManageNoteHub: true,
          canEditBroadcastBanner: false,
          canEditPortalBranding: false,
          canEditQuickLinks: false,
          canEditFeatureToggles: false,
          canEditMaintenanceMode: false,
          canManageAdmins: false,
        }
      }));
    } else if (preset === "broadcast_only") {
      setAdminForm(prev => ({
        ...prev,
        role: "editor",
        allowedTabs: ["broadcast"],
        allowedFields: {
          canEditClassRoutine: false,
          canEditExamRoutine: false,
          canManageNoteHub: false,
          canEditBroadcastBanner: true,
          canEditPortalBranding: false,
          canEditQuickLinks: false,
          canEditFeatureToggles: false,
          canEditMaintenanceMode: false,
          canManageAdmins: false,
        }
      }));
    }
  };

  // Keep form state in sync with loaded Firestore config
  useEffect(() => {
    if (config) {
      setFormState({
        ...DEFAULT_PORTAL_CONFIG,
        ...config
      });
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
        msg: "All configurations published successfully! Public portal updated in real-time."
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

  // Helper to set today's date string in DD/MM/YYYY
  const getTodayFormatted = (): string => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
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
      if (lines.length > 0) {
        setClassSheetResult({
          success: true,
          msg: `Connected successfully! Automatically loaded ${lines.length} rows from Google Sheet.`
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
      if (lines.length > 0) {
        setExamSheetResult({
          success: true,
          msg: `Connected successfully! Automatically loaded ${lines.length} rows from Google Sheet.`
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

  // Test Academic Calendar Spreadsheet
  const handleTestAcademicCalendarSheet = async () => {
    setTestingAcademicCalendarSheet(true);
    setAcademicCalendarSheetResult(null);

    const sheetUrl = formState.academicCalendarSheetUrl?.trim();
    if (!sheetUrl) {
      setAcademicCalendarSheetResult({ success: false, msg: "Spreadsheet URL is empty or invalid." });
      setTestingAcademicCalendarSheet(false);
      return;
    }

    try {
      const text = await fetchCSVFromGoogleSheet(sheetUrl);
      const lines = text.split("\n").filter(l => l.trim().length > 0);
      if (lines.length > 0) {
        setAcademicCalendarSheetResult({
          success: true,
          msg: `Connected successfully! Automatically loaded ${lines.length} rows from Google Sheet.`
        });
      } else {
        setAcademicCalendarSheetResult({
          success: false,
          msg: "Spreadsheet reached, but appears empty or lacks calendar schedule data."
        });
      }
    } catch (err: any) {
      setAcademicCalendarSheetResult({
        success: false,
        msg: `Failed to fetch CSV: ${err.message || "Make sure Google Sheet access is set to 'Anyone with the link'."}`
      });
    } finally {
      setTestingAcademicCalendarSheet(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 select-none font-sans">
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
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-white leading-tight">
                BUFT HUB Admin Controller
              </h1>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Live Firestore
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                currentAdminProfile.role === "superadmin"
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                  : "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
              }`}>
                {currentAdminProfile.role === "superadmin" ? "🛡️ Super Admin" : "🔑 Custom Editor"}
              </span>

              {/* Transferred Admin Profiles & Access button */}
              <button
                type="button"
                onClick={() => setActiveTab("admins")}
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === "admins"
                    ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-950/50"
                    : "bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border-indigo-500/30"
                }`}
                title="View Admin Profile & Permissions"
              >
                <UserCheck className="w-3 h-3 text-indigo-400" />
                <span>{(currentAdminProfile.role === "superadmin" || currentAdminProfile.allowedFields?.canManageAdmins) ? "Admin Profiles & Access" : "My Admin Profile"}</span>
              </button>
            </div>

            <p className="text-xs text-slate-400 hidden sm:flex items-center gap-2 mt-0.5">
              <span>Logged in as <span className="text-emerald-400 font-mono">{currentUser.email}</span></span>
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
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Save Toast Notification */}
        <AnimatePresence>
          {saveToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-2xl border text-sm flex items-start justify-between gap-3 shadow-xl ${
                saveToast.type === "success" 
                  ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200" 
                  : "bg-rose-950/90 border-rose-500/40 text-rose-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {saveToast.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span className="font-medium">{saveToast.msg}</span>
              </div>
              <button 
                onClick={() => setSaveToast(null)}
                className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-lg leading-none"
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Control Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">No-Code Live Admin Controls</span>
              </div>
              <h2 className="text-xl font-bold text-white">
                Live Portal Settings & Routine Manager
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Configure routine Google Sheets, emergency notices, portal branding, links, and feature toggles. All changes update instantly on the public website without code redeployments!
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

        {/* Tab Navigation Menu */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 text-xs font-medium no-scrollbar">
          {hasTabPermission("routines") && (
            <button
              onClick={() => setActiveTab("routines")}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "routines"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold shadow-inner"
                  : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Class & Exam Routines</span>
            </button>
          )}

          {hasTabPermission("notehub") && (
            <button
              onClick={() => setActiveTab("notehub")}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "notehub"
                  ? "bg-teal-500/20 text-teal-400 border border-teal-500/30 font-semibold shadow-inner"
                  : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Note HUB Manager</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono">
                {noteHubItems.length}
              </span>
            </button>
          )}

          {hasTabPermission("broadcast") && (
            <button
              onClick={() => setActiveTab("broadcast")}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "broadcast"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold shadow-inner"
                  : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Broadcast Notice Banner</span>
              {formState.noticeBannerEnabled && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          )}

          {hasTabPermission("portal") && (
            <button
              onClick={() => setActiveTab("portal")}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "portal"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold shadow-inner"
                  : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Portal Info & Quick Links</span>
            </button>
          )}

          {hasTabPermission("features") && (
            <button
              onClick={() => setActiveTab("features")}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "features"
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30 font-semibold shadow-inner"
                  : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Features & Maintenance</span>
              {formState.maintenanceMode && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Maintenance
                </span>
              )}
            </button>
          )}

          {hasTabPermission("status") && (
            <button
              onClick={() => setActiveTab("status")}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "status"
                  ? "bg-teal-500/20 text-teal-400 border border-teal-500/30 font-semibold shadow-inner"
                  : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>System Status</span>
            </button>
          )}

          {hasTabPermission("admins") && (
            <button
              onClick={() => setActiveTab("admins")}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "admins"
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold shadow-inner"
                  : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>{(currentAdminProfile.role === "superadmin" || currentAdminProfile.allowedFields?.canManageAdmins) ? "Admin Profiles & Access" : "My Admin Profile"}</span>
              {(currentAdminProfile.role === "superadmin" || currentAdminProfile.allowedFields?.canManageAdmins) && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                  {adminProfiles.length || 1}
                </span>
              )}
            </button>
          )}
        </div>

        {/* TAB 1: ROUTINES & SPREADSHEETS */}
        {activeTab === "routines" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* CLASS ROUTINE CONFIGURATION */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Class Routine Settings</h3>
                    <p className="text-xs text-slate-400">Weekly timetable Google Sheet & semester details</p>
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
                    <span>Google Sheet CSV / Edit Link</span>
                    <a 
                      href={formState.classRoutineSheetUrl || "#"} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                    >
                      Open Sheet <ExternalLink className="w-3 h-3" />
                    </a>
                  </label>
                  <input
                    type="text"
                    value={formState.classRoutineSheetUrl}
                    onChange={(e) => setFormState({ ...formState, classRoutineSheetUrl: e.target.value })}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl py-2.5 px-3 text-xs text-slate-100 font-mono placeholder-slate-600 transition-colors outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Paste standard Google Sheet link. Ensure sharing is set to "Anyone with the link".
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
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-slate-300">
                        Last Updated Date
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormState({ ...formState, classRoutineLastUpdate: getTodayFormatted() })}
                        className="text-[10px] text-blue-400 hover:underline cursor-pointer"
                      >
                        Set Today
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formState.classRoutineLastUpdate}
                      onChange={(e) => setFormState({ ...formState, classRoutineLastUpdate: e.target.value })}
                      placeholder="14/07/2026"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-xs text-slate-100 transition-colors outline-none"
                    />
                  </div>
                </div>

                {/* Custom Class Routine Notice */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Custom Class Routine Notice (Optional)
                  </label>
                  <input
                    type="text"
                    value={formState.classRoutineNotice || ""}
                    onChange={(e) => setFormState({ ...formState, classRoutineNotice: e.target.value })}
                    placeholder="e.g. Note: Room 809 has been temporarily shifted to Lab 3."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-600 transition-colors outline-none"
                  />
                </div>
              </div>
            </div>

            {/* EXAM ROUTINE CONFIGURATION */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Exam Routine Settings</h3>
                    <p className="text-xs text-slate-400">Midterm & Final exam schedules Google Sheet</p>
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
                    <span>Google Sheet CSV / Edit Link</span>
                    <a 
                      href={formState.examRoutineSheetUrl || "#"} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-[11px] text-purple-400 hover:underline flex items-center gap-1"
                    >
                      Open Sheet <ExternalLink className="w-3 h-3" />
                    </a>
                  </label>
                  <input
                    type="text"
                    value={formState.examRoutineSheetUrl}
                    onChange={(e) => setFormState({ ...formState, examRoutineSheetUrl: e.target.value })}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
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

                {/* Custom Exam Routine Notice */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Custom Exam Notice (Optional)
                  </label>
                  <input
                    type="text"
                    value={formState.examNotice || ""}
                    onChange={(e) => setFormState({ ...formState, examNotice: e.target.value })}
                    placeholder="e.g. Admit cards must be verified by department head."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-600 transition-colors outline-none"
                  />
                </div>
              </div>
            </div>

            {/* ACADEMIC CALENDAR CONFIGURATION */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Academic Calendar Settings</h3>
                    <p className="text-xs text-slate-400">Academic events & term schedule Google Sheet</p>
                  </div>
                </div>

                <span className="text-[10px] px-2 py-1 rounded-md bg-teal-500/10 text-teal-300 font-mono">
                  Academic Calendar
                </span>
              </div>

              <div className="space-y-4">
                {/* Sheet URL */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Google Sheet CSV / Edit Link</span>
                    <a 
                      href={formState.academicCalendarSheetUrl || "#"} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-[11px] text-teal-400 hover:underline flex items-center gap-1"
                    >
                      Open Sheet <ExternalLink className="w-3 h-3" />
                    </a>
                  </label>
                  <input
                    type="text"
                    value={formState.academicCalendarSheetUrl || ""}
                    onChange={(e) => setFormState({ ...formState, academicCalendarSheetUrl: e.target.value })}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl py-2.5 px-3 text-xs text-slate-100 font-mono placeholder-slate-600 transition-colors outline-none"
                  />
                </div>

                {/* Test Academic Calendar Spreadsheet Button */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleTestAcademicCalendarSheet}
                    disabled={testingAcademicCalendarSheet}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {testingAcademicCalendarSheet ? <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" /> : <RefreshCw className="w-3.5 h-3.5 text-teal-400" />}
                    <span>Test Connection</span>
                  </button>

                  {academicCalendarSheetResult && (
                    <span className={`text-xs flex items-center gap-1.5 ${academicCalendarSheetResult.success ? "text-emerald-400" : "text-rose-400"}`}>
                      {academicCalendarSheetResult.success ? <Check className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                      {academicCalendarSheetResult.msg}
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
                      value={formState.academicCalendarSemester || ""}
                      onChange={(e) => setFormState({ ...formState, academicCalendarSemester: e.target.value })}
                      placeholder="Spring 2026 (261)"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl py-2 px-3 text-xs text-slate-100 transition-colors outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-slate-300">
                        Last Updated Date
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormState({ ...formState, academicCalendarLastUpdate: getTodayFormatted() })}
                        className="text-[10px] text-teal-400 hover:underline cursor-pointer"
                      >
                        Set Today
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formState.academicCalendarLastUpdate || ""}
                      onChange={(e) => setFormState({ ...formState, academicCalendarLastUpdate: e.target.value })}
                      placeholder="14/07/2026"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl py-2 px-3 text-xs text-slate-100 transition-colors outline-none"
                    />
                  </div>
                </div>

                {/* Custom Academic Calendar Notice */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Custom Calendar Notice (Optional)
                  </label>
                  <input
                    type="text"
                    value={formState.academicCalendarNotice || ""}
                    onChange={(e) => setFormState({ ...formState, academicCalendarNotice: e.target.value })}
                    placeholder="e.g. Midterm exam dates are subject to faculty confirmation."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-600 transition-colors outline-none"
                  />
                </div>

                {/* Show Export PDF Toggle */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-semibold text-slate-200">Show Export PDF Button</span>
                    <span className="block text-[11px] text-slate-400">Enable or hide the 'Export PDF' button on the Academic Calendar page.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.showAcademicCalendarExportPdf ?? false}
                      onChange={(e) => setFormState({ ...formState, showAcademicCalendarExportPdf: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BROADCAST NOTICE BANNER */}
        {activeTab === "broadcast" && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Top Broadcast Notice Banner</h3>
                  <p className="text-xs text-slate-400">Display an urgent alert or announcement bar across all portal pages</p>
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

            <div className="space-y-4">
              {/* Style / Color Picker */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Banner Alert Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {[
                    { id: "info", label: "Info Blue", color: "border-blue-500/50 bg-blue-950/40 text-blue-300" },
                    { id: "warning", label: "Warning Amber", color: "border-amber-500/50 bg-amber-950/40 text-amber-300" },
                    { id: "alert", label: "Alert Red", color: "border-rose-500/50 bg-rose-950/40 text-rose-300" },
                    { id: "success", label: "Success Green", color: "border-emerald-500/50 bg-emerald-950/40 text-emerald-300" },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setFormState({ ...formState, noticeBannerType: style.id as any })}
                      className={`p-2.5 rounded-xl border text-center font-medium transition-all cursor-pointer ${style.color} ${
                        (formState.noticeBannerType || "info") === style.id ? "ring-2 ring-white/50 font-bold scale-[1.02]" : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Text Area */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Announcement Text Content
                </label>
                <textarea
                  rows={3}
                  value={formState.noticeBannerText}
                  onChange={(e) => setFormState({ ...formState, noticeBannerText: e.target.value })}
                  placeholder="e.g. 📢 Important Notice: Midterm Examination routine for Spring 2026 has been published! Please verify your course codes."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 transition-colors outline-none resize-none"
                />
              </div>

              {/* Live Preview Card */}
              {formState.noticeBannerEnabled && (
                <div className="pt-2">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Live Student Banner Preview:</p>
                  <div className={`p-3.5 rounded-xl border flex items-start gap-3 shadow-md ${
                    formState.noticeBannerType === "alert" ? "bg-rose-900/30 border-rose-500/40 text-rose-200" :
                    formState.noticeBannerType === "warning" ? "bg-amber-900/30 border-amber-500/40 text-amber-200" :
                    formState.noticeBannerType === "success" ? "bg-emerald-900/30 border-emerald-500/40 text-emerald-200" :
                    "bg-blue-900/30 border-blue-500/40 text-blue-200"
                  }`}>
                    <Bell className="w-4 h-4 shrink-0 mt-0.5 animate-bounce" />
                    <span className="text-xs font-medium leading-relaxed">
                      {formState.noticeBannerText || "No announcement text entered yet."}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PORTAL INFO & QUICK LINKS */}
        {activeTab === "portal" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* BRANDING & CONTACT INFO */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Portal Branding & Information</h3>
                  <p className="text-xs text-slate-400">Header titles, department branding & helpline info</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Portal Title</label>
                  <input
                    type="text"
                    value={formState.portalTitle || ""}
                    onChange={(e) => setFormState({ ...formState, portalTitle: e.target.value })}
                    placeholder="BUFT Academic Hub"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-xs text-slate-100 transition-colors outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">University / Subtitle</label>
                  <input
                    type="text"
                    value={formState.portalSubtitle || ""}
                    onChange={(e) => setFormState({ ...formState, portalSubtitle: e.target.value })}
                    placeholder="BGMEA University of Fashion & Technology — Official Routine & Academic Portal"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-xs text-slate-100 transition-colors outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Support Email</label>
                    <input
                      type="email"
                      value={formState.contactEmail || ""}
                      onChange={(e) => setFormState({ ...formState, contactEmail: e.target.value })}
                      placeholder="academic@buft.edu.bd"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-xs text-slate-100 transition-colors outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Helpline Phone</label>
                    <input
                      type="text"
                      value={formState.helplinePhone || ""}
                      onChange={(e) => setFormState({ ...formState, helplinePhone: e.target.value })}
                      placeholder="+880 9678-002838"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl py-2 px-3 text-xs text-slate-100 transition-colors outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* EXTERNAL QUICK LINKS */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">External Quick Links</h3>
                  <p className="text-xs text-slate-400">Direct resources accessible to students in sidebar & footer</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Google Drive Routine Archive URL</label>
                  <input
                    type="text"
                    value={formState.googleDriveLink || ""}
                    onChange={(e) => setFormState({ ...formState, googleDriveLink: e.target.value })}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl py-2 px-3 text-xs text-slate-100 font-mono transition-colors outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">University Official Notice Board URL</label>
                  <input
                    type="text"
                    value={formState.noticeBoardUrl || ""}
                    onChange={(e) => setFormState({ ...formState, noticeBoardUrl: e.target.value })}
                    placeholder="https://buft.edu.bd/notice"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl py-2 px-3 text-xs text-slate-100 font-mono transition-colors outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Bus / Transport Schedule PDF URL</label>
                  <input
                    type="text"
                    value={formState.busScheduleUrl || ""}
                    onChange={(e) => setFormState({ ...formState, busScheduleUrl: e.target.value })}
                    placeholder="https://buft.edu.bd/transport"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl py-2 px-3 text-xs text-slate-100 font-mono transition-colors outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FEATURE MODULE TOGGLES & MAINTENANCE */}
        {activeTab === "features" && (
          <div className="space-y-8">
            {/* MAINTENANCE MODE */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Emergency Maintenance Mode</h3>
                    <p className="text-xs text-slate-400">Lock public portal with a maintenance alert during major updates</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formState.maintenanceMode || false}
                    onChange={(e) => setFormState({ ...formState, maintenanceMode: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Maintenance Message to Display
                </label>
                <textarea
                  rows={2}
                  value={formState.maintenanceMessage || ""}
                  onChange={(e) => setFormState({ ...formState, maintenanceMessage: e.target.value })}
                  placeholder="The portal is currently undergoing scheduled updates. Please check back shortly."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 transition-colors outline-none resize-none"
                />
              </div>
            </div>

            {/* FEATURE MODULE TOGGLES */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Module Feature Flags</h3>
                  <p className="text-xs text-slate-400">Enable or disable specific portal tools dynamically</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: "enableClassRoutine", title: "Class Routine Viewer", desc: "Allow students to search and view weekly class timetables", icon: GraduationCap },
                  { key: "enableExamRoutine", title: "Exam Routine Viewer", desc: "Allow students to view midterm and final exam schedules", icon: Calendar },
                  { key: "enableAcademicCalendar", title: "Academic Calendar", desc: "Allow students to view academic events, holidays & semester calendar", icon: Calendar },
                  { key: "enableNoteHub", title: "Note HUB Archive", desc: "Allow students to view & download lecture notes, question banks & lab manuals", icon: BookOpen },
                  { key: "enableCgpaCalculator", title: "CGPA Calculator", desc: "Enable SGPA and CGPA weighted credit calculator tool", icon: Zap },
                  { key: "enableCoverPageMaker", title: "Cover Page PDF Maker", desc: "Enable A4 assignment and lab report PDF cover page generator", icon: FileSpreadsheet },
                ].map((mod) => {
                  const Icon = mod.icon;
                  const isEnabled = (formState as any)[mod.key] !== false;
                  return (
                    <div 
                      key={mod.key}
                      className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                        isEnabled ? "bg-slate-900 border-slate-700" : "bg-slate-950/50 border-slate-800/80 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isEnabled ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">{mod.title}</p>
                          <p className="text-[11px] text-slate-400">{mod.desc}</p>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input 
                          type="checkbox" 
                          checked={isEnabled}
                          onChange={(e) => setFormState({ ...formState, [mod.key]: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: NOTE HUB MANAGEMENT */}
        {activeTab === "notehub" && (
          <div className="space-y-8">
            {/* ADD / EDIT NOTE RESOURCE FORM */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {editingNoteId ? "Edit Note HUB Resource" : "Add New Note HUB Resource"}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Upload lecture notes, question archives, or lab report files accessible to students
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSeedDefaultNotes}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-teal-400" />
                    <span>Reset / Seed Defaults</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddOrUpdateNoteItem} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Resource Title / Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={noteForm.title}
                      onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                      placeholder="e.g. C Programming Lecture Notes & Slides"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl py-2.5 px-3.5 text-xs text-slate-100 placeholder-slate-600 transition-colors outline-none"
                    />
                  </div>

                  {/* Course Code */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Course Code (Optional)
                    </label>
                    <input
                      type="text"
                      value={noteForm.courseCode}
                      onChange={(e) => setNoteForm({ ...noteForm, courseCode: e.target.value })}
                      placeholder="e.g. CSE 1101"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl py-2.5 px-3.5 text-xs text-slate-100 placeholder-slate-600 transition-colors outline-none font-mono"
                    />
                  </div>

                  {/* Category (Note Hub, Questions Hub, Lab Reports Hub) */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Hub Option / Category *
                    </label>
                    <select
                      value={noteForm.category}
                      onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value as NoteCategory })}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl py-2.5 px-3.5 text-xs text-slate-100 transition-colors outline-none cursor-pointer"
                    >
                      <option value="notes">1. Note Hub (Lecture Notes & Handouts)</option>
                      <option value="questions">2. Questions Hub (Midterm & Final Exam Questions)</option>
                      <option value="lab_reports">3. Lab Reports Hub (Lab Experiment Manuals & Reports)</option>
                    </select>
                  </div>

                  {/* Dynamic Fields Based On Category */}
                  {(noteForm.category === "notes" || noteForm.category === "lab_reports") && (
                    <div>
                      <label className="block text-xs font-medium text-teal-300 mb-1.5">
                        Author / Owner Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={noteForm.authorName}
                        onChange={(e) => setNoteForm({ ...noteForm, authorName: e.target.value })}
                        placeholder="e.g. Ahsan Habib Tamim (TE 242) or Dr. Alimul Haque"
                        className="w-full bg-slate-950 border border-teal-500/40 focus:border-teal-400 rounded-xl py-2.5 px-3.5 text-xs text-slate-100 placeholder-slate-600 transition-colors outline-none"
                      />
                    </div>
                  )}

                  {noteForm.category === "questions" && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-amber-300 mb-1.5">
                          Exam Category (SME vs SEE) *
                        </label>
                        <select
                          value={noteForm.examType}
                          onChange={(e) => setNoteForm({ ...noteForm, examType: e.target.value as ExamType })}
                          className="w-full bg-slate-950 border border-amber-500/40 focus:border-amber-400 rounded-xl py-2.5 px-3.5 text-xs text-slate-100 transition-colors outline-none cursor-pointer font-bold"
                        >
                          <option value="SME">SME (Sessional / Midterm Examination)</option>
                          <option value="SEE">SEE (Semester End Examination)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-amber-300 mb-1.5">
                          Batch Number / Term (e.g. Batch 251)
                        </label>
                        <input
                          type="text"
                          value={noteForm.batch}
                          onChange={(e) => setNoteForm({ ...noteForm, batch: e.target.value })}
                          placeholder="e.g. Batch 251"
                          className="w-full bg-slate-950 border border-amber-500/40 focus:border-amber-400 rounded-xl py-2.5 px-3.5 text-xs text-slate-100 placeholder-slate-600 transition-colors outline-none font-mono"
                        />
                      </div>
                    </>
                  )}

                  {/* Semester */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Semester *
                    </label>
                    <select
                      value={noteForm.semester}
                      onChange={(e) => setNoteForm({ ...noteForm, semester: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl py-2.5 px-3.5 text-xs text-slate-100 transition-colors outline-none cursor-pointer font-bold"
                    >
                      {BUFT_SEMESTERS.map((sem) => (
                        <option key={sem} value={sem}>{sem}</option>
                      ))}
                    </select>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Department *
                    </label>
                    <select
                      value={noteForm.department}
                      onChange={(e) => setNoteForm({ ...noteForm, department: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl py-2.5 px-3.5 text-xs text-slate-100 transition-colors outline-none cursor-pointer"
                    >
                      {BUFT_DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  {/* File URL */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      File / Google Drive Link URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={noteForm.fileUrl}
                      onChange={(e) => setNoteForm({ ...noteForm, fileUrl: e.target.value })}
                      placeholder="https://drive.google.com/drive/folders/... or PDF Link"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl py-2.5 px-3.5 text-xs text-slate-100 placeholder-slate-600 transition-colors outline-none font-mono"
                    />
                  </div>

                  {/* File Type & Description */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      File Format Label
                    </label>
                    <input
                      type="text"
                      value={noteForm.fileType}
                      onChange={(e) => setNoteForm({ ...noteForm, fileType: e.target.value })}
                      placeholder="e.g. Google Drive, PDF, Zip Archive"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl py-2.5 px-3.5 text-xs text-slate-100 placeholder-slate-600 transition-colors outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Short Description
                    </label>
                    <input
                      type="text"
                      value={noteForm.description}
                      onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })}
                      placeholder="Brief topic highlights or instructions..."
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl py-2.5 px-3.5 text-xs text-slate-100 placeholder-slate-600 transition-colors outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                  {editingNoteId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNoteId(null);
                        setNoteForm({
                          title: "",
                          courseCode: "",
                          semester: "1st Semester",
                          department: "CSE",
                          category: "notes",
                          fileUrl: "",
                          description: "",
                          fileType: "Google Drive"
                        });
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isSavingNoteHub}
                    className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-teal-950/50 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isSavingNoteHub ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>{editingNoteId ? "Update Resource" : "Add Resource Live"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* EXISTING NOTE HUB ITEMS TABLE / LIST */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Uploaded Note HUB Resources ({noteHubItems.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Manage and filter existing academic notes, question banks, and lab reports
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={adminNoteFilterSemester}
                    onChange={(e) => setAdminNoteFilterSemester(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 outline-none cursor-pointer"
                  >
                    <option value="All">All Semesters</option>
                    {BUFT_SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>

                  <select
                    value={adminNoteFilterDept}
                    onChange={(e) => setAdminNoteFilterDept(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 outline-none cursor-pointer"
                  >
                    <option value="All">All Departments</option>
                    {BUFT_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>

                  <input
                    type="text"
                    value={adminNoteSearch}
                    onChange={(e) => setAdminNoteSearch(e.target.value)}
                    placeholder="Search..."
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 outline-none w-32 focus:w-48 transition-all"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {noteHubItems
                  .filter((item) => {
                    const matchSem = adminNoteFilterSemester === "All" || item.semester === adminNoteFilterSemester;
                    const matchDept = adminNoteFilterDept === "All" || item.department === adminNoteFilterDept;
                    const matchQuery = !adminNoteSearch || item.title.toLowerCase().includes(adminNoteSearch.toLowerCase()) || (item.courseCode && item.courseCode.toLowerCase().includes(adminNoteSearch.toLowerCase()));
                    return matchSem && matchDept && matchQuery;
                  })
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            item.category === "notes" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" :
                            item.category === "questions" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                            "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          }`}>
                            {item.category === "notes" ? "Note" : item.category === "questions" ? "Question" : "Lab Report"}
                          </span>

                          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                            {item.semester} • {item.department}
                          </span>

                          {item.courseCode && (
                            <span className="text-xs font-mono text-emerald-400">
                              [{item.courseCode}]
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                        )}
                        <p className="text-[10px] text-slate-500 font-mono truncate max-w-lg">
                          Link: {item.fileUrl}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Open Link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        <button
                          onClick={() => handleEditNoteClick(item)}
                          className="p-2 rounded-lg bg-slate-900 text-teal-400 hover:bg-teal-500/20 transition-colors cursor-pointer"
                          title="Edit Resource"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteNoteClick(item.id)}
                          className="p-2 rounded-lg bg-slate-900 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                          title="Delete Resource"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SYSTEM STATUS & LOGS */}
        {activeTab === "status" && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">System Diagnostics & Sync Status</h3>
                  <p className="text-xs text-slate-400">Database health, last admin publisher, and active configurations</p>
                </div>
              </div>

              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Operational
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Firestore Database</p>
                <p className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Connected Live
                </p>
                <p className="text-[11px] text-slate-500 font-mono truncate">Doc: settings/config</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Last Configuration Sync</p>
                <p className="text-sm font-bold text-slate-200">
                  {formState.updatedAt ? new Date(formState.updatedAt).toLocaleDateString() : "Default Config"}
                </p>
                <p className="text-[11px] text-slate-400 font-mono truncate">
                  By: {formState.updatedBy || currentUser.email}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Active Broadcast Alert</p>
                <p className={`text-sm font-bold ${formState.noticeBannerEnabled ? "text-amber-400" : "text-slate-500"}`}>
                  {formState.noticeBannerEnabled ? "Banner Active" : "Disabled"}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {formState.noticeBannerText || "No broadcast set"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: ADMIN PROFILES & GRANULAR FIELD ACCESS CONTROL */}
        {activeTab === "admins" && (
          <div className="space-y-8">
            {/* LOGGED IN ADMIN PROFILE INFORMATION CARD (VISIBLE TO ALL LOGGED IN ADMINS) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-950/50 border border-indigo-400/30 shrink-0">
                    {currentAdminProfile.name ? currentAdminProfile.name.charAt(0).toUpperCase() : "A"}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-white">{currentAdminProfile.name}</h3>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${
                        currentAdminProfile.role === "superadmin"
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                          : "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                      }`}>
                        {currentAdminProfile.role === "superadmin" ? "🛡️ Super Administrator" : "🔑 Custom Admin Editor"}
                      </span>
                    </div>

                    <p className="text-xs text-indigo-300 font-mono flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{currentAdminProfile.email}</span>
                    </p>

                    <p className="text-[11px] text-slate-400 flex items-center gap-2 pt-0.5">
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Authenticated Live Session
                      </span>
                      <span>•</span>
                      <span className="font-mono text-slate-500">ID: {currentAdminProfile.id}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isEditingMyName ? (
                    <button
                      onClick={() => {
                        setMyNameInput(currentAdminProfile.name);
                        setIsEditingMyName(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Edit Display Name</span>
                    </button>
                  ) : (
                    <form onSubmit={handleSaveMyName} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={myNameInput}
                        onChange={(e) => setMyNameInput(e.target.value)}
                        className="bg-slate-950 border border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-white outline-none w-48"
                        placeholder="New display name..."
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingMyName(false)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Account Privileges & Assigned Responsibilities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Accessible Dashboard Sections */}
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Layout className="w-4 h-4 text-indigo-400" />
                    <span>Your Accessible Dashboard Sections ({currentAdminProfile.role === "superadmin" ? "All Unrestricted" : currentAdminProfile.allowedTabs.length})</span>
                  </h4>

                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "routines", label: "Class & Exam Routines" },
                      { key: "notehub", label: "Note HUB Resources" },
                      { key: "broadcast", label: "Broadcast Notice Banner" },
                      { key: "portal", label: "Portal Info & Links" },
                      { key: "features", label: "Features & Maintenance" },
                      { key: "status", label: "System Diagnostics" },
                      { key: "admins", label: "My Admin Profile" }
                    ].map(tab => {
                      const isAllowed = currentAdminProfile.role === "superadmin" || currentAdminProfile.allowedTabs.includes(tab.key as AdminTab);
                      return (
                        <span
                          key={tab.key}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 border ${
                            isAllowed
                              ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                              : "bg-slate-900/50 text-slate-600 border-slate-800 line-through opacity-60"
                          }`}
                        >
                          {isAllowed ? <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> : <Lock className="w-3.5 h-3.5 text-slate-600" />}
                          {tab.label}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Field Editing Rights */}
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-400" />
                    <span>Assigned Field Edit Permissions</span>
                  </h4>

                  <div className="space-y-1.5 text-xs">
                    {[
                      { field: "canEditClassRoutine", label: "Class Routine Sheet URL & Semester Info" },
                      { field: "canEditExamRoutine", label: "Exam Routine Sheet URL & Notices" },
                      { field: "canManageNoteHub", label: "Note HUB Resource Management" },
                      { field: "canEditBroadcastBanner", label: "Broadcast Notice Banner" },
                      { field: "canEditPortalBranding", label: "Portal Branding & Contacts" },
                      { field: "canEditQuickLinks", label: "Quick Links (Drive, Notice Board, Bus)" },
                      { field: "canEditFeatureToggles", label: "Portal Feature Toggles" },
                      { field: "canEditMaintenanceMode", label: "System Maintenance Mode" }
                    ].map(item => {
                      const isGranted = currentAdminProfile.role === "superadmin" || !!currentAdminProfile.allowedFields?.[item.field as keyof AdminFieldPermissions];
                      return (
                        <div key={item.field} className="flex items-center justify-between py-1 border-b border-slate-900 last:border-0">
                          <span className="text-slate-300">{item.label}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                            isGranted ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-900 text-slate-600 border border-slate-800"
                          }`}>
                            {isGranted ? "Granted ✓" : "Restricted 🔒"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* DISCREET / HIDDEN ADMIN MANAGEMENT PANEL (ONLY VISIBLE TO SUPER ADMINS) */}
            {(currentAdminProfile.role === "superadmin" || currentAdminProfile.allowedFields?.canManageAdmins) && (
              <div className="space-y-8 pt-4 border-t border-slate-800/80">
                {/* Header Banner */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">Discreet Access Control & Admin Delegation</h3>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                          Super Admin Exclusive
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                        Quietly create custom admin accounts and grant specific tab visibility or field edit rights. Non-superadmin users will only see their own assigned sections and will not see this permission management panel.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 shrink-0">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span>Configured Admins: <strong className="text-indigo-400">{adminProfiles.length || 1}</strong></span>
                  </div>
                </div>

                {/* Admin Profile Form */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-2.5">
                      <UserPlus className="w-5 h-5 text-indigo-400" />
                      <h4 className="text-sm font-bold text-white">
                        {editingAdminId ? "Edit Admin Profile & Field Access" : "Create New Admin Profile"}
                      </h4>
                    </div>

                    {editingAdminId && (
                      <button
                        onClick={() => {
                          setEditingAdminId(null);
                          setAdminForm({
                            email: "",
                            name: "",
                            role: "editor",
                            allowedTabs: ["routines", "notehub"],
                            allowedFields: {
                              canEditClassRoutine: true,
                              canEditExamRoutine: true,
                              canManageNoteHub: true,
                              canEditBroadcastBanner: false,
                              canEditPortalBranding: false,
                              canEditQuickLinks: false,
                              canEditFeatureToggles: false,
                              canEditMaintenanceMode: false,
                              canManageAdmins: false,
                            }
                          });
                        }}
                        className="text-xs text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Cancel Editing
                      </button>
                    )}
                  </div>

                  {/* Quick Preset Shortcuts */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Quick Access Presets:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => applyPreset("superadmin")}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Full Super Admin
                      </button>

                      <button
                        type="button"
                        onClick={() => applyPreset("routines_only")}
                        className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Class & Exam Routines Manager
                      </button>

                      <button
                        type="button"
                        onClick={() => applyPreset("notehub_only")}
                        className="px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Note HUB Resources Moderator
                      </button>

                      <button
                        type="button"
                        onClick={() => applyPreset("broadcast_only")}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        Broadcast Notice Editor
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleAddOrUpdateAdminProfile} className="space-y-6">
                    {/* Email, Name, and Role */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Admin Email <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={adminForm.email}
                          onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                          placeholder="e.g. dept.head@buft.edu.bd"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 px-3 text-xs text-slate-100 placeholder-slate-600 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Admin Name / Title <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={adminForm.name}
                          onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                          placeholder="e.g. Dr. Alimul Haque (CSE Department)"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 px-3 text-xs text-slate-100 placeholder-slate-600 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Admin Access Level
                        </label>
                        <select
                          value={adminForm.role}
                          onChange={(e) => {
                            const r = e.target.value as "superadmin" | "editor";
                            if (r === "superadmin") {
                              applyPreset("superadmin");
                            } else {
                              setAdminForm(prev => ({ ...prev, role: "editor" }));
                            }
                          }}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 px-3 text-xs text-slate-100 outline-none"
                        >
                          <option value="superadmin">🛡️ Super Administrator (Unrestricted Access)</option>
                          <option value="editor">🔑 Custom Access Editor (Selected Sections & Fields)</option>
                        </select>
                      </div>
                    </div>

                    {/* Section Visibility (Tabs) */}
                    {adminForm.role === "editor" && (
                      <div className="space-y-4 pt-2 border-t border-slate-800/80">
                        <div>
                          <h5 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                            <Layout className="w-4 h-4 text-indigo-400" />
                            1. Select Allowed Admin Dashboard Tabs:
                          </h5>
                          <p className="text-[11px] text-slate-400">
                            Check the sections this admin can view in their dashboard menu.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                          {[
                            { key: "routines", label: "Class & Exam Routines", icon: Calendar },
                            { key: "notehub", label: "Note HUB Manager", icon: BookOpen },
                            { key: "broadcast", label: "Broadcast Notice Banner", icon: Bell },
                            { key: "portal", label: "Portal Info & Links", icon: Globe },
                            { key: "features", label: "Features & Maintenance", icon: Sliders },
                            { key: "status", label: "System Diagnostics", icon: Activity },
                            { key: "admins", label: "Admin Profiles Management", icon: UserCheck }
                          ].map((tab) => {
                            const isChecked = adminForm.allowedTabs.includes(tab.key as AdminTab);
                            const Icon = tab.icon;
                            return (
                              <label
                                key={tab.key}
                                className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all text-xs font-medium ${
                                  isChecked
                                    ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-200"
                                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setAdminForm(prev => ({ ...prev, allowedTabs: [...prev.allowedTabs, tab.key as AdminTab] }));
                                    } else {
                                      setAdminForm(prev => ({ ...prev, allowedTabs: prev.allowedTabs.filter(t => t !== tab.key) }));
                                    }
                                  }}
                                  className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0"
                                />
                                <Icon className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                                <span className="truncate">{tab.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Specific Field Access Permissions */}
                    {adminForm.role === "editor" && (
                      <div className="space-y-4 pt-4 border-t border-slate-800/80">
                        <div>
                          <h5 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                            <Key className="w-4 h-4 text-emerald-400" />
                            2. Granular Field Edit Permissions:
                          </h5>
                          <p className="text-[11px] text-slate-400">
                            Choose exactly which specific fields this admin is allowed to modify. Unchecked fields will be locked read-only.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {[
                            { field: "canEditClassRoutine", label: "Class Routine Sheet URL & Semester Notices", tab: "Routines" },
                            { field: "canEditExamRoutine", label: "Exam Routine Sheet URL & Exam Notices", tab: "Routines" },
                            { field: "canManageNoteHub", label: "Note HUB Resources (Add / Edit / Delete)", tab: "Note HUB" },
                            { field: "canEditBroadcastBanner", label: "Broadcast Notice Banner Text & Alert Type", tab: "Broadcast" },
                            { field: "canEditPortalBranding", label: "Portal Branding Title, Subtitle & Helpline", tab: "Portal Info" },
                            { field: "canEditQuickLinks", label: "Google Drive, Notice Board & Bus Schedule Links", tab: "Quick Links" },
                            { field: "canEditFeatureToggles", label: "Feature Toggles (CGPA, Cover Maker, etc.)", tab: "Features" },
                            { field: "canEditMaintenanceMode", label: "System Maintenance Mode Toggle & Notice", tab: "Maintenance" },
                            { field: "canManageAdmins", label: "Admin Profiles & Permissions Management", tab: "Admin Roles" }
                          ].map((item) => {
                            const isChecked = !!adminForm.allowedFields[item.field as keyof AdminFieldPermissions];
                            return (
                              <label
                                key={item.field}
                                className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all text-xs ${
                                  isChecked
                                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-200"
                                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const val = e.target.checked;
                                    setAdminForm(prev => ({
                                      ...prev,
                                      allowedFields: {
                                        ...prev.allowedFields,
                                        [item.field]: val
                                      }
                                    }));
                                  }}
                                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                                />
                                <div>
                                  <div className="font-semibold text-slate-100">{item.label}</div>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    Section: {item.tab}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Submit Action */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                      <button
                        type="submit"
                        disabled={isSavingProfiles}
                        className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-medium text-xs shadow-lg shadow-indigo-950/50 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isSavingProfiles ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Saving Admin Profile...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>{editingAdminId ? "Update Admin Profile" : "Save New Admin Profile"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Admin Profiles List */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-2.5">
                      <Users className="w-5 h-5 text-indigo-400" />
                      <h4 className="text-sm font-bold text-white">Configured Admin Accounts ({adminProfiles.length})</h4>
                    </div>
                  </div>

                  {adminProfiles.length === 0 ? (
                    <div className="text-center py-8 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <ShieldAlert className="w-8 h-8 text-indigo-400 mx-auto" />
                      <p className="text-sm font-medium text-slate-300">No custom admin profiles configured yet</p>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Currently operating with default Super Admin access for logged in users. Create custom admin profiles above to assign field-level access rights.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {adminProfiles.map((prof) => {
                        const isSelf = prof.email.toLowerCase() === currentUser?.email?.toLowerCase();
                        return (
                          <div
                            key={prof.id}
                            className={`p-5 rounded-2xl border transition-all space-y-4 ${
                              isSelf
                                ? "bg-slate-950 border-indigo-500/40 shadow-indigo-950/20 shadow-lg"
                                : "bg-slate-950 border-slate-800 hover:border-slate-700"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h5 className="text-sm font-bold text-white">{prof.name}</h5>
                                  {isSelf && (
                                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.2 rounded-full font-mono">
                                      You
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-mono text-indigo-300">{prof.email}</p>
                              </div>

                              <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border shrink-0 ${
                                prof.role === "superadmin"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                  : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                              }`}>
                                {prof.role === "superadmin" ? "🛡️ Super Admin" : "🔑 Custom Editor"}
                              </span>
                            </div>

                            {/* Allowed Sections and Fields Summary */}
                            <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                              <div className="flex items-center gap-1.5 text-slate-400">
                                <Layout className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Allowed Tabs:</span>
                                <span className="text-slate-200 font-medium">
                                  {prof.role === "superadmin" ? "All Sections Unrestricted" : prof.allowedTabs?.join(", ") || "None"}
                                </span>
                              </div>

                              {prof.role === "editor" && prof.allowedFields && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {Object.entries(prof.allowedFields)
                                    .filter(([, allowed]) => allowed)
                                    .map(([key]) => (
                                      <span key={key} className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-mono">
                                        ✓ {key.replace(/^can/, '')}
                                      </span>
                                    ))}
                                </div>
                              )}
                            </div>

                            {/* Footer Controls */}
                            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
                              <span>Added: {new Date(prof.createdAt).toLocaleDateString()}</span>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditAdminClick(prof)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3 text-indigo-400" />
                                  <span>Edit</span>
                                </button>

                                <button
                                  onClick={() => handleDeleteAdminClick(prof.id, prof.email)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

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
                <span>Publishing Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Publish All Changes Live</span>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}

