import React, { useState, useEffect } from "react";
import { db, doc, onSnapshot } from "../lib/firebase";
import { NoteHubItem, NoteCategory, ExamType } from "../types";
import { 
  BUFT_SEMESTERS, 
  BUFT_DEPARTMENTS, 
  INITIAL_NOTE_HUB_ITEMS 
} from "../data/sampleNoteHub";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, 
  HelpCircle, 
  FileCode, 
  Search, 
  ExternalLink, 
  Sparkles, 
  GraduationCap, 
  Calendar, 
  FileText, 
  FolderCheck,
  Building,
  User,
  Tag,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  ChevronRight
} from "lucide-react";

export default function NoteHub() {
  const [items, setItems] = useState<NoteHubItem[]>(INITIAL_NOTE_HUB_ITEMS);
  const [isLoading, setIsLoading] = useState(true);

  // Strict Progressive Step State Machine
  // Step 1: Semester
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  
  // Step 2: Department
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  
  // Step 3: Category ('notes' | 'questions' | 'lab_reports')
  const [selectedCategory, setSelectedCategory] = useState<NoteCategory | null>(null);
  
  // Step 3.5: Question Exam Type ('All' | 'SME' | 'SEE')
  const [selectedExamType, setSelectedExamType] = useState<'All' | ExamType | null>(null);

  // Step 4: Search Query
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Firestore Sync
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const docRef = doc(db, "settings", "notehub");
      unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (Array.isArray(data.items) && data.items.length > 0) {
              setItems(data.items);
            }
          }
          setIsLoading(false);
        },
        (error) => {
          console.warn("Firestore NoteHub error, using fallback sample items:", error);
          setIsLoading(false);
        }
      );
    } catch (e) {
      console.warn("Firestore NoteHub init error:", e);
      setIsLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Handlers for step resets
  const handleSelectSemester = (sem: string) => {
    setSelectedSemester(sem);
    // Reset subsequent steps
    setSelectedDepartment(null);
    setSelectedCategory(null);
    setSelectedExamType(null);
    setSearchQuery("");
  };

  const handleSelectDepartment = (dept: string) => {
    setSelectedDepartment(dept);
    // Reset subsequent steps
    setSelectedCategory(null);
    setSelectedExamType(null);
    setSearchQuery("");
  };

  const handleSelectCategory = (cat: NoteCategory) => {
    setSelectedCategory(cat);
    if (cat === "questions") {
      setSelectedExamType(null); // prompt user to pick SME or SEE or All
    } else {
      setSelectedExamType("All");
    }
    setSearchQuery("");
  };

  const handleResetAll = () => {
    setSelectedSemester(null);
    setSelectedDepartment(null);
    setSelectedCategory(null);
    setSelectedExamType(null);
    setSearchQuery("");
  };
 // Helper to normalize department names (e.g. "B.Sc. in CSE" -> "CSE")
  const formatDept = (dept: string) => {
    if (!dept) return "";
    return dept.replace(/^(B\.Sc\.\s*in\s*|B\.Sc\s*in\s*|B\.A\.\s*in\s*)/i, '').trim();
  };

  const isDeptMatch = (itemDept: string, selectedDept: string) => {
    if (selectedDept === "All Departments") return true;
    return formatDept(itemDept) === formatDept(selectedDept);
  };

  
  // Filtered items logic
  const isReadyToViewFiles = 
    selectedSemester !== null && 
    selectedDepartment !== null && 
    selectedCategory !== null && 
    (selectedCategory !== "questions" || selectedExamType !== null);

  const filteredItems = items.filter((item) => {
    if (!isReadyToViewFiles) return false;

    // 1. Semester match
    const matchSemester = item.semester === selectedSemester;
    
    // 2. Department match
    const matchDept = selectedDepartment === "All Departments" || item.department === selectedDepartment;

    // 3. Category match
    const matchCategory = item.category === selectedCategory;

    // 4. Questions Sub-option match (SME vs SEE)
    let matchExamType = true;
    if (selectedCategory === "questions" && selectedExamType && selectedExamType !== "All") {
      matchExamType = item.examType === selectedExamType;
    }

    // 5. Search query match
    const query = searchQuery.trim().toLowerCase();
    const matchQuery = !query || 
      item.title.toLowerCase().includes(query) ||
      (item.authorName && item.authorName.toLowerCase().includes(query)) ||
      (item.batch && item.batch.toLowerCase().includes(query)) ||
      (item.courseCode && item.courseCode.toLowerCase().includes(query)) ||
      (item.description && item.description.toLowerCase().includes(query)) ||
      item.department.toLowerCase().includes(query);

    return matchSemester && matchDept && matchCategory && matchExamType && matchQuery;
  });

  // Calculate counts per department in current selected semester
  const getDeptCountInSemester = (dept: string) => {
    if (!selectedSemester) return 0;
    return items.filter((item) => {
      const matchSemester = item.semester === selectedSemester;
      const matchDept = dept === "All Departments" || item.department === dept;
      return matchSemester && matchDept;
    }).length;
  };

  // Calculate counts per category in current selected semester & department
  const getCategoryCount = (cat: NoteCategory) => {
    if (!selectedSemester || !selectedDepartment) return 0;
    return items.filter((item) => {
      const matchSemester = item.semester === selectedSemester;
      const matchDept = selectedDepartment === "All Departments" || item.department === selectedDepartment;
      return matchSemester && matchDept && item.category === cat;
    }).length;
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 lg:px-8 py-8 lg:py-12 space-y-8 animate-fade-in font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Academic Resource HUB
              </span>
            </div>

            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white leading-tight">
              Note HUB
            </h1>

            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
             
            </p>
          </div>

          <div className="flex flex-wrap md:flex-col gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>8 Academic Semesters</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-teal-400 shrink-0" />
              <span>All BUFT Departments</span>
            </div>
            <div className="flex items-center gap-2">
              <FolderCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Verified Drive Files</span>
            </div>
          </div>
        </div>
      </div>

      {/* PROGRESS BREADCRUMBS / RESET BAR */}
      {(selectedSemester || selectedDepartment || selectedCategory) && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-950/80 border border-emerald-800/60 rounded-2xl p-4 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex flex-wrap items-center gap-2 font-medium">
            <span className="text-slate-400 font-bold">Selection Path:</span>
            
            {selectedSemester && (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-800/80 text-emerald-200 font-bold border border-emerald-700/60 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {selectedSemester}
              </span>
            )}

            {selectedDepartment && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                <span className="px-2.5 py-1 rounded-lg bg-teal-800/80 text-teal-200 font-bold border border-teal-700/60 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  {selectedDepartment}
                </span>
              </>
            )}

            {selectedCategory && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  {selectedCategory === "notes" ? "Note HUB" : selectedCategory === "questions" ? `Questions HUB (${selectedExamType || 'Pending Exam Category'})` : "Lab Reports HUB"}
                </span>
              </>
            )}
          </div>

          <button
            onClick={handleResetAll}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Start Over</span>
          </button>
        </motion.div>
      )}

      {/* STEP 1: SELECT SEMESTER (ALWAYS VISIBLE FIRST) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${selectedSemester ? "bg-emerald-100 text-emerald-700" : "bg-emerald-600 text-white shadow-md animate-pulse"}`}>
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                1. Select Semester
              </h2>
              <p className="text-[11px] text-slate-500">
                Choose your academic semester to reveal department options
              </p>
            </div>
          </div>

          {selectedSemester && (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
              ✓ {selectedSemester}
            </span>
          )}
        </div>

        {/* 8 Semester Selection Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {BUFT_SEMESTERS.map((sem) => {
            const isSelected = selectedSemester === sem;
            return (
              <button
                key={sem}
                onClick={() => handleSelectSemester(sem)}
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-b from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/20 scale-[1.03] ring-2 ring-emerald-500/40"
                    : "bg-slate-50 hover:bg-emerald-50/60 text-slate-700 border border-slate-200 hover:border-emerald-300"
                }`}
              >
                <span className="text-[10px] opacity-80">Semester</span>
                <span className="text-xs font-black">{sem.replace(" Semester", "")}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 2: SELECT DEPARTMENT (ONLY APPEARS AFTER SEMESTER IS SELECTED) */}
      <AnimatePresence>
        {selectedSemester && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${selectedDepartment ? "bg-teal-100 text-teal-700" : "bg-teal-600 text-white shadow-md animate-pulse"}`}>
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    2. Select Department ({selectedSemester})
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Select your specific department for {selectedSemester}
                  </p>
                </div>
              </div>

              {selectedDepartment && (
                <span className="text-xs font-bold text-teal-800 bg-teal-100 px-3 py-1 rounded-full border border-teal-200">
                  ✓ {selectedDepartment}
                </span>
              )}
            </div>

            {/* Department Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {["All Departments", ...BUFT_DEPARTMENTS].map((dept) => {
  const isSelected = selectedDepartment === dept;
  const count = getItemCountForDept(dept);

  return (
    <button
      key={dept}
      onClick={() => handleSelectDepartment(dept)}
      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
        isSelected
          ? "bg-emerald-600 text-white shadow-sm"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60"
      }`}
    >
      <span>{formatDept(dept)}</span>
      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
        isSelected ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-700"
      }`}>
        {count}
      </span>
    </button>
  );
})}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STEP 3: SELECT RESOURCE TYPE (NOTE HUB, QUESTIONS HUB, LAB REPORTS HUB) */}
      {/* ONLY APPEARS AFTER BOTH SEMESTER & DEPARTMENT ARE SELECTED */}
      <AnimatePresence>
        {selectedSemester && selectedDepartment && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-white shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-emerald-400">
                    3. Select Resource Type
                  </h2>
                  <p className="text-xs text-slate-400">
                    Choose whether you need lecture notes, exam question papers, or lab report guides
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-mono bg-slate-800 px-3 py-1 rounded-lg">
                  {selectedSemester} • {selectedDepartment}
                </span>
              </div>

              {/* 3 Categories Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Note Hub */}
                <button
                  onClick={() => handleSelectCategory("notes")}
                  className={`py-4 px-5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    selectedCategory === "notes"
                      ? "bg-emerald-600 text-white shadow-lg font-extrabold ring-2 ring-emerald-400/50 scale-[1.02]"
                      : "text-slate-300 hover:text-white hover:bg-slate-800 bg-slate-800/60 border border-slate-700/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 shrink-0 text-emerald-300" />
                    <div className="text-left">
                      <div className="text-sm font-bold">1. Note HUB</div>
                      <div className="text-[10px] text-emerald-200 font-normal">Lecture &amp; Topic Notes</div>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                    selectedCategory === "notes" ? "bg-emerald-800 text-white" : "bg-slate-800 text-slate-400"
                  }`}>
                    {getCategoryCount("notes")}
                  </span>
                </button>

                {/* 2. Questions Hub */}
                <button
                  onClick={() => handleSelectCategory("questions")}
                  className={`py-4 px-5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    selectedCategory === "questions"
                      ? "bg-emerald-600 text-white shadow-lg font-extrabold ring-2 ring-emerald-400/50 scale-[1.02]"
                      : "text-slate-300 hover:text-white hover:bg-slate-800 bg-slate-800/60 border border-slate-700/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 shrink-0 text-amber-300" />
                    <div className="text-left">
                      <div className="text-sm font-bold">2. Questions HUB</div>
                      <div className="text-[10px] text-amber-200 font-normal">Exam Papers (SME &amp; SEE)</div>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                    selectedCategory === "questions" ? "bg-emerald-800 text-white" : "bg-slate-800 text-slate-400"
                  }`}>
                    {getCategoryCount("questions")}
                  </span>
                </button>

                {/* 3. Lab Reports Hub */}
                <button
                  onClick={() => handleSelectCategory("lab_reports")}
                  className={`py-4 px-5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    selectedCategory === "lab_reports"
                      ? "bg-emerald-600 text-white shadow-lg font-extrabold ring-2 ring-emerald-400/50 scale-[1.02]"
                      : "text-slate-300 hover:text-white hover:bg-slate-800 bg-slate-800/60 border border-slate-700/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileCode className="w-5 h-5 shrink-0 text-purple-300" />
                    <div className="text-left">
                      <div className="text-sm font-bold">3. Lab Reports HUB</div>
                      <div className="text-[10px] text-purple-200 font-normal">Lab Manuals &amp; Reports</div>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                    selectedCategory === "lab_reports" ? "bg-emerald-800 text-white" : "bg-slate-800 text-slate-400"
                  }`}>
                    {getCategoryCount("lab_reports")}
                  </span>
                </button>
              </div>

              {/* QUESTIONS SUB-OPTIONS (SME & SEE BUTTONS) */}
              {selectedCategory === "questions" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-amber-500/30"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-amber-200 font-bold">
                      Select Examination Type:
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedExamType("All")}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedExamType === "All"
                          ? "bg-amber-400 text-slate-950 font-black shadow-md"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      All Exam Questions
                    </button>

                    <button
                      onClick={() => setSelectedExamType("SME")}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedExamType === "SME"
                          ? "bg-amber-400 text-slate-950 font-black shadow-md"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      SME (Sessional / Midterm)
                    </button>

                    <button
                      onClick={() => setSelectedExamType("SEE")}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedExamType === "SEE"
                          ? "bg-amber-400 text-slate-950 font-black shadow-md"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      SEE (Semester End Exam)
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STEP 4: SEARCH BAR & FILE LIST CARDS */}
      {/* ONLY APPEARS WHEN ALL STEPS ARE COMPLETE */}
      <AnimatePresence>
        {isReadyToViewFiles && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Search Bar & Result Counter */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="relative w-full sm:max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search title, author, batch (e.g. Batch 251)..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 transition-all outline-none"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <span>Found <strong className="text-slate-900">{filteredItems.length}</strong> items</span>
                <span className="text-emerald-800 font-bold bg-emerald-50 px-3 py-1 rounded-full text-[11px] border border-emerald-200">
                  {selectedSemester} • {selectedDepartment}
                </span>
              </div>
            </div>

            {/* FILE CARDS GRID */}
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div className="space-y-3">
                      {/* Category & Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1 ${
                          item.category === "notes" ? "bg-blue-50 text-blue-700 border border-blue-200/60" :
                          item.category === "questions" ? "bg-amber-50 text-amber-700 border border-amber-200/60" :
                          "bg-purple-50 text-purple-700 border border-purple-200/60"
                        }`}>
                          {item.category === "notes" && <BookOpen className="w-3 h-3" />}
                          {item.category === "questions" && <HelpCircle className="w-3 h-3" />}
                          {item.category === "lab_reports" && <FileCode className="w-3 h-3" />}
                          {item.category === "notes" ? "Note" : item.category === "questions" ? `Question (${item.examType || 'Exam'})` : "Lab Report"}
                        </span>

                        {/* Show Batch for Questions or CourseCode */}
                        {item.category === "questions" && item.batch ? (
                          <span className="text-xs font-mono font-extrabold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                            {item.batch}
                          </span>
                        ) : item.courseCode ? (
                          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {item.courseCode}
                          </span>
                        ) : null}
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-emerald-700 transition-colors">
                        {item.title}
                      </h3>

                      {/* AUTHOR / OWNER NAME FOR NOTES & LAB REPORTS */}
                      {item.authorName && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100/80 w-fit">
                          <User className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{item.category === "notes" ? "Prepared by:" : "Prepared by:"} {item.authorName}</span>
                        </div>
                      )}

                      {/* Course Code + Batch Info for Questions */}
                      {item.category === "questions" && (item.courseCode || item.batch) && (
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
                          {item.courseCode && <span className="font-bold">Course: {item.courseCode}</span>}
                          {item.batch && <span className="bg-slate-100 px-2 py-0.5 rounded">{item.batch}</span>}
                        </div>
                      )}

                      {/* Description */}
                      {item.description && (
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      {/* Department & Semester Meta */}
                      <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
  {formatDept(item.department)}
</span>
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                          {item.semester}
                        </span>
                      </div>
                    </div>

                    {/* File Link Button */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {item.fileType || "Drive Attached File"}
                      </span>

                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
                      >
                        <span>Open File</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <FileText className="w-8 h-8" />
                </div>

                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-base font-bold text-slate-900">
                    No resources found
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    There are no items uploaded for <strong className="text-slate-800">{selectedSemester}</strong> in <strong className="text-slate-800">{selectedDepartment}</strong> under <strong className="text-slate-800">{selectedCategory === "notes" ? "Note Hub" : selectedCategory === "questions" ? `Questions Hub (${selectedExamType || 'All'})` : "Lab Reports Hub"}</strong>.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedDepartment("All Departments");
                      if (selectedCategory === "questions") setSelectedExamType("All");
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                  >
                    View All Departments
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
