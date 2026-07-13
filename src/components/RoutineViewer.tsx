import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, 
  GraduationCap, 
  Users, 
  Layers, 
  Download, 
  RefreshCw, 
  Bookmark, 
  BookmarkCheck, 
  Info, 
  Clock, 
  MapPin, 
  User as UserIcon, 
  BookOpen,
  Printer,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { 
  Database, 
  FileSpreadsheet, 
  Check, 
  AlertTriangle, 
  Settings, 
  Wifi, 
  WifiOff,
  CloudLightning
} from "lucide-react";
import { RoutineItem, FilterOptions } from "../routineTypes";
import { getFilterOptions, routineData } from "../data/routineData";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { convertToCSVUrl, parseCSVToRoutine } from "../utils/csvParser";
import { APP_CONFIG } from "../config";

export default function RoutineViewer() {
  const [filters, setFilters] = useState<FilterOptions>({
    department: "",
    batch: "",
    section: "",
    subsection: ""
  });

  const [savedRoutines, setSavedRoutines] = useState<FilterOptions[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"planner" | "saved">("planner");

  // Dynamic Routine Data State (loaded from cache, falling back to compiled local DB)
  const [currentRoutineData, setCurrentRoutineData] = useState<RoutineItem[]>(() => {
    const cached = localStorage.getItem("buft_cached_routine_data");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse cached routine data", e);
      }
    }
    return routineData;
  });

  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [syncMessage, setSyncMessage] = useState<string>("");

  // Dynamic filter helper functions calculated based on current active dataset
  const filterHelpers = React.useMemo(() => {
    const departments = Array.from(new Set(currentRoutineData.map((r) => r.department))).sort();
    
    const getBatchesForDept = (dept: string) => {
      return Array.from(
        new Set(currentRoutineData.filter((r) => r.department === dept).map((r) => r.batch))
      ).sort();
    };

    const getSectionsForDeptBatch = (dept: string, batch: string) => {
      return Array.from(
        new Set(
          currentRoutineData
            .filter((r) => r.department === dept && r.batch === batch)
            .map((r) => r.section)
        )
      ).sort();
    };

    const getSubsectionsForDeptBatchSection = (dept: string, batch: string, sec: string) => {
      return Array.from(
        new Set(
          currentRoutineData
            .filter((r) => r.department === dept && r.batch === batch && r.section === sec)
            .map((r) => r.subsection)
        )
      ).filter(Boolean).sort();
    };

    return {
      departments,
      getBatchesForDept,
      getSectionsForDeptBatch,
      getSubsectionsForDeptBatchSection
    };
  }, [currentRoutineData]);

  // Sync routine data with Google Sheet
  const syncWithGoogleSheet = async () => {
    const targetUrl = APP_CONFIG.sheetUrl;
    if (!targetUrl) {
      setSyncStatus("error");
      setSyncMessage("Spreadsheet URL is not configured.");
      return;
    }

    setSyncStatus("syncing");
    setSyncMessage("Fetching latest schedule from Google Sheets...");

    try {
      const csvUrl = convertToCSVUrl(targetUrl);
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error(`Google Sheets responded with HTTP ${response.status}`);
      }
      const csvText = await response.text();
      if (!csvText || !csvText.includes("Room Number")) {
        throw new Error("Invalid spreadsheet format. Make sure the linked spreadsheet contains 'Room Number'.");
      }

      const parsedItems = parseCSVToRoutine(csvText);
      if (parsedItems.length === 0) {
        throw new Error("Could not parse any class records. Double check your spreadsheet structure.");
      }

      // Sync successful!
      setCurrentRoutineData(parsedItems);
      localStorage.setItem("buft_cached_routine_data", JSON.stringify(parsedItems));
      setSyncStatus("success");
      setSyncMessage(`Successfully loaded ${parsedItems.length.toLocaleString()} classes!`);
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        setSyncStatus("idle");
      }, 5000);
    } catch (err: any) {
      console.error("Google Sheets sync failed:", err);
      setSyncStatus("error");
      setSyncMessage(err.message || "Failed to fetch from Google Sheets. Using local offline database fallback.");
    }
  };

  // Silent sync on first mount to get freshest data
  useEffect(() => {
    syncWithGoogleSheet();
  }, []);

  // Load saved routines from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("buft_saved_routines");
    if (saved) {
      try {
        setSavedRoutines(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading saved routines", e);
      }
    }
  }, []);

  // Update dependent filters when parent filters change
  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dept = e.target.value;
    setFilters({
      department: dept,
      batch: "",
      section: "",
      subsection: ""
    });
  };

  const handleBatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const batch = e.target.value;
    setFilters((prev) => ({
      ...prev,
      batch,
      section: "",
      subsection: ""
    }));
  };

  const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const section = e.target.value;
    setFilters((prev) => ({
      ...prev,
      section,
      subsection: ""
    }));
  };

  const handleSubsectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({
      ...prev,
      subsection: e.target.value
    }));
  };

  const isLabCourse = (courseName: string, courseCode: string) => {
    const name = (courseName || "").toLowerCase();
    const code = (courseCode || "").toLowerCase();
    return (
      name.includes("lab") ||
      name.includes("sessional") ||
      name.includes("practical") ||
      name.includes("studio") ||
      name.includes("drawing") ||
      code.includes("lab") ||
      code.includes("sessional")
    );
  };

  // Filtered routine list with custom logic for theory and lab courses under subsections
  const filteredRoutine = currentRoutineData.filter((item) => {
    if (filters.department && item.department !== filters.department) return false;
    if (filters.batch && item.batch !== filters.batch) return false;
    
    if (filters.section) {
      if (item.section !== filters.section) return false;
      
      if (filters.subsection) {
        // Only format/filter the Lab titled courses for the sub-section
        const isLab = isLabCourse(item.courseName, item.courseCode);
        if (isLab) {
          // Lab course must match subsection
          if (item.subsection !== filters.subsection) return false;
        } else {
          // Theory course: keep all theory courses of this section (subsection mismatch ignored)
        }
      }
    }
    
    return true;
  });

  // Unique list of batches, sections, and subsections based on parent selection
  const availableBatches = filters.department ? filterHelpers.getBatchesForDept(filters.department) : [];
  const availableSections = (filters.department && filters.batch) 
    ? filterHelpers.getSectionsForDeptBatch(filters.department, filters.batch) 
    : [];
  const availableSubsections = (filters.department && filters.batch && filters.section)
    ? filterHelpers.getSubsectionsForDeptBatchSection(filters.department, filters.batch, filters.section)
    : [];

  // Group filtered routine by day in specific academic order (starting from Sunday)
  const dayOrder = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  
  // Helper to parse time slot string (e.g. "09:10 AM-10:25 AM") to minutes for chronological sorting
  const timeSlotToMinutes = (slot: string): number => {
    const match = slot.match(/^(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === "PM" && hours !== 12) {
      hours += 12;
    } else if (ampm === "AM" && hours === 12) {
      hours = 0;
    }
    return hours * 60 + minutes;
  };

  // Extract unique sorted time slots from filtered schedule
  const uniqueTimeSlots = Array.from(new Set<string>(filteredRoutine.map((item) => item.timeSlot)))
    .sort((a: string, b: string) => timeSlotToMinutes(a) - timeSlotToMinutes(b));

  const sortedDays = dayOrder.filter(day => filteredRoutine.some(item => item.day === day));

  const isFilterComplete = filters.department && filters.batch && filters.section;

  // Save current routine to list
  const saveCurrentRoutine = () => {
    if (!isFilterComplete) return;
    
    const isAlreadySaved = savedRoutines.some(
      (r) => 
        r.department === filters.department &&
        r.batch === filters.batch &&
        r.section === filters.section &&
        r.subsection === filters.subsection
    );

    if (isAlreadySaved) return;

    const newList = [...savedRoutines, filters];
    setSavedRoutines(newList);
    localStorage.setItem("buft_saved_routines", JSON.stringify(newList));
  };

  const removeSavedRoutine = (index: number) => {
    const newList = savedRoutines.filter((_, i) => i !== index);
    setSavedRoutines(newList);
    localStorage.setItem("buft_saved_routines", JSON.stringify(newList));
  };

  const loadSavedRoutine = (saved: FilterOptions) => {
    setFilters(saved);
    setActiveTab("planner");
  };

  const resetFilters = () => {
    setFilters({
      department: "",
      batch: "",
      section: "",
      subsection: ""
    });
  };

  // Check if current configuration is saved
  const isCurrentRoutineSaved = savedRoutines.some(
    (r) => 
      r.department === filters.department &&
      r.batch === filters.batch &&
      r.section === filters.section &&
      r.subsection === filters.subsection
  );

  // PDF Export Logic
  const handleExportPDF = async () => {
    if (filteredRoutine.length === 0) return;
    setIsExporting(true);

    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      // Colors matching BUFT Nature Theme
      const primaryColor = [90, 99, 68]; // #5a6344 (Sage Green)
      const secondaryColor = [138, 138, 112]; // #8a8a70 (Moss Warm)

      // Draw BUFT Academic Header Banner
      doc.setFillColor(90, 99, 68);
      doc.rect(0, 0, 297, 34, "F");

      // Draw Academic Accent Line
      doc.setFillColor(138, 138, 112);
      doc.rect(0, 34, 297, 2, "F");

      // Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("BGMEA UNIVERSITY OF FASHION & TECHNOLOGY", 148.5, 11, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Excellence Through Education", 148.5, 17, { align: "center" });
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("STUDENT WEEKLY CLASS ROUTINE", 148.5, 26, { align: "center" });

      // Information Metadata Panel (just before the table)
      doc.setTextColor(51, 51, 51);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      const metadataText = `Department: ${filters.department || "All"}    |    Batch: ${filters.batch || "All"}    |    Section: ${filters.section || "All"}${filters.subsection ? ` - ${filters.subsection}` : ""}    |    ${APP_CONFIG.semester}`;
      doc.text(metadataText, 14, 43);

      // Build Horizontal Day Grid Table Data (Sunday first, and only show active days)
      const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"].filter(
        (day) => filteredRoutine.some((item) => item.day === day)
      );
      const tableHead = ["Time Slot \u2193", ...days];
      const tableRows: any[] = [];

      uniqueTimeSlots.forEach((slot) => {
        const row = [slot];
        days.forEach((day) => {
          const classes = filteredRoutine.filter(item => item.day === day && item.timeSlot === slot);
          if (classes.length > 0) {
            // Join classes with double newline in case of multiple classes in same slot
            const cellText = classes.map(item => `${item.courseName} - Rm ${item.roomNo}\n(${item.facultyInitial})`).join('\n\n');
            row.push(cellText);
          } else {
            row.push("");
          }
        });
        tableRows.push(row);
      });

      // Generate Table
      autoTable(doc, {
        startY: 47,
        head: [tableHead],
        body: tableRows,
        theme: "grid",
        headStyles: {
          fillColor: [90, 99, 68],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
          fontSize: 8.5
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 2.5,
          valign: "middle",
          halign: "center"
        },
        columnStyles: {
          0: { halign: "left", fontStyle: "bold", cellWidth: 35, fillColor: [248, 250, 252] }
        },
        didDrawPage: (data) => {
          // Footer Page Numbers
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(7.5);
          doc.setTextColor(120, 120, 120);
          doc.text(
            `Page ${data.pageNumber} of ${pageCount} | Generated via BUFT Routine Planner`,
            148.5,
            200,
            { align: "center" }
          );
        }
      });

      // Save PDF File
      const filename = `BUFT_Routine_${filters.department || "All"}_${filters.batch || "All"}_${filters.section || "All"}${filters.subsection || ""}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8" id="routine-planner-container">
      {/* Upper BUFT Brand Deck */}
      <div className="flex flex-col md:flex-row items-center justify-between border-b border-nature-border pb-6 mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-nature-badge text-nature-header rounded-xl">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-normal text-nature-header tracking-tight flex items-center gap-2 flex-wrap">
              BUFT Class Routine Planner
              <span className="text-xs px-3 py-1 bg-nature-btn text-white rounded-full font-bold shadow-md tracking-wide">
                {APP_CONFIG.semester}
              </span>
            </h1>
            <p className="text-sm text-nature-label">
              BGMEA University of Fashion & Technology • Excellence Through Education
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-nature-badge/60 p-1.5 rounded-xl border border-nature-border">
          <button
            onClick={() => setActiveTab("planner")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "planner"
                ? "bg-white text-nature-header border border-nature-border/30 shadow-sm"
                : "text-nature-label hover:text-nature-header"
            }`}
          >
            Routine Planner
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className="relative px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1 text-nature-label hover:text-nature-header"
          >
            {activeTab === "saved" && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 bg-white rounded-lg border border-nature-border/30 shadow-sm -z-10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            My Saved routines
            {savedRoutines.length > 0 && (
              <span className="ml-1 w-2.5 h-2.5 bg-nature-btn rounded-full" />
            )}
          </button>
        </div>
      </div>



      <AnimatePresence mode="wait">
        {activeTab === "planner" ? (
          <motion.div
            key="planner-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-8"
          >
            {/* Filter Panel Deck */}
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-nature-border shadow-[0_10px_30px_rgba(90,90,64,0.03)] h-fit space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-serif font-normal text-nature-header flex items-center gap-1.5 text-lg">
                    <Sparkles className="w-4 h-4 text-nature-btn" />
                    Select Schedule
                  </h2>
                  {syncStatus === "syncing" && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" title="Syncing with live spreadsheet..." />
                  )}
                  {syncStatus === "success" && (
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Connected & synced with live Google Sheet" />
                  )}
                  {syncStatus === "error" && (
                    <span className="w-2 h-2 rounded-full bg-red-500" title="Offline mode: Using local compiled backup" />
                  )}
                </div>
                <button
                  onClick={resetFilters}
                  className="text-xs text-nature-label hover:text-red-700 transition-colors flex items-center gap-1 font-medium"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset
                </button>
              </div>

              <div className="space-y-4">
                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-nature-label uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-nature-label" /> Department
                  </label>
                  <select
                    value={filters.department}
                    onChange={handleDepartmentChange}
                    className="w-full bg-white border border-nature-control-border rounded-[6px] px-3 py-2 text-sm text-[#4a4a3a] font-sans focus:outline-none focus:ring-2 focus:ring-nature-btn/20 focus:border-nature-btn transition-all cursor-pointer"
                  >
                    <option value="">Select Department</option>
                    {filterHelpers.departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Batch */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-nature-label uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-nature-label" /> Batch
                  </label>
                  <select
                    value={filters.batch}
                    onChange={handleBatchChange}
                    disabled={!filters.department}
                    className="w-full bg-white border border-nature-control-border rounded-[6px] px-3 py-2 text-sm text-[#4a4a3a] font-sans focus:outline-none focus:ring-2 focus:ring-nature-btn/20 focus:border-nature-btn transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Batch</option>
                    {availableBatches.map((batch) => (
                      <option key={batch} value={batch}>
                        {batch}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-nature-label uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-nature-label" /> Section
                  </label>
                  <select
                    value={filters.section}
                    onChange={handleSectionChange}
                    disabled={!filters.batch}
                    className="w-full bg-white border border-nature-control-border rounded-[6px] px-3 py-2 text-sm text-[#4a4a3a] font-sans focus:outline-none focus:ring-2 focus:ring-nature-btn/20 focus:border-nature-btn transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Section</option>
                    {availableSections.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subsection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-nature-label uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-nature-label" /> Sub-Section (Optional)
                  </label>
                  <select
                    value={filters.subsection}
                    onChange={handleSubsectionChange}
                    disabled={!filters.section || availableSubsections.length === 0}
                    className="w-full bg-white border border-nature-control-border rounded-[6px] px-3 py-2 text-sm text-[#4a4a3a] font-sans focus:outline-none focus:ring-2 focus:ring-nature-btn/20 focus:border-nature-btn transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Subsection</option>
                    {availableSubsections.map((subsec) => (
                      <option key={subsec} value={subsec}>
                        {subsec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bookmark Save Action */}
              {isFilterComplete && (
                <button
                  onClick={saveCurrentRoutine}
                  className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all border flex items-center justify-center gap-2 ${
                    isCurrentRoutineSaved
                      ? "bg-nature-badge text-nature-header/60 border-nature-border cursor-not-allowed"
                      : "bg-nature-badge text-nature-header border-nature-border hover:bg-[#e0dcd0]/50"
                  }`}
                  disabled={isCurrentRoutineSaved}
                >
                  {isCurrentRoutineSaved ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 text-nature-btn" />
                      Routine Saved
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 text-nature-label" />
                      Save Routine Configuration
                    </>
                  )}
                </button>
              )}

              {/* Helper Information */}
              <div className="bg-nature-card rounded-xl p-4 border border-nature-border/50 space-y-2">
                <span className="text-xs font-bold text-nature-header flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-nature-label" /> Helpful Guide
                </span>
                <p className="text-xs text-nature-label leading-relaxed font-sans">
                  Select your Department, Batch, and Section to dynamically populate the class routine.
                  Export instantly to high-quality vector PDF.
                </p>
              </div>
            </div>

            {/* Routine Display Deck */}
            <div className="lg:col-span-3 space-y-6">
              {/* Toolbar Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-nature-card border border-nature-border p-4 rounded-2xl gap-4">
                <div className="text-nature-text">
                  {filters.department ? (
                    <div className="text-sm">
                      Showing routine for:{" "}
                      <span className="font-bold text-nature-btn">
                        {filters.department}_{filters.batch || "All"}_{filters.section || "All"}
                        {filters.subsection || ""}
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm font-medium text-nature-label">
                      Please configure filters to view the personalized class routine.
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleExportPDF}
                    disabled={filteredRoutine.length === 0 || isExporting}
                    className="flex-grow sm:flex-grow-0 bg-nature-btn text-[#fdfcf9] hover:bg-nature-btn-hover disabled:opacity-50 px-6 py-2.5 rounded-full font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isExporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Exporting PDF...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download PDF Routine
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Table Body Content */}
              {filteredRoutine.length > 0 ? (
                <div className="space-y-6">
                  <div className="overflow-hidden rounded-2xl border border-nature-border bg-white shadow-[0_10px_30px_rgba(90,90,64,0.03)]">
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-nature-border">
                      <table className="min-w-[1100px] w-full border-collapse divide-y divide-nature-border/50 text-center">
                        <thead className="bg-nature-badge/20">
                          <tr>
                            {/* Row-header top left corner */}
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-nature-header text-left border-r border-nature-border/40 bg-nature-badge/35 w-[180px]">
                              <div className="flex items-center gap-1.5 justify-between">
                                <span>Time Slot</span>
                                <span className="text-nature-btn text-base font-bold animate-bounce mt-0.5">↓</span>
                              </div>
                            </th>
                            {/* Days headers */}
                            {sortedDays.map((day) => (
                              <th 
                                key={day} 
                                className="px-4 py-4 text-xs font-serif italic font-bold uppercase tracking-wider text-nature-header border-r border-nature-border/40 last:border-r-0"
                              >
                                {day}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-nature-border/30 bg-white">
                          {uniqueTimeSlots.map((slot) => (
                            <tr key={slot} className="hover:bg-nature-card/10 transition-colors">
                              {/* Row Header - Time Slot */}
                              <td className="px-6 py-5 text-sm font-semibold text-nature-header border-r border-nature-border/40 bg-nature-badge/10 text-left min-w-[180px]">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-nature-label/80 shrink-0" />
                                  <span>{slot}</span>
                                </div>
                              </td>
                              {/* Days content */}
                              {sortedDays.map((day) => {
                                const classesInCell = filteredRoutine.filter(
                                  (item) => item.day === day && item.timeSlot === slot
                                );
                                return (
                                  <td 
                                    key={day} 
                                    className="px-3 py-4 border-r border-nature-border/30 last:border-r-0 min-w-[140px] vertical-middle"
                                  >
                                    {classesInCell.length > 0 ? (
                                      <div className="space-y-3">
                                        {classesInCell.map((item) => (
                                          <div 
                                            key={item.id} 
                                            className="bg-nature-badge/15 border border-nature-border/40 rounded-xl p-3 shadow-xs hover:bg-nature-badge/25 transition-all text-center flex flex-col justify-center h-full min-h-[96px]"
                                          >
                                            {/* Course Title */}
                                            <div className="text-sm font-bold text-nature-text leading-snug">
                                              {item.courseName}
                                            </div>
                                            
                                            {/* Room Number */}
                                            <div className="flex items-center justify-center gap-1 mt-2.5 text-xs text-nature-label font-medium">
                                              <MapPin className="w-3.5 h-3.5 text-nature-label/60 shrink-0" />
                                              <span>{item.roomNo}</span>
                                            </div>
                                            
                                            {/* Faculty Initial */}
                                            <div className="flex items-center justify-center gap-1.5 mt-2 text-[11px] font-bold text-nature-header bg-white border border-nature-border/35 px-2 py-0.5 rounded shadow-2xs w-fit mx-auto">
                                              <UserIcon className="w-3.5 h-3.5 text-nature-label/70 shrink-0" />
                                              <span>{item.facultyInitial}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-nature-label/20 font-light text-sm select-none">-</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Notice below table */}
                  <div className="flex items-start gap-2.5 bg-amber-50/60 border border-amber-200/50 rounded-2xl p-4 text-xs text-amber-800 leading-relaxed shadow-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-950">Notice:</span> The information provided may contain missing or inaccurate data. Please refer to the official PDF file from UCam for confirmation.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center bg-nature-card/40 border border-nature-border border-dashed rounded-3xl p-16 text-center space-y-4">
                  <div className="p-4 bg-nature-badge/50 text-nature-label rounded-full">
                    <BookOpen className="w-12 h-12" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif font-normal text-nature-header text-lg">No Routine Matched</h3>
                    <p className="text-sm text-nature-label max-w-md">
                      {filters.department 
                        ? `We couldn't find any schedule matching your filters. Try selecting a different batch or section combination.` 
                        : "Select your department, batch, and section on the left to display your academic class routine."}
                    </p>
                  </div>
                  {!filters.department && (
                    <div className="flex items-center gap-2 text-nature-text bg-white border border-nature-border px-4 py-2 rounded-xl text-xs shadow-sm font-semibold">
                      <span>Select Department</span>
                      <ArrowRight className="w-3 h-3 text-nature-label" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="saved-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="bg-nature-card border border-nature-border p-6 rounded-2xl">
              <h2 className="text-lg font-serif font-normal text-nature-header tracking-tight mb-2">
                My Saved Routines
              </h2>
              <p className="text-sm text-nature-label">
                Quickly load your routine configuration without selecting the filters manually on every visit. 
                Saves directly on your local device.
              </p>
            </div>

            {savedRoutines.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedRoutines.map((saved, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -3 }}
                    className="bg-white rounded-2xl border border-nature-border shadow-[0_10px_30px_rgba(90,90,64,0.03)] p-6 flex flex-col justify-between h-52 space-y-4 hover:shadow-[0_10px_30px_rgba(90,90,64,0.06)] transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs px-3 py-1 bg-nature-badge text-nature-header border border-nature-border/30 rounded-full font-bold uppercase tracking-wider">
                          {saved.department}
                        </span>
                        <BookmarkCheck className="w-5 h-5 text-nature-btn" />
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="text-lg font-serif font-normal text-nature-header">
                          Batch {saved.batch}
                        </h4>
                        <p className="text-sm text-nature-label">
                          Section {saved.section} {saved.subsection ? `• Subsection ${saved.subsection}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 border-t border-nature-border/50 pt-4">
                      <button
                        onClick={() => loadSavedRoutine(saved)}
                        className="flex-1 bg-nature-btn text-[#fdfcf9] hover:bg-nature-btn-hover py-2 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer"
                      >
                        Load Routine
                      </button>
                      <button
                        onClick={() => removeSavedRoutine(index)}
                        className="px-3 py-2 border border-nature-border text-nature-label hover:text-red-700 hover:border-red-100 hover:bg-red-50 rounded-lg text-xs transition-all cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center border border-nature-border border-dashed rounded-3xl p-16 text-center space-y-4">
                <div className="p-4 bg-nature-card text-nature-label rounded-full">
                  <Bookmark className="w-12 h-12" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif font-normal text-nature-header text-lg">No Saved Routines</h3>
                  <p className="text-sm text-nature-label max-w-sm mx-auto">
                    You haven't saved any routines yet. Open the Routine Planner, select your filters, and click "Save Routine Configuration".
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("planner")}
                  className="bg-nature-btn text-[#fdfcf9] hover:bg-nature-btn-hover px-5 py-2.5 rounded-full font-semibold text-xs shadow-sm transition-all"
                >
                  Configure Routine Now
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
