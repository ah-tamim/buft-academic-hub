import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Download, 
  RotateCcw, 
  TrendingUp, 
  BookOpen, 
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  Award,
  ChevronRight,
  GraduationCap
} from 'lucide-react';

// Grading map based on BUFT standard
export const GRADE_POINTS: Record<string, number> = {
  'A+': 4.00,
  'A': 3.75,
  'A-': 3.50,
  'B+': 3.25,
  'B': 3.00,
  'B-': 2.75,
  'C+': 2.50,
  'C': 2.25,
  'D': 2.00,
  'F': 0.00
};

export interface Course {
  id: string;
  title: string;
  credit: string;
  grade: string;
}

export interface Semester {
  id: string;
  name: string;
  courses: Course[];
}

export function CgpaCalculator() {
  const [semesters, setSemesters] = useState<Semester[]>(() => {
    try {
      const saved = localStorage.getItem('buft_cgpa_data_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading CGPA data from localStorage', e);
    }
    // Default: start with one semester containing one course
    return [
      {
        id: 'sem-1',
        name: 'Semester 1',
        courses: [
          { id: 'c-1-1', title: 'Course 1', credit: '3', grade: 'A+' }
        ]
      }
    ];
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('buft_cgpa_data_v1', JSON.stringify(semesters));
  }, [semesters]);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [deletingSemId, setDeletingSemId] = useState<string | null>(null);

  // Actions
  const addSemester = () => {
    const nextNum = semesters.length + 1;
    const newSem: Semester = {
      id: `sem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `Semester ${nextNum}`,
      courses: [
        { id: `c-${Date.now()}-1`, title: 'Course 1', credit: '3', grade: 'A+' }
      ]
    };
    setSemesters([...semesters, newSem]);
  };

  const removeSemester = (semId: string) => {
    setSemesters(semesters.filter(s => s.id !== semId));
  };

  const renameSemester = (semId: string, newName: string) => {
    setSemesters(semesters.map(s => s.id === semId ? { ...s, name: newName } : s));
  };

  const addCourse = (semId: string) => {
    setSemesters(semesters.map(s => {
      if (s.id === semId) {
        const nextIdx = s.courses.length + 1;
        return {
          ...s,
          courses: [
            ...s.courses,
            {
              id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              title: `Course ${nextIdx}`,
              credit: '3',
              grade: 'A+'
            }
          ]
        };
      }
      return s;
    }));
  };

  const removeCourse = (semId: string, courseId: string) => {
    setSemesters(semesters.map(s => {
      if (s.id === semId) {
        return {
          ...s,
          courses: s.courses.filter(c => c.id !== courseId)
        };
      }
      return s;
    }));
  };

  const updateCourse = (semId: string, courseId: string, patch: Partial<Course>) => {
    setSemesters(semesters.map(s => {
      if (s.id === semId) {
        return {
          ...s,
          courses: s.courses.map(c => c.id === courseId ? { ...c, ...patch } : c)
        };
      }
      return s;
    }));
  };

  const clearAll = () => {
    setSemesters([
      {
        id: 'sem-1',
        name: 'Semester 1',
        courses: [
          { id: 'c-1-1', title: 'Course 1', credit: '3', grade: 'A+' }
        ]
      }
    ]);
    setShowResetConfirm(false);
  };

  // Calculations
  const computeSemesterGPA = (sem: Semester) => {
    let sum = 0;
    let credits = 0;
    for (const c of sem.courses) {
      const pts = GRADE_POINTS[c.grade];
      const cr = parseFloat(c.credit);
      if (typeof pts === 'number' && !isNaN(cr)) {
        sum += pts * cr;
        credits += cr;
      }
    }
    return credits === 0 ? { gpa: null, credits: 0 } : { gpa: sum / credits, credits };
  };

  const computeAll = () => {
    const results = semesters.map(s => {
      const { gpa, credits } = computeSemesterGPA(s);
      return {
        id: s.id,
        name: s.name,
        gpa,
        credits
      };
    });

    let totalPoints = 0;
    let totalCredits = 0;
    for (const r of results) {
      if (r.gpa !== null) {
        totalPoints += r.gpa * r.credits;
        totalCredits += r.credits;
      }
    }

    const cgpa = totalCredits > 0 ? totalPoints / totalCredits : null;
    return { results, cgpa, totalCredits };
  };

  const { results, cgpa, totalCredits } = computeAll();
  const latestGPA = results.length > 0 ? results[results.length - 1].gpa : null;

  // CSV Download
  const downloadCSV = () => {
    const rows = [['Semester', 'Course Title', 'Grade', 'Grade Point', 'Credit', 'Semester GPA']];
    semesters.forEach((s, idx) => {
      const semGPA = results[idx] && results[idx].gpa !== null ? results[idx].gpa!.toFixed(2) : '';
      if (s.courses.length === 0) {
        rows.push([s.name, '', '', '', '', semGPA]);
      }
      s.courses.forEach(c => {
        const gp = GRADE_POINTS[c.grade] !== undefined ? GRADE_POINTS[c.grade].toFixed(2) : '';
        rows.push([s.name, c.title, c.grade, gp, c.credit, semGPA]);
      });
    });

    const csvContent = rows.map(r => r.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buft_cgpa_report_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Find max GPA for scaling chart
  const maxGPA = Math.max(4.0, ...results.map(r => r.gpa || 0));

  return (
    <div className="w-full max-w-5xl mx-auto mt-12 bg-white/60 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-xl overflow-hidden" id="cgpa-calculator-section">
      {/* HEADER BAR */}
      <div className="bg-slate-900 text-white p-6 md:p-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="bg-indigo-500/20 p-3 rounded-2xl text-indigo-400 mt-1 shrink-0">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-indigo-500 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-md">
                  BUFT Standard
                </span>
                <span className="text-[11px] text-slate-300">Grade Point Evaluation </span>
              </div>
              <h3 className="text-xl md:text-2xl font-black tracking-tight">Academic CGPA Calculator</h3>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed mt-1">
                Calculate your semester GPA and overall cumulative grade points. Follows the official BUFT grading protocol (A+ → F). Enter your semesters and courses below.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto mt-2 md:mt-0">
            <button
              onClick={addSemester}
              className="flex-1 md:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Semester</span>
            </button>
            {showResetConfirm ? (
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl animate-fade-in text-xs">
                <span className="text-red-400 font-extrabold text-[11px] uppercase tracking-wider">Reset all?</span>
                <button
                  onClick={clearAll}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-550 text-white text-[10px] font-bold rounded-lg transition cursor-pointer"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-2.5 py-1 bg-slate-700 hover:bg-slate-650 text-slate-200 text-[10px] font-bold rounded-lg transition cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-3 py-2.5 border border-slate-700 hover:border-slate-600 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Clear All Semesters"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="md:hidden lg:inline">Reset</span>
              </button>
            )}
            <button
              onClick={downloadCSV}
              className="px-3 py-2.5 border border-slate-700 hover:border-slate-600 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              title="Download CSV Spreadsheet"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="md:hidden lg:inline">CSV Report</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80 bg-white/40">
        
        {/* LEFT/CENTER 2 COLS: SEMESTER EDITOR */}
        <div className="lg:col-span-2 p-6 space-y-6 max-h-[640px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200/80">
          
          {semesters.length === 0 ? (
            <div className="text-center py-12 px-4">
              <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-3" />
              <h4 className="font-extrabold text-slate-800 text-sm">No Semesters Added</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                Add a semester using the header button to start managing and evaluating your academic grade records.
              </p>
              <button
                onClick={addSemester}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Semester 1</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {semesters.map((sem, sIdx) => {
                const semSummary = computeSemesterGPA(sem);
                return (
                  <div key={sem.id} className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden p-5 transition-all hover:border-indigo-200/80 hover:shadow-md">
                    
                    {/* Semester Header */}
                    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-indigo-50 text-indigo-700 h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold">
                          {sIdx + 1}
                        </div>
                        <input
                          type="text"
                          value={sem.name}
                          onChange={(e) => renameSemester(sem.id, e.target.value)}
                          className="font-extrabold text-sm text-slate-800 bg-transparent hover:bg-slate-50 focus:bg-slate-50 border border-transparent hover:border-slate-200 focus:border-indigo-400 px-1.5 py-0.5 rounded transition focus:outline-none focus:ring-1 focus:ring-indigo-400 max-w-[140px] md:max-w-[200px]"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        {semSummary.gpa !== null && (
                          <div className="px-2.5 py-1 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs font-extrabold text-indigo-700">
                            GPA: {semSummary.gpa.toFixed(2)}
                          </div>
                        )}
                        <button
                          onClick={() => addCourse(sem.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-[11px] font-bold rounded-lg transition border border-transparent hover:border-indigo-100 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Course</span>
                        </button>
                        {deletingSemId === sem.id ? (
                          <div className="flex items-center gap-1 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-lg animate-fade-in text-[11px]">
                            <span className="text-red-600 font-extrabold mr-1">Delete?</span>
                            <button
                              onClick={() => {
                                removeSemester(sem.id);
                                setDeletingSemId(null);
                              }}
                              className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[9px] font-bold rounded cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeletingSemId(null)}
                              className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px] font-bold rounded cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setDeletingSemId(sem.id);
                            }}
                            className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                            title="Delete Semester"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Courses List */}
                    {sem.courses.length === 0 ? (
                      <div className="text-center py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200/80">
                        <p className="text-xs text-slate-500 font-medium">No courses in this semester yet.</p>
                        <button
                          onClick={() => addCourse(sem.id)}
                          className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Add first course</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sem.courses.map((c, cIdx) => (
                          <div 
                            key={c.id} 
                            className="bg-slate-50/50 hover:bg-white border border-slate-100 hover:border-slate-200 rounded-xl p-3.5 transition-all flex flex-col md:flex-row items-stretch md:items-center gap-3"
                          >
                            {/* Course name */}
                            <div className="flex-1 flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 min-w-[15px]">{cIdx + 1}</span>
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={c.title}
                                  placeholder="Course Title or Code"
                                  onChange={(e) => updateCourse(sem.id, c.id, { title: e.target.value })}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                />
                              </div>
                            </div>

                            {/* Controls: Grade, Credit, Delete */}
                            <div className="flex items-center gap-2.5 justify-between md:justify-end shrink-0">
                              <div className="flex items-center gap-2">
                                {/* Grade Selector */}
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide md:hidden">Grade</span>
                                  <select
                                    value={c.grade}
                                    onChange={(e) => updateCourse(sem.id, c.id, { grade: e.target.value })}
                                    className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
                                  >
                                    {Object.keys(GRADE_POINTS).map(g => (
                                      <option key={g} value={g}>{g} ({GRADE_POINTS[g].toFixed(2)})</option>
                                    ))}
                                  </select>
                                </div>

                                {/* Credit Selector */}
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide md:hidden">Credit</span>
                                  <select
                                    value={c.credit}
                                    onChange={(e) => updateCourse(sem.id, c.id, { credit: e.target.value })}
                                    className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
                                  >
                                    {['0.5', '1.0', '1.5', '2.0', '3.0', '4.0'].map(v => (
                                      <option key={v} value={parseFloat(v).toString()}>{v} Credits</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <button
                                onClick={() => removeCourse(sem.id, c.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                                title="Remove Course"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

          {/* BUFT Grading Scale Footnote */}
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
            <HelpCircle className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 font-bold block mb-0.5">BUFT Official Grading Scale:</strong>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-y-1 gap-x-2 font-medium">
                <span>A+ (4.00) &ge; 80%</span>
                <span>A (3.75) 75-79%</span>
                <span>A- (3.50) 70-74%</span>
                <span>B+ (3.25) 65-69%</span>
                <span>B (3.00) 60-64%</span>
                <span>B- (2.75) 55-59%</span>
                <span>C+ (2.50) 50-54%</span>
                <span>C (2.25) 45-49%</span>
                <span>D (2.00) 40-44%</span>
                <span>F (0.00) &lt; 40%</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT 1 COL: RESULTS & CHARTS */}
        <div className="p-6 bg-slate-50/40 flex flex-col justify-between gap-6">
          
          {/* STATS OVERVIEW CARDS */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest">result Summary</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Semesters</span>
                <span className="text-2xl font-black text-slate-900">{semesters.length}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Credits</span>
                <span className="text-2xl font-black text-slate-900">{totalCredits.toFixed(1)}</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3.5">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800">Final Results</span>
                <TrendingUp className="h-4 w-4 text-indigo-500" />
              </div>

              <div className="grid grid-cols-2 divide-x divide-slate-100">
                <div className="text-center pr-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Latest Sem. GPA</span>
                  <span className="text-xl font-black text-indigo-600">
                    {latestGPA !== null ? latestGPA.toFixed(2) : '-'}
                  </span>
                </div>
                <div className="text-center pl-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Cumulative CGPA</span>
                  <span className="text-2xl font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg inline-block">
                    {cgpa !== null ? cgpa.toFixed(2) : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* VISUAL GPA BAR CHART */}
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[220px]">
            <div className="border-b border-slate-100 pb-2 mb-3 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800">Semester GPA Chart</span>
              <Award className="h-4 w-4 text-indigo-500" />
            </div>

            {results.length === 0 || !results.some(r => r.gpa !== null) ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6 text-slate-400">
                <p className="text-xs font-medium">Add courses with grade marks to see your GPA chart progress.</p>
              </div>
            ) : (
              <div className="flex-1 flex items-end justify-center gap-3.5 h-[140px] pt-4 px-2">
                {results.map((r, i) => {
                  const hasGPA = r.gpa !== null;
                  const percent = hasGPA ? (r.gpa! / maxGPA) * 100 : 0;
                  return (
                    <div key={r.id || i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                      
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-1 bg-slate-800 text-white font-extrabold text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none whitespace-nowrap shadow-md">
                        {hasGPA ? `GPA: ${r.gpa!.toFixed(2)}` : 'No grades'}
                        <div className="w-1.5 h-1.5 bg-slate-800 rotate-45 mx-auto -mb-1 mt-0.5"></div>
                      </div>

                      {/* Animated GPA bar */}
                      <div className="w-full bg-slate-100 rounded-t-md overflow-hidden flex items-end h-full">
                        <div 
                          className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md transition-all duration-500 relative"
                          style={{ height: `${percent}%` }}
                        >
                          {hasGPA && r.gpa! >= 3.75 && (
                            <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/60 animate-ping"></span>
                          )}
                        </div>
                      </div>

                      {/* Value label */}
                      <span className="text-[10px] font-extrabold text-indigo-700">
                        {hasGPA ? r.gpa!.toFixed(2) : '-'}
                      </span>

                      {/* Semester name */}
                      <span className="text-[9px] font-bold text-slate-400 max-w-[50px] truncate text-center" title={r.name}>
                        Sem {i + 1}
                      </span>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* QUOTE / TIP */}
          <div className="bg-indigo-50/50 border border-indigo-100/40 rounded-xl p-3 text-[10px] text-indigo-700/80 font-medium leading-relaxed">
            <span className="font-bold text-indigo-800 uppercase block mb-0.5">Pro-Tip for Printing:</span>
            Generate your covers first, and use this workspace to secure and track your grades! Keep this tool handy for regular semester planning.
          </div>

        </div>

      </div>

    </div>
  );
}
