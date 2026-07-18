import { useState, useEffect, useMemo } from "react";
import { 
  Calendar, 
  Clock, 
  Search, 
  Database, 
  RefreshCw, 
  AlertTriangle, 
  GraduationCap, 
  Layers, 
  Users, 
  Compass,
  Award,
  CheckCircle2,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ==========================================
// 1. INLINED TYPES & INTERFACES
// ==========================================
export interface ExamRow {
  date: string;         // e.g. "26-07-2026"
  day: string;          // e.g. "Sunday"
  time: string;         // e.g. "10:00:AM to 12:00:PM"
  session: "Morning" | "Afternoon";
  program: string;      // e.g. "AMT"
  batch: string;        // e.g. "261"
  sectionCode: string;  // e.g. "AMT_261_3"
  sectionNo: string;    // e.g. "3" (parsed section number)
  courseCode: string;   // e.g. "CHEM05311101"
  courseTitle: string;  // e.g. "Chemistry"
  credits: string;      // e.g. "3.00"
  teacher: string;      // e.g. "RMM"
  totalStudents: string;// e.g. "56"
  room1: string;        // e.g. "810"
  seating1: string;     // e.g. "1-28"
  room2: string;        // e.g. "809"
  seating2: string;     // e.g. "29-56"
}

export interface AppConfig {
  spreadsheetUrl: string;
  examName: string;
  semester: string;
}

// ==========================================
// 2. INLINED CONFIGURATION DATA
// ==========================================
const config: AppConfig = {
  spreadsheetUrl: "https://docs.google.com/spreadsheets/d/1DcEso5N-DUqfLXcOJxCg5efXJyahZwk4IEdWoGqe0Do/edit?usp=sharing",
  examName: "SEE",
  semester: "Spring 2026(261)"
};

// ==========================================
// 3. INLINED PARSER UTILITIES
// ==========================================
export function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentVal = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // skip next quote character
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentVal.trim());
      currentVal = "";
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(currentVal.trim());
      result.push(row);
      row = [];
      currentVal = "";
    } else {
      currentVal += char;
    }
  }

  if (currentVal || row.length > 0) {
    row.push(currentVal.trim());
    result.push(row);
  }

  return result;
}

