import React, { createContext, useContext, useEffect, useState } from "react";
import { db, doc, onSnapshot, setDoc } from "../lib/firebase";
import { APP_CONFIG } from "../config";

export interface PortalConfig {
  // Class Routine Settings
  classRoutineSheetUrl: string;
  classRoutineLastUpdate: string;
  classRoutineSemester: string;
  classRoutineNotice: string;
  
  // Exam Routine Settings
  examRoutineSheetUrl: string;
  examRoutineLastUpdate: string;
  examRoutineSemester: string;
  examName: string;
  examNotice: string;
  
  // Notice & Broadcast Banner
  noticeBannerText: string;
  noticeBannerEnabled: boolean;
  noticeBannerType: 'info' | 'warning' | 'alert' | 'success';

  // Portal Branding & Contact Information
  portalTitle: string;
  portalSubtitle: string;
  contactEmail: string;
  helplinePhone: string;
  universityName: string;

  // External Portal & Quick Links
  googleDriveLink: string;
  noticeBoardUrl: string;
  busScheduleUrl: string;

  // Feature Toggles & Maintenance Mode
  maintenanceMode: boolean;
  maintenanceMessage: string;
  enableCgpaCalculator: boolean;
  enableCoverPageMaker: boolean;
  enableClassRoutine: boolean;
  enableExamRoutine: boolean;

  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_PORTAL_CONFIG: PortalConfig = {
  classRoutineSheetUrl: APP_CONFIG.sheetUrl,
  classRoutineLastUpdate: APP_CONFIG.lastUpdateDate,
  classRoutineSemester: APP_CONFIG.semester,
  classRoutineNotice: "",

  examRoutineSheetUrl: "https://docs.google.com/spreadsheets/d/1DcEso5N-DUqfLXcOJxCg5efXJyahZwk4IEdWoGqe0Do/edit?usp=sharing",
  examRoutineLastUpdate: APP_CONFIG.lastUpdateDate,
  examRoutineSemester: "Spring 2026 (261)",
  examName: "SEE",
  examNotice: "",

  noticeBannerText: "",
  noticeBannerEnabled: false,
  noticeBannerType: "info",

  portalTitle: "BUFT Academic Hub",
  portalSubtitle: "BGMEA University of Fashion & Technology — Official Routine & Academic Portal",
  contactEmail: "academic@buft.edu.bd",
  helplinePhone: "+880 9678-002838",
  universityName: "BGMEA University of Fashion & Technology (BUFT)",

  googleDriveLink: "https://drive.google.com",
  noticeBoardUrl: "https://buft.edu.bd/notice",
  busScheduleUrl: "https://buft.edu.bd/transport",

  maintenanceMode: false,
  maintenanceMessage: "The portal is currently undergoing scheduled updates. Please check back shortly.",
  enableCgpaCalculator: true,
  enableCoverPageMaker: true,
  enableClassRoutine: true,
  enableExamRoutine: true,
};

interface AppConfigContextType {
  config: PortalConfig;
  isLoading: boolean;
  isFirebaseAvailable: boolean;
  saveConfig: (newConfig: Partial<PortalConfig>, adminEmail?: string) => Promise<void>;
}

const AppConfigContext = createContext<AppConfigContextType>({
  config: DEFAULT_PORTAL_CONFIG,
  isLoading: true,
  isFirebaseAvailable: true,
  saveConfig: async () => {}
});

export const AppConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<PortalConfig>(DEFAULT_PORTAL_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirebaseAvailable, setIsFirebaseAvailable] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      const configDocRef = doc(db, "settings", "config");
      unsubscribe = onSnapshot(
        configDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as Partial<PortalConfig>;
            setConfig({
              ...DEFAULT_PORTAL_CONFIG,
              ...data
            });
          } else {
            // First time - use defaults
            setConfig(DEFAULT_PORTAL_CONFIG);
          }
          setIsLoading(false);
        },
        (error) => {
          console.warn("Firestore config snapshot listener error, using fallback config:", error);
          setIsLoading(false);
          setIsFirebaseAvailable(false);
        }
      );
    } catch (err) {
      console.warn("Firebase initialization error, using local config fallback:", err);
      setIsLoading(false);
      setIsFirebaseAvailable(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const saveConfig = async (newConfig: Partial<PortalConfig>, adminEmail?: string) => {
    const merged: PortalConfig = {
      ...config,
      ...newConfig,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail || "admin"
    };

    const configDocRef = doc(db, "settings", "config");
    await setDoc(configDocRef, merged, { merge: true });
    setConfig(merged);
  };

  return (
    <AppConfigContext.Provider value={{ config, isLoading, isFirebaseAvailable, saveConfig }}>
      {children}
    </AppConfigContext.Provider>
  );
};

export const useAppConfig = () => useContext(AppConfigContext);
