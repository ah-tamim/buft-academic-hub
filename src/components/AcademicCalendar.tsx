import React, { useState, useEffect, useMemo } from "react";
import { useAppConfig } from "../context/AppConfigContext";
import { 
  CalendarDays, 
  Database, 
  RefreshCw, 
  AlertTriangle, 
  Download, 
  Filter,
  Info,
  Sparkles,
  CalendarCheck,
  Tag,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { fetchCSVFromGoogleSheet } from "../utils/csvParser";

export interface MainScheduleItem {
  id: number;
  date: string;
  day: string;
  activity: string;
  extra?: string;
  isSectionHeader?: boolean;
  category?: string;
}

export interface ImportantDaysRow {
  date: string;
  day: string;
  activity: string;
}

export interface ImportantDaysCategory {
  categoryName: string;
  totalInfo?: string;
  items: ImportantDaysRow[];
}

export interface ParsedAcademicCalendar {
  mainSchedule: MainScheduleItem[];
  importantDaysTitle: string;
  importantDaysCategories: ImportantDaysCategory[];
}

/**
 * Helper function to determine text colors and row styling based on event keywords:
 * 1. Holiday rows -> RED text
 * 2. Core academic milestones (SEE, Results, Reg, Break, Commencement, TF, Preparatory Leave, etc.) -> BLUE text
 * 3. Orientation / Cultural events -> PURPLE text
 * 4. Default -> Slate/Teal text
 */
export function getRowStyling(activity: string = "", date: string = "", day: string = "", categoryName: string = "") {
  const act = activity.toLowerCase();
  const cat = categoryName.toLowerCase();

  // 1. Red text for Holidays
  const isHoliday = 
    cat.includes("holiday") ||
    cat.includes("vacation") ||
    act.includes("holiday") ||
    act.includes("vacation") ||
    act.includes("eid") ||
    act.includes("jonmastomy") ||
    act.includes("durga puja") ||
    act.includes("victory day") ||
    act.includes("christmas") ||
    act.includes("shab e-barat") ||
    act.includes("shab-e-barat") ||
    act.includes("july mass uprising") ||
    act.includes("independence day") ||
    act.includes("language martyr") ||
    act.includes("may day") ||
    act.includes("ashura") ||
    act.includes("noboborsho") ||
    act.includes("buddha purnima");

  if (isHoliday) {
    return {
      textClass: "text-red-600 font-bold",
      dateClass: "text-red-700 font-bold",
      dayClass: "text-red-600 font-semibold",
      rowBg: "bg-red-50/30 hover:bg-red-50/70"
    };
  }

  // 2. Blue text for specified core academic events
  const bluePhrases = [
    "semester end examinations (see)",
    "semester end examination",
    "semester mid examinations (sme)",
    "semester mid examination",
    "publication of the see results",
    "semester reg., course advising & payment of reg. fees + 20% of tuition fees (all students)",
    "semester reg.",
    "course advising & payment of reg. fees",
    "semester break",
    "commencement of classes",
    "payment of 26.6% tf",
    "payment of 26.7% tf",
    "payment of 26.6%",
    "payment of 26.7%",
    "last date of the classes before",
    "last date of classes before",
    "preparatory leave",
    "classes resume after"
  ];

  const isBlue = bluePhrases.some(phrase => act.includes(phrase));

  if (isBlue) {
    return {
      textClass: "text-blue-700 font-extrabold",
      dateClass: "text-blue-800 font-bold",
      dayClass: "text-blue-700 font-bold",
      rowBg: "bg-blue-50/30 hover:bg-blue-50/70"
    };
  }

  // 3. Other color (Purple/Violet) for Orientation & Cultural events
  const otherColorPhrases = [
    "poe wise orientation",
    "orientation ceremony",
    "cultural programme",
    "orientation"
  ];

  const isOtherColor = otherColorPhrases.some(phrase => act.includes(phrase));

  if (isOtherColor) {
    return {
      textClass: "text-purple-700 font-extrabold",
      dateClass: "text-purple-800 font-bold",
      dayClass: "text-purple-700 font-bold",
      rowBg: "bg-purple-50/30 hover:bg-purple-50/70"
    };
  }

  // Default row styling
  return {
    textClass: "text-slate-800 font-normal",
    dateClass: "text-teal-900 font-bold",
    dayClass: "text-slate-600 font-medium",
    rowBg: "hover:bg-slate-50/80"
  };
}

/**
 * Custom robust CSV parser that splits CSV text into:
 * Part 1: Main Academic Schedule
 * Part 2: List of Important Days for Students (categorized)
 */
export function parseAcademicCalendarCSV(csvText: string): ParsedAcademicCalendar {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  // Find index of "List of Important Days"
  let splitIdx = -1;
  let importantDaysTitle = "List of Important Days for the Students";

  for (let i = 0; i < rows.length; i++) {
    const rowStr = rows[i].join(" ");
    if (rowStr.toLowerCase().includes("list of important days")) {
      splitIdx = i;
      if (rows[i][0]) {
        importantDaysTitle = rows[i][0].trim();
      }
      break;
    }
  }

  const part1Rows = splitIdx !== -1 ? rows.slice(0, splitIdx) : rows;
  const part2Rows = splitIdx !== -1 ? rows.slice(splitIdx + 1) : [];

  // Parse Part 1: Main Schedule
  const mainSchedule: MainScheduleItem[] = [];
  let itemCounter = 1;
  let currentSection = "General Schedule";

  for (const r of part1Rows) {
    if (r.every(c => !c)) continue;
    if (r[0] === "Date" && r[1] === "Day") continue;
    if (r[0] && r[0].startsWith("TOTAL")) continue;

    const dateVal = (r[0] || "").replace(/\s+/g, ' ').trim();
    const dayVal = (r[1] || "").replace(/\s+/g, ' ').trim();
    const actVal = (r[2] || "").replace(/\s{2,}/g, ' ').trim();

    if (dateVal && !dayVal && !actVal) {
      currentSection = dateVal;
      mainSchedule.push({
        id: itemCounter++,
        date: "",
        day: "",
        activity: dateVal,
        isSectionHeader: true,
        category: currentSection
      });
    } else if (dateVal || dayVal || actVal) {
      const extraVal = r.slice(3).filter(Boolean).map(s => s.trim()).join(" | ");
      mainSchedule.push({
        id: itemCounter++,
        date: dateVal,
        day: dayVal,
        activity: actVal,
        extra: extraVal,
        category: currentSection
      });
    }
  }

  // Parse Part 2: Important Days
  const importantDaysCategories: ImportantDaysCategory[] = [];
  let currentCategory: ImportantDaysCategory | null = null;

  for (const r of part2Rows) {
    if (r.every(c => !c)) continue;
    if (r[0] === "Date" && r[1] === "Day") continue;
    if (r[0] && r[0].startsWith("TOTAL")) continue;

    // Check if category header row (e.g. "Holidays", "Waiver", "Classes Starts and Ends")
    if (r[0] && !r[1] && !r[2]) {
      const name = r[0].replace(/\s+/g, ' ').trim();
      currentCategory = { categoryName: name, items: [] };
      importantDaysCategories.push(currentCategory);
    } else if (r[0] || r[1] || r[2]) {
      if (!currentCategory) {
        currentCategory = { categoryName: "Important Events & Dates", items: [] };
        importantDaysCategories.push(currentCategory);
      }

      if (r[0] === "Total") {
        currentCategory.totalInfo = [r[1], r[2]].filter(Boolean).map(s => s.replace(/\s+/g, ' ').trim()).join(" - ");
      } else {
        const dateRaw = r[0] || "";
        const dayRaw = r[1] || "";
        const actRaw = r[2] || "";

        const dates = dateRaw.split("\n").map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
        const days = dayRaw.split("\n").map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
        const activities = actRaw.split("\n").map(s => s.replace(/\s{2,}/g, ' ').trim()).filter(Boolean);

        const maxLen = Math.max(dates.length, days.length, activities.length);

        if (maxLen <= 1) {
          currentCategory.items.push({
            date: dateRaw.replace(/\s+/g, ' ').trim(),
            day: dayRaw.replace(/\s+/g, ' ').trim(),
            activity: actRaw.replace(/\s{2,}/g, ' ').trim()
          });
        } else {
          for (let k = 0; k < maxLen; k++) {
            currentCategory.items.push({
              date: dates[k] || "",
              day: days[k] || "",
              activity: activities[k] || ""
            });
          }
        }
      }
    }
  }

  return {
    mainSchedule,
    importantDaysTitle,
    importantDaysCategories
  };
}

export default function AcademicCalendar() {
  const { config: appConfig } = useAppConfig();

  const [calendarData, setCalendarData] = useState<ParsedAcademicCalendar | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Category filter
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = appConfig.academicCalendarSheetUrl || appConfig.classRoutineSheetUrl;
      if (!url) {
        throw new Error("Academic Calendar spreadsheet URL is empty.");
      }

      const csvText = await fetchCSVFromGoogleSheet(url);
      const parsed = parseAcademicCalendarCSV(csvText);

      if (parsed.mainSchedule.length === 0 && parsed.importantDaysCategories.length === 0) {
        throw new Error("Spreadsheet reached, but appears empty or lacks valid table data.");
      }

      setCalendarData(parsed);
    } catch (err: any) {
      console.warn("Academic Calendar sheet error:", err);
      setError(err?.message || "Failed to load Academic Calendar data. Please verify spreadsheet URL and permissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [appConfig.academicCalendarSheetUrl]);

  // List of all unique categories from Part 1 and Part 2
  const allCategories = useMemo(() => {
    if (!calendarData) return [];
    const list: string[] = [];

    // Categories from Part 1 (Section headers)
    calendarData.mainSchedule.forEach((item) => {
      if (item.isSectionHeader && item.activity.trim()) {
        const name = item.activity.trim();
        if (!list.some((c) => c.toLowerCase() === name.toLowerCase())) {
          list.push(name);
        }
      }
    });

    // Categories from Part 2
    calendarData.importantDaysCategories.forEach((cat) => {
      if (cat.categoryName && cat.categoryName.trim()) {
        const name = cat.categoryName.trim();
        if (!list.some((c) => c.toLowerCase() === name.toLowerCase())) {
          list.push(name);
        }
      }
    });

    return list;
  }, [calendarData]);

  // Filtered Main Schedule (Part 1)
  const filteredMainSchedule = useMemo(() => {
    if (!calendarData) return [];
    if (categoryFilter === "ALL") return calendarData.mainSchedule;

    const target = categoryFilter.trim().toLowerCase();

    return calendarData.mainSchedule.filter((item) => {
      if (item.isSectionHeader) {
        return item.activity.trim().toLowerCase() === target;
      }
      return (
        item.category?.trim().toLowerCase() === target ||
        item.activity.toLowerCase().includes(target)
      );
    });
  }, [calendarData, categoryFilter]);

  // Filtered Important Days Categories (Part 2)
  const filteredImportantCategories = useMemo(() => {
    if (!calendarData) return [];
    if (categoryFilter === "ALL") return calendarData.importantDaysCategories;

    const target = categoryFilter.trim().toLowerCase();
    return calendarData.importantDaysCategories.filter(
      (c) =>
        c.categoryName.trim().toLowerCase() === target ||
        c.categoryName.trim().toLowerCase().includes(target)
    );
  }, [calendarData, categoryFilter]);

  // Download PDF Report
  const handleDownloadPDF = () => {
    if (!calendarData) return;

    const doc = new jsPDF({ orientation: "portrait" });
    const pageWidth = doc.internal.pageSize.width;

    // Header Title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(13, 148, 136); // Teal-600
    doc.text("Academic Calendar", pageWidth / 2, 16, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Semester: ${appConfig.academicCalendarSemester || "Spring 2026 (261)"}`,
      pageWidth / 2,
      23,
      { align: "center" }
    );

    let startY = 30;

    // Part 1 Table
    if (filteredMainSchedule.length > 0) {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("Part 1: Main Academic Schedule", 14, startY);
      startY += 6;

      const body = filteredMainSchedule.map((item, idx) => {
        if (item.isSectionHeader) {
          return [{ content: item.activity, colSpan: 4, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }];
        }
        return [idx + 1, item.date, item.day, item.activity];
      });

      autoTable(doc, {
        startY: startY,
        head: [["#", "Date", "Day", "Academic Activity"]],
        body: body as any,
        theme: "striped",
        headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255], fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2.5, overflow: "linebreak" },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 32, fontStyle: "bold" },
          2: { cellWidth: 28 },
          3: { cellWidth: "auto" }
        }
      });

      startY = (doc as any).lastAutoTable.finalY + 12;
    }

    // Part 2 Important Days
    if (filteredImportantCategories.length > 0) {
      if (startY > doc.internal.pageSize.height - 40) {
        doc.addPage();
        startY = 20;
      }

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(13, 148, 136);
      doc.text(calendarData.importantDaysTitle || "Part 2: List of Important Days for Students", 14, startY);
      startY += 6;

      filteredImportantCategories.forEach(cat => {
        if (startY > doc.internal.pageSize.height - 30) {
          doc.addPage();
          startY = 20;
        }

        const body = cat.items.map(i => [i.date || "-", i.day || "-", i.activity || "-"]);
        autoTable(doc, {
          startY: startY,
          head: [[{ content: cat.categoryName, colSpan: 3, styles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' } }], ["Date", "Day", "Event / Activity"]],
          body: body,
          theme: "plain",
          styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
          columnStyles: {
            0: { cellWidth: 35, fontStyle: "bold" },
            1: { cellWidth: 30 },
            2: { cellWidth: "auto" }
          }
        });

        startY = (doc as any).lastAutoTable.finalY + 8;
      });
    }

    // Add courtesy note at the bottom of every page
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("courtesy of ©BUFT Academic HUB.", pageWidth / 2, doc.internal.pageSize.height - 8, { align: "center" });
    }

    doc.save(`Academic_Calendar_${(appConfig.academicCalendarSemester || "BUFT").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased w-full max-w-full overflow-x-hidden" id="academic_calendar_page">
      
      {/* Top Banner with Semester Name */}
      <div className="bg-gradient-to-r from-teal-800 via-emerald-700 to-cyan-800 text-white shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-60"></div>
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-inner mt-1 shrink-0">
                <CalendarDays className="h-8 w-8 sm:h-9 sm:w-9 text-teal-100" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1" id="academic_calendar_title">
                  Academic Calendar
                </h1>
                <p className="text-sm sm:text-base text-teal-100 font-medium mt-1.5 flex flex-wrap items-center gap-2" id="academic_calendar_semester">
                  <span className="bg-white/20 text-white font-bold px-2.5 py-0.5 rounded-full text-xs uppercase tracking-wider">
                    Semester
                  </span>
                  <span>{appConfig.academicCalendarSemester || "Spring 2026 (261)"}</span>
                </p>
              </div>
            </div>

            {/* Header info & export button */}
            {calendarData && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-3.5 py-1.5 text-right">
                  <span className="text-[11px] text-teal-100 block">Total Events</span>
                  <span className="text-base font-bold text-white">
                    {calendarData.mainSchedule.length + calendarData.importantDaysCategories.reduce((acc, c) => acc + c.items.length, 0)}
                  </span>
                </div>
                {appConfig.academicCalendarLastUpdate && (
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-3.5 py-1.5 text-right">
                    <span className="text-[11px] text-teal-100 block">Last Updated</span>
                    <span className="text-xs font-semibold text-white">{appConfig.academicCalendarLastUpdate}</span>
                  </div>
                )}
                {appConfig.showAcademicCalendarExportPdf && (
                  <button
                    onClick={handleDownloadPDF}
                    className="px-4 py-2 bg-white text-teal-900 hover:bg-teal-50 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <Download className="h-3.5 w-3.5 text-teal-700" /> Export PDF
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        {/* Custom Notice if present */}
        {appConfig.academicCalendarNotice && (
          <div className="bg-teal-50 border border-teal-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
            <Info className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-teal-900 leading-relaxed font-medium">
              <strong className="font-bold text-teal-950">Notice:</strong> {appConfig.academicCalendarNotice}
            </p>
          </div>
        )}

        {/* Category Filter */}
        {calendarData && allCategories.length > 0 && (
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-2">
              <Filter className="h-4 w-4 text-teal-600 shrink-0" /> Filter Category:
            </span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 focus:border-teal-500 text-slate-800 text-xs sm:text-sm font-semibold rounded-xl p-2.5 outline-none transition cursor-pointer max-w-full sm:max-w-xs"
            >
              <option value="ALL">Show All Categories</option>
              {allCategories.map((catName) => (
                <option key={catName} value={catName}>
                  {catName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Main Workspace Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm"
            >
              <div className="relative">
                <div className="h-14 w-14 rounded-full border-4 border-slate-100 border-t-teal-600 animate-spin"></div>
                <Database className="h-5 w-5 text-teal-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mt-5">Loading Academic Calendar...</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs text-center px-4">
                
              </p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white p-8 sm:p-10 rounded-3xl border border-rose-100 shadow-sm flex flex-col items-center text-center"
            >
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl mb-4">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Spreadsheet Loading Error</h3>
              <p className="text-slate-600 max-w-md mt-2 text-xs sm:text-sm leading-relaxed">{error}</p>
              <button
                onClick={fetchData}
                className="mt-5 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" /> Retry Loading
              </button>
            </motion.div>
          ) : calendarData ? (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-10"
            >
              {/* ======================================================== */}
              {/* PART 1: MAIN ACADEMIC ROUTINE / SCHEDULE                 */}
              {/* ======================================================== */}
              <section className="space-y-4" id="part_1_main_schedule">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-teal-100 text-teal-800 rounded-xl">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                        Part 1: Semester Academic Schedule
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Detailed timeline of classes, midterms, and end-semester dates
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200/70 px-3 py-1 rounded-full w-fit">
                    {filteredMainSchedule.length} entries
                  </span>
                </div>

                {filteredMainSchedule.length > 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden w-full max-w-full">
                    
                    {/* Responsive Table with zero horizontal scroll */}
                    <div className="w-full max-w-full overflow-x-hidden">
                      <table className="w-full max-w-full min-w-0 table-fixed border-collapse text-left">
                        <thead>
                          <tr className="bg-slate-100/80 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                            <th className="py-3 px-2 sm:px-3 w-8 sm:w-10 text-center text-slate-400">#</th>
                            <th className="py-3 px-2 sm:px-3 w-28 sm:w-36 text-slate-800 font-black">Date</th>
                            <th className="py-3 px-2 sm:px-3 w-20 sm:w-28 text-slate-700 font-black">Day</th>
                            <th className="py-3 px-2 sm:px-3 w-auto text-slate-800 font-black">Academic Activity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                          {filteredMainSchedule.map((item, idx) => {
                            if (item.isSectionHeader) {
                              return (
                                <tr key={`hdr-${idx}`} className="bg-teal-50/70 border-y border-teal-100">
                                  <td colSpan={4} className="py-2.5 px-3 sm:px-4 font-black text-teal-900 text-xs sm:text-sm tracking-wide">
                                    <span className="flex items-center gap-2">
                                      <Sparkles className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                                      {item.activity}
                                    </span>
                                  </td>
                                </tr>
                              );
                            }

                            const style = getRowStyling(item.activity, item.date, item.day, "");

                            return (
                              <tr key={item.id} className={`${style.rowBg} transition-colors`}>
                                <td className="py-3 px-2 sm:px-3 text-center text-[11px] font-mono text-slate-400 align-top">
                                  {idx + 1}
                                </td>
                                <td className={`py-3 px-2 sm:px-3 align-top text-xs sm:text-sm break-words ${style.dateClass}`}>
                                  {item.date || <span className="text-slate-300 italic font-normal">-</span>}
                                </td>
                                <td className={`py-3 px-2 sm:px-3 align-top text-xs sm:text-sm break-words ${style.dayClass}`}>
                                  {item.day || <span className="text-slate-300 italic">-</span>}
                                </td>
                                <td className={`py-3 px-2 sm:px-3 align-top leading-relaxed break-words whitespace-pre-line ${style.textClass}`}>
                                  <span>{item.activity}</span>
                                  {item.extra && (
                                    <span className="block text-[11px] font-semibold mt-0.5 opacity-90">
                                      {item.extra}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                    <p className="text-xs text-slate-500">No schedule items available.</p>
                  </div>
                )}
              </section>

              {/* ======================================================== */}
              {/* CLEAR VISUAL GAP & DIVIDER                               */}
              {/* ======================================================== */}
              <div className="relative my-8 sm:my-12">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-slate-50 px-4 text-xs font-extrabold text-teal-800 uppercase tracking-widest flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-teal-600" />
                    Important Student Schedules & Events
                  </span>
                </div>
              </div>

              {/* ======================================================== */}
              {/* PART 2: LIST OF IMPORTANT DAYS FOR STUDENTS             */}
              {/* ======================================================== */}
              <section className="space-y-6" id="part_2_important_days">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                      <CalendarCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                        {calendarData.importantDaysTitle || "Part 2: List of Important Days for Students"}
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Categorized key deadlines, holidays, examinations, and activity lists
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/70 px-3 py-1 rounded-full w-fit">
                    {filteredImportantCategories.length} Categories
                  </span>
                </div>

                {filteredImportantCategories.length > 0 ? (
                  <div className="space-y-6">
                    {filteredImportantCategories.map((cat, catIdx) => (
                      <div
                        key={cat.categoryName + catIdx}
                        className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden w-full max-w-full"
                      >
                        {/* Category Header */}
                        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-teal-400 inline-block"></span>
                            <h3 className="text-xs sm:text-sm font-extrabold tracking-wide uppercase">
                              {cat.categoryName}
                            </h3>
                          </div>
                          {cat.totalInfo && (
                            <span className="text-[11px] font-bold bg-white/10 text-teal-200 px-2.5 py-0.5 rounded-full">
                              {cat.totalInfo}
                            </span>
                          )}
                        </div>

                        {/* Category Items Table (Zero Horizontal Scroll) */}
                        <div className="w-full max-w-full overflow-x-hidden">
                          <table className="w-full max-w-full min-w-0 table-fixed border-collapse text-left">
                            <thead>
                              <tr className="bg-slate-50 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                <th className="py-2.5 px-3 sm:px-4 w-28 sm:w-36 text-slate-700 font-extrabold">Date</th>
                                <th className="py-2.5 px-3 sm:px-4 w-20 sm:w-28 text-slate-600 font-extrabold">Day</th>
                                <th className="py-2.5 px-3 sm:px-4 w-auto text-slate-700 font-extrabold">Academic Event / Notice</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                              {cat.items.map((item, itemIdx) => {
                                const style = getRowStyling(item.activity, item.date, item.day, cat.categoryName);

                                return (
                                  <tr key={itemIdx} className={`${style.rowBg} transition-colors`}>
                                    <td className={`py-3 px-3 sm:px-4 align-top text-xs sm:text-sm break-words ${style.dateClass}`}>
                                      {item.date || <span className="text-slate-300 italic font-normal">-</span>}
                                    </td>
                                    <td className={`py-3 px-3 sm:px-4 align-top text-xs sm:text-sm break-words ${style.dayClass}`}>
                                      {item.day || <span className="text-slate-300 italic">-</span>}
                                    </td>
                                    <td className={`py-3 px-3 sm:px-4 align-top leading-relaxed break-words whitespace-pre-line ${style.textClass}`}>
                                      {item.activity}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                    <p className="text-xs text-slate-500">No important day categories available.</p>
                  </div>
                )}
              </section>

            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