export function parseSheetData(csvRows: string[][], session: "Morning" | "Afternoon"): ExamRow[] {
  const exams: ExamRow[] = [];
  let currentDate = "";
  let currentDay = "";
  let currentTime = "";

  for (const row of csvRows) {
    if (!row || row.length === 0) continue;
    
    const firstCell = row[0] ? row[0].trim() : "";
    if (!firstCell) continue;
    
    if (firstCell.toLowerCase().startsWith("date:")) {
      const dateMatch = firstCell.match(/Date:\s*(\d{2}-\d{2}-\d{4})/i);
      if (dateMatch) {
        currentDate = dateMatch[1];
      }
      
      const timeMatch = firstCell.match(/Time:\s*([0-9:a-zA-Z\s\-]+?)(?:Program|$)/i);
      if (timeMatch) {
        currentTime = timeMatch[1].trim();
      } else {
        const directTimeMatch = firstCell.match(/Time:\s*(.*)/i);
        if (directTimeMatch) {
          currentTime = directTimeMatch[1].trim();
        }
      }
      
      const dayMatch = firstCell.match(/Date:\s*\d{2}-\d{2}-\d{4}\s+([A-Za-z]+)\s+Time:/i);
      if (dayMatch) {
        currentDay = dayMatch[1].trim();
      } else {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        for (const d of days) {
          if (firstCell.toLowerCase().includes(d.toLowerCase())) {
            currentDay = d;
            break;
          }
        }
      }
      continue;
    }

    if (firstCell.toLowerCase() === "program" || firstCell.toLowerCase() === "course code") {
      continue;
    }

    const program = row[0] ? row[0].trim() : "";
    const batch = row[1] ? row[1].trim() : "";
    const sectionCode = row[2] ? row[2].trim() : "";
    const courseCode = row[3] ? row[3].trim() : "";
    const courseTitle = row[4] ? row[4].trim() : "";
    
    if (!courseTitle || !sectionCode || sectionCode.toLowerCase() === "section") {
      continue;
    }

    const { dept: parsedDept, batch: parsedBatch, sectionNo } = parseSectionInfo(sectionCode, program, batch);

    const credits = row[5] ? row[5].trim() : "";
    const teacher = row[6] ? row[6].trim() : "";
    const totalStudents = row[7] ? row[7].trim() : "";
    const rawRoom1 = row[8] ? row[8].trim() : "";
    const rawSeating1 = row[9] ? row[9].trim() : "";
    const rawRoom2 = row[10] ? row[10].trim() : "";
    const rawSeating2 = row[11] ? row[11].trim() : "";

    let room1 = rawRoom1;
    let seating1 = rawSeating1;
    let room2 = rawRoom2;
    let seating2 = rawSeating2;

    const getSeatingStart = (seating: string): number => {
      if (!seating) return Infinity;
      const match = seating.match(/\d+/);
      return match ? parseInt(match[0], 10) : Infinity;
    };

    if (rawRoom1 && rawRoom2) {
      const start1 = getSeatingStart(rawSeating1);
      const start2 = getSeatingStart(rawSeating2);
      if (start2 < start1) {
        room1 = rawRoom2;
        seating1 = rawSeating2;
        room2 = rawRoom1;
        seating2 = rawSeating1;
      }
    } else if (!rawRoom1 && rawRoom2) {
      room1 = rawRoom2;
      seating1 = rawSeating2;
      room2 = "";
      seating2 = "";
    }

    exams.push({
      date: currentDate || "N/A",
      day: currentDay || "N/A",
      time: currentTime || (session === "Morning" ? "10:00 AM to 12:00 PM" : "02:00 PM to 04:00 PM"),
      session,
      program: parsedDept || program,
      batch: parsedBatch || batch,
      sectionCode,
      sectionNo: sectionNo || sectionCode,
      courseCode,
      courseTitle,
      credits,
      teacher,
      totalStudents,
      room1,
      seating1,
      room2,
      seating2
    });
  }

  return exams;
}

function parseSectionInfo(sectionCode: string, rowDept: string, rowBatch: string) {
  if (!sectionCode) {
    return {
      dept: rowDept || "",
      batch: rowBatch || "",
      sectionNo: ""
    };
  }

  const cleanCode = sectionCode.trim();
  const parts = cleanCode.split('_');
  if (parts.length >= 3) {
    const dept = parts[0];
    const batch = parts[1];
    const sectionNo = parts.slice(2).join('_');
    return { dept, batch, sectionNo };
  } else if (parts.length === 2) {
    const dept = parts[0];
    const rest = parts[1];
    const subParts = rest.split('-');
    if (subParts.length >= 2) {
      return { dept, batch: subParts[0], sectionNo: subParts.slice(1).join('-') };
    }
    return { dept, batch: rest, sectionNo: "" };
  }
  
  const dashParts = cleanCode.split('-');
  if (dashParts.length >= 3) {
    return { dept: dashParts[0], batch: dashParts[1], sectionNo: dashParts.slice(2).join('-') };
  }

  return {
    dept: rowDept || "",
    batch: rowBatch || "",
    sectionNo: cleanCode
  };
}

export function sortByDate(exams: ExamRow[]): ExamRow[] {
  return [...exams].sort((a, b) => {
    if (!a.date || a.date === "N/A") return 1;
    if (!b.date || b.date === "N/A") return -1;

    const partsA = a.date.split("-").map(Number);
    const partsB = b.date.split("-").map(Number);

    if (partsA.length === 3 && partsB.length === 3) {
      const dateA = new Date(partsA[2], partsA[1] - 1, partsA[0]).getTime();
      const dateB = new Date(partsB[2], partsB[1] - 1, partsB[0]).getTime();

      if (dateA !== dateB) {
        return dateA - dateB;
      }
    }

    if (a.session !== b.session) {
      return a.session === "Morning" ? -1 : 1;
    }

    return a.courseTitle.localeCompare(b.courseTitle);
  });
}

// ==========================================
// 4. MAIN EXAM ROUTINE COMPONENT
// ==========================================
export default function ExamRoutine() {
  // Application Data States
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Dropdown Filter States for Seating Search
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");

  // Fetch Spreadsheet Helper
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = config.spreadsheetUrl;
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!match || !match[1]) {
        throw new Error("Invalid Google Spreadsheet URL in configuration.");
      }
      
      const spreadsheetId = match[1];
      const morningUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=Morning`;
      const afternoonUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=Afternoon`;

      // Fetch Morning sheet
      const morningResponse = await fetch(morningUrl);
      if (!morningResponse.ok) {
        throw new Error("Failed to fetch 'Morning' tab data from Google Sheets.");
      }
      const morningCsvText = await morningResponse.text();
      const morningRows = parseCSV(morningCsvText);
      const morningExams = parseSheetData(morningRows, "Morning");

      // Fetch Afternoon sheet
      const afternoonResponse = await fetch(afternoonUrl);
      if (!afternoonResponse.ok) {
        throw new Error("Failed to fetch 'Afternoon' tab data from Google Sheets.");
      }
      const afternoonCsvText = await afternoonResponse.text();
      const afternoonRows = parseCSV(afternoonCsvText);
      const afternoonExams = parseSheetData(afternoonRows, "Afternoon");

      // Combine and sort
      const combined = sortByDate([...morningExams, ...afternoonExams]);
      
      if (combined.length === 0) {
        throw new Error("No exam entries found in the spreadsheet tabs. Verify sheet formatting.");
      }

      setExams(combined);

      // Set initial values for seating search dropdowns
      const uniqueDepts = Array.from(new Set(combined.map(e => e.program))).sort();
      if (uniqueDepts.length > 0) {
        const defaultDept = uniqueDepts[0];
        setSelectedDept(defaultDept);

        const filteredBatches = Array.from(new Set(combined.filter(e => e.program === defaultDept).map(e => e.batch))).sort();
        if (filteredBatches.length > 0) {
          const defaultBatch = filteredBatches[0];
          setSelectedBatch(defaultBatch);

          const filteredSections = Array.from(new Set(combined.filter(e => e.program === defaultDept && e.batch === defaultBatch).map(e => e.sectionNo))).sort();
          if (filteredSections.length > 0) {
            setSelectedSection(filteredSections[0]);
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while parsing the Google Spreadsheet.");
    } finally {
      setLoading(false);
    }
  };

  // Run on mount
  useEffect(() => {
    fetchData();
  }, []);

  // List of all unique departments
  const departments = useMemo(() => {
    return Array.from(new Set(exams.map(e => e.program))).sort();
  }, [exams]);

  // List of batches for selected department
  const batchesForDept = useMemo(() => {
    if (!selectedDept) return [];
    return Array.from(new Set(exams.filter(e => e.program === selectedDept).map(e => e.batch))).sort();
  }, [exams, selectedDept]);

  // List of sections for selected department and batch
  const sectionsForBatch = useMemo(() => {
    if (!selectedDept || !selectedBatch) return [];
    return Array.from(new Set(
      exams
        .filter(e => e.program === selectedDept && e.batch === selectedBatch)
        .map(e => e.sectionNo)
    )).sort();
  }, [exams, selectedDept, selectedBatch]);

  // Auto-adjust batch selection if department changes
  useEffect(() => {
    if (batchesForDept.length > 0) {
      if (!batchesForDept.includes(selectedBatch)) {
        setSelectedBatch(batchesForDept[0]);
      }
    } else {
      setSelectedBatch("");
    }
  }, [selectedDept, batchesForDept]);

  // Auto-adjust section selection if batch changes
  useEffect(() => {
    if (sectionsForBatch.length > 0) {
      if (!sectionsForBatch.includes(selectedSection)) {
        setSelectedSection(sectionsForBatch[0]);
      }
    } else {
      setSelectedSection("");
    }
  }, [selectedBatch, sectionsForBatch]);

  // Filtered exams for selected seating search
  const filteredSeatingExams = useMemo(() => {
    if (!selectedDept || !selectedBatch || !selectedSection) return [];
    return exams.filter(e => 
      e.program === selectedDept && 
      e.batch === selectedBatch && 
      e.sectionNo === selectedSection
    );
  }, [exams, selectedDept, selectedBatch, selectedSection]);

  // Download filtered individual routine as a PDF
  const handleDownloadSeatingPDF = () => {
    if (filteredSeatingExams.length === 0) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(13, 148, 136); // Teal-600
    doc.text("Exam Routine", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`${config.examName} — ${config.semester}`, pageWidth / 2, 26, { align: "center" });
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text(`Routine for: ${selectedDept} | Batch ${selectedBatch} | Section ${selectedSection}`, pageWidth / 2, 34, { align: "center" });
    
    const headers = [["Date & Day", "Course Title", "Session & Time", "Allocated Rooms"]];
    
    const tableData = filteredSeatingExams.map(exam => {
      const roomsText: string[] = [];
      if (exam.room1) {
        roomsText.push(`Room ${exam.room1}${exam.seating1 ? ` (${exam.seating1})` : ''}`);
      }
      if (exam.room2) {
        roomsText.push(`Room ${exam.room2}${exam.seating2 ? ` (${exam.seating2})` : ''}`);
      }
      const roomsStr = roomsText.length > 0 ? roomsText.join("\n") : "No Room Allocated";
      const courseStr = exam.courseTitle;
      const dateStr = `${exam.date}\n(${exam.day})`;
      const timeStr = `${exam.session}\n${exam.time}`;

      return [dateStr, courseStr, timeStr, roomsStr];
    });

    autoTable(doc, {
      startY: 40,
      head: headers,
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255], fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 4, overflow: "linebreak" },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 70 },
        2: { cellWidth: 40 },
        3: { cellWidth: 45 }
      },
      didDrawPage: (data: any) => {
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text(`Page ${data.pageNumber} of ${pageCount} | Generated on ${new Date().toLocaleDateString()}`, 14, doc.internal.pageSize.height - 10);
        doc.text("©BUFT Academic HUB", doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 10, { align: "right" });
      }
    });

    const fileName = `Exam_Routine_${selectedDept}_Batch_${selectedBatch}_Sec_${selectedSection}.pdf`;
    doc.save(fileName);
  };



  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased" id="main_container">
      
      {/* Decorative gradient header banner */}
      <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-700 text-white shadow-md relative overflow-hidden" id="header_banner">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-60"></div>
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            
            {/* Branding and Subtitles */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-inner mt-1">
                <GraduationCap className="h-9 w-9 text-teal-100" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight mt-1" id="page_title">
                  Exam Routine
                </h1>
                <p className="text-base text-teal-100 font-medium mt-1.5 flex items-center gap-1.5" id="page_subtitle">
                  <Award className="h-4.5 w-4.5 text-amber-300" /> {config.examName} — {config.semester}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content Workspace */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8" id="workspace_container">
        


        {/* State rendering: Loading, Error, Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading_state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm"
              id="loading_panel"
            >
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-teal-600 animate-spin"></div>
                <Database className="h-6 w-6 text-teal-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mt-6">Loading routine data...</h3>
              <p className="text-sm text-slate-500 mt-1.5 max-w-sm text-center px-4">
                Please wait a moment while the routine is loading.
              </p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error_state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white p-8 sm:p-12 rounded-3xl border border-red-100 shadow-sm flex flex-col items-center text-center"
              id="error_panel"
            >
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl mb-5">
                <AlertTriangle className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Connection Error</h3>
              <p className="text-slate-600 max-w-lg mt-3 text-sm leading-relaxed">
                {error}
              </p>
              
              <div className="mt-8 bg-slate-50 p-6 rounded-2xl border border-slate-200 max-w-2xl text-left">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Troubleshooting Guide:</h4>
                <ul className="text-xs text-slate-600 list-disc list-inside space-y-1.5 leading-relaxed">
                  <li>Verify the Google Spreadsheet is accessible.</li>
                  <li>Ensure the sheet is marked as <strong>"Anyone with the link can view"</strong> inside Google Sheets share settings.</li>
                  <li>Confirm that your spreadsheet contains sheets strictly named exactly <strong className="font-semibold text-teal-700">"Morning"</strong> and <strong className="font-semibold text-teal-700">"Afternoon"</strong>.</li>
                  <li>Make sure the columns follow the required pattern.</li>
                </ul>
              </div>

              <button
                onClick={fetchData}
                className="mt-8 px-6 py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold rounded-xl shadow-md transition duration-150 flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="h-4.5 w-4.5" />
                Retry Connecting
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="content_state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
              id="seating_tab_view"
            >
                  
                  {/* Selector Card */}
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
                    <div className="border-b border-slate-100 pb-5 mb-6">
                      <h2 className="text-xl font-bold text-slate-800">Exam Schedule</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Select your department, batch, and section to filter your exact exam dates, times, and allocated classrooms.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      
                      {/* Department Select */}
                      <div className="flex flex-col">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-teal-600" /> 1. Department
                        </label>
                        <select
                          value={selectedDept}
                          onChange={(e) => setSelectedDept(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white text-slate-800 font-medium rounded-xl p-3.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-100/80"
                          id="dept_selector"
                        >
                          {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>

                      {/* Batch Select */}
                      <div className="flex flex-col">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-cyan-600" /> 2. Batch
                        </label>
                        <select
                          value={selectedBatch}
                          onChange={(e) => setSelectedBatch(e.target.value)}
                          disabled={batchesForDept.length === 0}
                          className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white text-slate-800 font-medium rounded-xl p-3.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-100/80 disabled:opacity-50"
                          id="batch_selector"
                        >
                          {batchesForDept.map(batch => (
                            <option key={batch} value={batch}>Batch {batch}</option>
                          ))}
                        </select>
                      </div>

                      {/* Section Select */}
                      <div className="flex flex-col">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Compass className="h-3.5 w-3.5 text-indigo-600" /> 3. Section
                        </label>
                        <select
                          value={selectedSection}
                          onChange={(e) => setSelectedSection(e.target.value)}
                          disabled={sectionsForBatch.length === 0}
                          className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white text-slate-800 font-medium rounded-xl p-3.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-100/80 disabled:opacity-50"
                          id="section_selector"
                        >
                          {sectionsForBatch.map(section => (
                            <option key={section} value={section}>Section {section}</option>
                          ))}
                        </select>
                      </div>

                    </div>
                  </div>

                  {/* Seating Table Display */}
                  <div id="seating_table_workspace" className="space-y-6">
                    {filteredSeatingExams.length > 0 ? (
                      <div className="space-y-6">
                        
                        {/* Summary bar for selected criteria */}
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-emerald-500/10 text-emerald-700 rounded-lg">
                              <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <p className="text-sm text-emerald-800 font-semibold">
                              Filtered: <span className="underline decoration-2 decoration-emerald-500/40">{selectedDept}</span> — Batch <span className="underline decoration-2 decoration-emerald-500/40">{selectedBatch}</span> — Section <span className="underline decoration-2 decoration-emerald-500/40">{selectedSection}</span>
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-xs font-bold uppercase tracking-wider bg-emerald-100/60 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200/50">
                              {filteredSeatingExams.length} Scheduled Exam{filteredSeatingExams.length > 1 ? "s" : ""}
                            </span>
                            <button
                              onClick={handleDownloadSeatingPDF}
                              className="flex items-center gap-1.5 px-3 py-1 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs rounded-full border border-teal-500/30 transition-all duration-150 cursor-pointer shadow-sm hover:shadow text-center"
                              id="download_seating_pdf"
                              title="Download current routine as PDF"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download PDF
                            </button>
                          </div>
                        </div>

                        {/* Responsive Exam Routine Layout */}
                        {/* Mobile List View (visible on small devices) */}
                        <div className="block md:hidden space-y-4">
                          {filteredSeatingExams.map((exam, idx) => {
                            const isMorning = exam.session === "Morning";
                            return (
                              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-teal-500/40 transition duration-150">
                                <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100 mb-3.5">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-teal-600 shrink-0" />
                                    <div>
                                      <span className="font-bold text-slate-800 text-sm">{exam.date}</span>
                                      <span className="text-xs text-slate-400 block font-medium mt-0.5">{exam.day}</span>
                                    </div>
                                  </div>
                                  <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded border ${
                                    isMorning 
                                      ? "bg-amber-50 text-amber-800 border-amber-200/50" 
                                      : "bg-indigo-50 text-indigo-800 border-indigo-200/50"
                                  }`}>
                                    {exam.session}
                                  </span>
                                </div>

                                <div className="space-y-3.5">
                                  <div>
                                    <h4 className="font-bold text-slate-900 text-sm leading-snug">
                                      {exam.courseTitle}
                                    </h4>
                                    <div className="text-xs text-slate-500 font-mono mt-1.5 flex flex-wrap items-center gap-x-2">
                                      <span>Code: {exam.courseCode}</span>
                                      {exam.teacher && (
                                        <>
                                          <span className="text-slate-300">•</span>
                                          <span>Teacher: {exam.teacher}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                    <Clock className="h-4 w-4 text-teal-600/80 shrink-0" />
                                    <span>{exam.time}</span>
                                  </div>

                                  <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                                    {exam.room1 && (
                                      <div className="px-3 py-1 bg-teal-50 text-teal-800 font-bold text-xs rounded-xl border border-teal-100/80 inline-flex items-center gap-1.5 self-start">
                                        🚪 Room {exam.room1} {exam.seating1 ? `(${exam.seating1})` : ''}
                                      </div>
                                    )}
                                    {exam.room2 && (
                                      <div className="px-3 py-1 bg-indigo-50 text-indigo-800 font-bold text-xs rounded-xl border border-indigo-100/80 inline-flex items-center gap-1.5 self-start">
                                        🚪 Room {exam.room2} {exam.seating2 ? `(${exam.seating2})` : ''}
                                      </div>
                                    )}
                                    {!exam.room1 && !exam.room2 && (
                                      <span className="text-xs text-slate-400 italic">No Room Allocated</span>
                                    )}
                                  </div>

                                  {exam.totalStudents && (
                                    <div className="text-[10px] text-slate-400 font-semibold pt-1">
                                      Students: {exam.totalStudents} {exam.credits ? `• Credits: ${exam.credits}` : ""}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Desktop Table View (visible on medium & larger devices) */}
                        <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                                  <th className="py-4 px-6">Date</th>
                                  <th className="py-4 px-6">Course Title</th>
                                  <th className="py-4 px-6">Time</th>
                                  <th className="py-4 px-6">Rooms</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredSeatingExams.map((exam, idx) => {
                                  const isMorning = exam.session === "Morning";

                                  return (
                                    <tr key={idx} className="hover:bg-slate-50/40 transition duration-150">
                                      {/* Date column */}
                                      <td className="py-4.5 px-6 font-semibold text-slate-800 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-4.5 w-4.5 text-teal-600 shrink-0" />
                                          <div>
                                            <span className="text-slate-800">{exam.date}</span>
                                            <span className="text-xs text-slate-400 block font-normal mt-0.5">{exam.day}</span>
                                          </div>
                                        </div>
                                      </td>

                                      {/* Course title column */}
                                      <td className="py-4.5 px-6">
                                        <div className="font-semibold text-slate-800 leading-snug">
                                          {exam.courseTitle}
                                        </div>
                                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex flex-wrap items-center gap-x-2">
                                          <span>Code: {exam.courseCode}</span>
                                          {exam.teacher && (
                                            <>
                                              <span className="text-slate-300">•</span>
                                              <span>Teacher: {exam.teacher}</span>
                                            </>
                                          )}
                                        </div>
                                      </td>

                                      {/* Time column */}
                                      <td className="py-4.5 px-6 whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                          <span className={`self-start text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border ${
                                            isMorning 
                                              ? "bg-amber-50 text-amber-800 border-amber-200/50" 
                                              : "bg-indigo-50 text-indigo-800 border-indigo-200/50"
                                          }`}>
                                            {exam.session}
                                          </span>
                                          <span className="text-xs font-semibold text-slate-700 font-sans flex items-center gap-1.5 mt-0.5">
                                            <Clock className="h-3.5 w-3.5 text-teal-600/80 shrink-0" />
                                            {exam.time}
                                          </span>
                                        </div>
                                      </td>

                                      {/* Rooms column */}
                                      <td className="py-4.5 px-6">
                                        <div className="flex flex-col gap-1.5">
                                          {exam.room1 && (
                                            <div className="px-3 py-1 bg-teal-50 text-teal-800 font-bold text-xs rounded-xl border border-teal-100/80 inline-flex items-center gap-1.5 self-start">
                                              🚪 Room {exam.room1} {exam.seating1 ? `(${exam.seating1})` : ''}
                                            </div>
                                          )}
                                          {exam.room2 && (
                                            <div className="px-3 py-1 bg-indigo-50 text-indigo-800 font-bold text-xs rounded-xl border border-indigo-100/80 inline-flex items-center gap-1.5 self-start">
                                              🚪 Room {exam.room2} {exam.seating2 ? `(${exam.seating2})` : ''}
                                            </div>
                                          )}
                                          {!exam.room1 && !exam.room2 && (
                                            <span className="text-xs text-slate-400 italic">No Room Allocated</span>
                                          )}
                                        </div>
                                        {exam.totalStudents && (
                                          <span className="text-[10px] text-slate-400 font-semibold block mt-1 ml-1">
                                            Students: {exam.totalStudents} {exam.credits ? `• Credits: ${exam.credits}` : ""}
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

                        {/* EXAM ROUTINE NOTICE BANNER FOR SEATING VIEW */}
                        <div className="mt-6 bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-left shadow-sm max-w-7xl mx-auto w-full">
                          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-xs md:text-sm text-amber-800 leading-relaxed font-medium">
                            <strong className="font-extrabold text-amber-900">Notice:</strong> The information provided may contain missing or inaccurate data. Please refer to the official Schedule from UCam for confirmation.
                          </p>
                        </div>

                      </div>
                    ) : (
                      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center">
                        <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl mb-4">
                          <Calendar className="h-8 w-8" />
                        </div>
                        <h4 className="text-base font-bold text-slate-700">No matching exams scheduled</h4>
                        <p className="text-slate-500 max-w-md mt-1.5 text-sm">
                          There are currently no registered examinations found for <strong>{selectedDept}</strong> Batch <strong>{selectedBatch}</strong> Section <strong>{selectedSection}</strong> in this schedule.
                        </p>
                      </div>
                    )}
                  </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
