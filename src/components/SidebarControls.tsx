import React, { useState } from 'react';
import { CoverPageState, IndexRow } from '../types';
import { downloadA4PDF } from '../utils/pdfGenerator';
import { 
  COLOR_PRESETS, 
  FONT_PRESETS, 
  DEPARTMENTS, 
  DESIGNATIONS 
} from '../data';
import { 
  BookOpen, 
  GraduationCap, 
  User, 
  Sliders, 
  Table, 
  Upload, 
  Plus, 
  Trash2, 
  RotateCcw, 
  FileText,
  Printer,
  Sparkles,
  Layers,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface SidebarControlsProps {
  state: CoverPageState;
  onChange: (newState: Partial<CoverPageState>) => void;
  indexRows: IndexRow[];
  setIndexRows: React.Dispatch<React.SetStateAction<IndexRow[]>>;
  activeTab: 'lab' | 'assignment' | 'index';
  setActiveTab: (tab: 'lab' | 'assignment' | 'index') => void;
}

export const SidebarControls: React.FC<SidebarControlsProps> = ({
  state,
  onChange,
  indexRows,
  setIndexRows,
  activeTab,
  setActiveTab,
}) => {
  // Collapsible accordion state tracker
  const [openSection, setOpenSection] = useState<string>('document');

  // Local state for index table input row
  const [newRowNo, setNewRowNo] = useState('');
  const [newRowName, setNewRowName] = useState('');
  const [newRowPerfDate, setNewRowPerfDate] = useState('');
  const [newRowSubDate, setNewRowSubDate] = useState('');
  const [newRowPage, setNewRowPage] = useState('');
  const [newRowRemarks, setNewRowRemarks] = useState('');
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  // Custom inline confirmations to replace window.confirm
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Toggle sections helper
  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? '' : section);
  };

  // Base64 custom logo uploader helper
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange({ customLogo: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Index Page rows actions
  const handleAddOrUpdateRow = () => {
    if (!newRowName.trim()) {
      alert('Experiment Name is required.');
      return;
    }

    const calculatedNo = newRowNo.trim() || String(indexRows.length + 1).padStart(2, '0');

    if (editingRowId) {
      // Update existing
      setIndexRows(prev => prev.map(r => r.id === editingRowId ? {
        ...r,
        no: calculatedNo,
        name: newRowName.trim(),
        performanceDate: newRowPerfDate.trim(),
        submissionDate: newRowSubDate.trim(),
        pageNo: newRowPage.trim(),
        remarks: newRowRemarks.trim(),
      } : r));
      setEditingRowId(null);
    } else {
      // Add new
      const newRow: IndexRow = {
        id: Date.now().toString(),
        no: calculatedNo,
        name: newRowName.trim(),
        performanceDate: newRowPerfDate.trim() || state.submissionDate,
        submissionDate: newRowSubDate.trim() || state.submissionDate,
        pageNo: newRowPage.trim(),
        remarks: newRowRemarks.trim(),
      };
      setIndexRows(prev => [...prev, newRow]);
    }

    // Reset inputs
    setNewRowNo('');
    setNewRowName('');
    setNewRowPerfDate('');
    setNewRowSubDate('');
    setNewRowPage('');
    setNewRowRemarks('');
  };

  const handleEditRow = (row: IndexRow) => {
    setNewRowNo(row.no);
    setNewRowName(row.name);
    setNewRowPerfDate(row.performanceDate);
    setNewRowSubDate(row.submissionDate);
    setNewRowPage(row.pageNo);
    setNewRowRemarks(row.remarks);
    setEditingRowId(row.id);
  };

  const handleDeleteRow = (id: string) => {
    setIndexRows(prev => prev.filter(r => r.id !== id));
    if (editingRowId === id) {
      setEditingRowId(null);
    }
  };

  const moveRow = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= indexRows.length) return;
    
    const updated = [...indexRows];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    setIndexRows(updated);
  };

  const handleAutofillSequence = () => {
    const updated = indexRows.map((r, idx) => ({
      ...r,
      no: String(idx + 1).padStart(2, '0')
    }));
    setIndexRows(updated);
  };

  return (
    <div className="w-full lg:w-[410px] shrink-0 bg-slate-50 text-slate-800 flex flex-col h-full lg:h-[calc(100vh-2rem)] border-r border-slate-200 shadow-2xl no-print relative font-sans">
      {/* BRAND HEADER & LOGO */}
      <div className="p-5 border-b border-slate-200 bg-white flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-pink-500 to-indigo-500 p-2 rounded-xl text-white shadow-lg">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-indigo-600">
              BUFT ACADEMIC HUB
            </h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Cover Page Generating Tool
            </p>
          </div>
        </div>

        {showResetConfirm ? (
          <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2 py-1 rounded-xl text-[10px] animate-fade-in font-semibold">
            <span className="text-rose-600 font-extrabold uppercase">Reset?</span>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold cursor-pointer"
            >
              Yes
            </button>
            <button 
              onClick={() => setShowResetConfirm(false)}
              className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-bold cursor-pointer"
            >
              No
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setShowResetConfirm(true)}
            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
            title="Reset defaults"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* CORE WORKSPACE TYPE TAB SELECTORS */}
      <div className="px-5 pt-4 pb-2 bg-slate-100/50 border-b border-slate-200/50">
        <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2">
          Select Document Category
        </label>
        <div className="grid grid-cols-3 gap-1.5 bg-slate-200/60 p-1 rounded-xl border border-slate-200/40">
          <button
            onClick={() => setActiveTab('lab')}
            className={`py-2 px-1 rounded-lg text-xs font-extrabold transition flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'lab'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Lab Report</span>
          </button>
          <button
            onClick={() => setActiveTab('assignment')}
            className={`py-2 px-1 rounded-lg text-xs font-extrabold transition flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'assignment'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Assignment</span>
          </button>
          <button
            onClick={() => setActiveTab('index')}
            className={`py-2 px-1 rounded-lg text-xs font-extrabold transition flex flex-col items-center gap-1 cursor-pointer ${
              activeTab === 'index'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <Table className="h-3.5 w-3.5" />
            <span>Index Page</span>
          </button>
        </div>
      </div>

      {/* SCROLLABLE CONTROL ACCORDION PANELS */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
        
        {/* SECTION 1: COVER DETAILS & INDEX METADATA */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
          <button
            onClick={() => toggleSection('document')}
            className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-left hover:bg-slate-50 transition text-slate-700 uppercase tracking-wider cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-pink-500" />
              <span>1. {activeTab === 'index' ? 'Index Page Metadata' : 'Cover Page Content'}</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform text-slate-400 ${openSection === 'document' ? 'rotate-180' : ''}`} />
          </button>

          {openSection === 'document' && (
            <div className="p-4 border-t border-slate-100 space-y-3.5 bg-slate-50/40">
              {activeTab === 'lab' && (
                <div className="bg-gradient-to-r from-pink-500/10 to-indigo-500/10 p-3 rounded-xl border border-pink-100/50 mb-3 flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-pink-700">Lab Report Format Style</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onChange({ labFormat: 'plain' })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition border cursor-pointer text-center ${
                        state.labFormat !== 'obe'
                          ? 'bg-pink-600 text-white border-pink-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Plain Format
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange({ labFormat: 'obe' })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition border cursor-pointer text-center ${
                        state.labFormat === 'obe'
                          ? 'bg-pink-600 text-white border-pink-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      OBE Format
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'lab' && state.labFormat === 'obe' && (
                <div className="bg-white/80 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">OBE Custom Fields</div>
                  
                  {/* Department Custom Fields (Unsynchronized) */}
                  <div className="space-y-3.5">
                    {/* Full Department Name */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Full Department Name (Top Header)</label>
                      <select
                        value={
                          ['Textile Engineering', 'Textile Engineering & Management', 'Apparel Manufacturing & Technology', 'Apparel Merchandising & Management', 'Fashion Design & Technology'].includes(state.studentDept || '')
                            ? state.studentDept
                            : 'custom'
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val !== 'custom') {
                            onChange({ 
                              studentDept: val,
                              teacherDept: val
                            });
                          }
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-pink-500 transition cursor-pointer shadow-sm mb-1.5"
                      >
                        <option value="Textile Engineering">Textile Engineering</option>
                        <option value="Textile Engineering & Management">Textile Engineering & Management</option>
                        <option value="Apparel Manufacturing & Technology">Apparel Manufacturing & Technology</option>
                        <option value="Apparel Merchandising & Management">Apparel Merchandising & Management</option>
                        <option value="Fashion Design & Technology">Fashion Design & Technology</option>
                        <option value="custom">✍️ Write Custom Full Name...</option>
                      </select>
                      
                      <input
                        type="text"
                        value={state.studentDept || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          onChange({ 
                            studentDept: val,
                            teacherDept: val
                          });
                        }}
                        placeholder="Write full department name"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-pink-500 transition shadow-sm placeholder-slate-400"
                      />
                    </div>

                    {/* Department Short Form */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Department Short Form (Table Cell)</label>
                      <select
                        value={
                          ['TE', 'TEM', 'AMT', 'AMM', 'FDT'].includes(state.obeShortDept || '')
                            ? state.obeShortDept
                            : 'custom'
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val !== 'custom') {
                            onChange({ obeShortDept: val });
                          }
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-pink-500 transition cursor-pointer shadow-sm mb-1.5"
                      >
                        <option value="TE">TE</option>
                        <option value="TEM">TEM</option>
                        <option value="AMT">AMT</option>
                        <option value="AMM">AMM</option>
                        <option value="FDT">FDT</option>
                        <option value="custom">✍️ Write Custom Short Form...</option>
                      </select>

                      <input
                        type="text"
                        value={state.obeShortDept || ''}
                        onChange={(e) => {
                          onChange({ obeShortDept: e.target.value.toUpperCase() });
                        }}
                        placeholder="Write short form (e.g. TE)"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-pink-500 transition shadow-sm placeholder-slate-400 font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Semester selection */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Semester</label>
                    <select
                      value={state.obeSemester || 'Spring 2026'}
                      onChange={(e) => onChange({ obeSemester: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-pink-500 transition cursor-pointer shadow-sm"
                    >
                      <option value="Spring 2026">Spring 2026</option>
                      <option value="Fall 2026">Fall 2026</option>
                      <option value="Spring 2027">Spring 2027</option>
                      <option value="Fall 2027">Fall 2027</option>
                      <option value="Spring 2028">Spring 2028</option>
                      <option value="Fall 2028">Fall 2028</option>
                      <option value="Spring 2029">Spring 2029</option>
                      <option value="Fall 2029">Fall 2029</option>
                      <option value="Spring 2030">Spring 2030</option>
                      <option value="Fall 2030">Fall 2030</option>
                    </select>
                    <input
                      type="text"
                      value={state.obeSemester || ''}
                      onChange={(e) => onChange({ obeSemester: e.target.value })}
                      placeholder="Or write custom semester"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-pink-500 transition mt-1.5 shadow-sm placeholder-slate-400"
                    />
                  </div>

                  {/* Course Supervisor */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Course Supervisor (Teacher)</label>
                    <input
                      type="text"
                      value={state.obeSupervisor || ''}
                      onChange={(e) => {
                        onChange({ 
                          obeSupervisor: e.target.value,
                          teacherName: e.target.value // Sync for standard fields compatibility
                        });
                      }}
                      placeholder="e.g. Dr. Md. Mostafizur Rahman"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-pink-500 transition shadow-sm placeholder-slate-400"
                    />
                  </div>

                  {/* Category & Level/Term */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Category</label>
                      <input
                        type="text"
                        value={state.obeCategory || ''}
                        onChange={(e) => onChange({ obeCategory: e.target.value })}
                        placeholder="e.g. Major"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-pink-500 transition shadow-sm placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Level & Term</label>
                      <input
                        type="text"
                        value={state.obeLevelTerm || ''}
                        onChange={(e) => onChange({ obeLevelTerm: e.target.value })}
                        placeholder="e.g. L2 T2"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-pink-500 transition shadow-sm placeholder-slate-400"
                      />
                    </div>
                  </div>

                  {/* Contact Hours L-T-P-C */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Contact Hours / Week (L - T - P - C)</label>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block text-center mb-0.5">L</span>
                        <input
                          type="text"
                          value={state.obeL || ''}
                          onChange={(e) => onChange({ obeL: e.target.value })}
                          className="w-full text-center bg-white border border-slate-200 rounded-lg py-1 text-xs text-slate-800 focus:outline-none focus:border-pink-500 transition shadow-sm"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block text-center mb-0.5">T</span>
                        <input
                          type="text"
                          value={state.obeT || ''}
                          onChange={(e) => onChange({ obeT: e.target.value })}
                          className="w-full text-center bg-white border border-slate-200 rounded-lg py-1 text-xs text-slate-800 focus:outline-none focus:border-pink-500 transition shadow-sm"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block text-center mb-0.5">P</span>
                        <input
                          type="text"
                          value={state.obeP || ''}
                          onChange={(e) => onChange({ obeP: e.target.value })}
                          className="w-full text-center bg-white border border-slate-200 rounded-lg py-1 text-xs text-slate-800 focus:outline-none focus:border-pink-500 transition shadow-sm"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block text-center mb-0.5">C</span>
                        <input
                          type="text"
                          value={state.obeC || ''}
                          onChange={(e) => onChange({ obeC: e.target.value })}
                          className="w-full text-center bg-white border border-slate-200 rounded-lg py-1 text-xs text-slate-800 focus:outline-none focus:border-pink-500 transition shadow-sm font-bold text-pink-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CLO / PLO / C-Level */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">CLO</label>
                      <input
                        type="text"
                        value={state.obeClo || ''}
                        onChange={(e) => onChange({ obeClo: e.target.value })}
                        placeholder="e.g. CLO1"
                        className="w-full text-center bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-pink-500 transition shadow-sm placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">PLO</label>
                      <input
                        type="text"
                        value={state.obePlo || ''}
                        onChange={(e) => onChange({ obePlo: e.target.value })}
                        placeholder="e.g. PLO2"
                        className="w-full text-center bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-pink-500 transition shadow-sm placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">C-Level</label>
                      <input
                        type="text"
                        value={state.obeClevel || ''}
                        onChange={(e) => onChange({ obeClevel: e.target.value })}
                        placeholder="e.g. C3"
                        className="w-full text-center bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-pink-500 transition shadow-sm placeholder-slate-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Course Code</label>
                <input
                  type="text"
                  value={state.courseCode}
                  onChange={(e) => onChange({ courseCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. TEX 07232206"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition shadow-sm placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Course Title</label>
                <input
                  type="text"
                  value={state.courseTitle}
                  onChange={(e) => onChange({ courseTitle: e.target.value })}
                  placeholder="e.g. Wet Processing Engineering-I"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition shadow-sm placeholder-slate-400"
                />
              </div>

              {activeTab === 'lab' && (
                <>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-1">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Exp No.</label>
                      <input
                        type="text"
                        value={state.experimentNo}
                        onChange={(e) => onChange({ experimentNo: e.target.value })}
                        placeholder="e.g. 01"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-center text-slate-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition shadow-sm placeholder-slate-400"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Experiment Name / Title</label>
                      <textarea
                        rows={2}
                        value={state.experimentName}
                        onChange={(e) => onChange({ experimentName: e.target.value })}
                        placeholder="Enter experiment details"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition shadow-sm placeholder-slate-400 resize-none leading-relaxed"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'assignment' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Assignment Topic</label>
                  <textarea
                    rows={3}
                    value={state.assignmentTopic}
                    onChange={(e) => onChange({ assignmentTopic: e.target.value })}
                    placeholder="e.g. Application of Smart Textiles..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition shadow-sm placeholder-slate-400 resize-none leading-relaxed"
                  />
                </div>
              )}
            
         {activeTab === 'index' && (
                <div className="space-y-3.5 pt-3.5 border-t border-slate-200/60">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={state.studentName}
                      onChange={(e) => onChange({ studentName: e.target.value })}
                      placeholder="Your Name"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition shadow-sm placeholder-slate-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">ID</label>
                      <input
                        type="text"
                        value={state.studentId}
                        onChange={(e) => onChange({ studentId: e.target.value })}
                        placeholder="e.g. 242-520-801"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition shadow-sm placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Section</label>
                      <input
                        type="text"
                        value={state.studentSection}
                        onChange={(e) => onChange({ studentSection: e.target.value })}
                        placeholder="e.g. 5A"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition shadow-sm placeholder-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Batch</label>
                      <input
                        type="text"
                        value={state.studentBatch}
                        onChange={(e) => onChange({ studentBatch: e.target.value })}
                        placeholder="e.g. 242"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition shadow-sm placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Department</label>
                      <input
                        type="text"
                        list="index-student-depts"
                        value={state.studentDept}
                        onChange={(e) => onChange({ studentDept: e.target.value })}
                        placeholder="e.g. Textile Engineering"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition shadow-sm placeholder-slate-400"
                      />
                      <datalist id="index-student-depts">
                        {DEPARTMENTS.map(d => (
                          <option key={d} value={d} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>
              )}
              </div>
          )}
        </div>

        {/* SECTION 2: SUBMITTED TO (TEACHER) */}
        {activeTab !== 'index' && !(activeTab === 'lab' && state.labFormat === 'obe') && (
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <button
              onClick={() => toggleSection('teacher')}
              className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-left hover:bg-slate-50 transition text-slate-700 uppercase tracking-wider cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-emerald-500" />
                <span>2. Submitted To (Teacher)</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform text-slate-400 ${openSection === 'teacher' ? 'rotate-180' : ''}`} />
            </button>

            {openSection === 'teacher' && (
              <div className="p-4 border-t border-slate-100 space-y-3.5 bg-slate-50/40">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Teacher's Name</label>
                  <input
                    type="text"
                    value={state.teacherName}
                    onChange={(e) => onChange({ teacherName: e.target.value })}
                    placeholder="e.g. Dr. Md. Mostafizur Rahman"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition shadow-sm placeholder-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Designation</label>
                    <select
                      value={state.teacherDesignation}
                      onChange={(e) => onChange({ teacherDesignation: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500 transition cursor-pointer"
                    >
                      {DESIGNATIONS.map(d => (
                        <option key={d} value={d} className="bg-white">{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Or write custom</label>
                    <input
                      type="text"
                      value={state.teacherDesignation}
                      onChange={(e) => onChange({ teacherDesignation: e.target.value })}
                      placeholder="e.g. Senior Lecturer"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition placeholder-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Department (Pick or write custom)</label>
                  <input
                    type="text"
                    list="teacher-depts"
                    value={state.teacherDept}
                    onChange={(e) => onChange({ teacherDept: e.target.value })}
                    placeholder="e.g. Textile Engineering"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition shadow-sm placeholder-slate-400"
                  />
                  <datalist id="teacher-depts">
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: SUBMITTED BY (STUDENT) */}
          
         {activeTab !== 'index' && (
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <button
              onClick={() => toggleSection('student')}
              className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-left hover:bg-slate-50 transition text-slate-700 uppercase tracking-wider cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-500" />
                <span>3. Submitted By (Student)</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform text-slate-400 ${openSection === 'student' ? 'rotate-180' : ''}`} />
            </button>

            {openSection === 'student' && (
              <div className="p-4 border-t border-slate-100 space-y-3.5 bg-slate-50/40">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Full Name</label>
                   <input
                     type="text"
                     value={state.studentName}
                    onChange={(e) => onChange({ studentName: e.target.value })}
                     placeholder="Your Name"
                     className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition shadow-sm placeholder-slate-400"
                   />
                 </div>
 
                 <div className="grid grid-cols-2 gap-2">
                   <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">ID</label>
                     <input
                       type="text"
                       value={state.studentId}
                       onChange={(e) => onChange({ studentId: e.target.value })}
                       placeholder="e.g. 242-520-801"
                       className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition shadow-sm placeholder-slate-400"
                     />
                   </div>
                   <div>
                     <label className="block text-[11px] font-bold text-slate-500 mb-1">Section</label>
                     <input
                       type="text"
                       value={state.studentSection}
                      onChange={(e) => onChange({ studentSection: e.target.value })}
                       placeholder="e.g. 5A"
                       className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition shadow-sm placeholder-slate-400"
                     />
                   </div>
                </div>
 
                 <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Batch</label>
                  <input
                     type="text"
                     value={state.studentBatch}
                     onChange={(e) => onChange({ studentBatch: e.target.value })}
                    placeholder="e.g. 242 "
                     className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition shadow-sm placeholder-slate-400"
                   />
                 </div>
 
                <div>
                   <label className="block text-[11px] font-bold text-slate-500 mb-1">Department (Pick or write custom)</label>
                   <input
                     type="text"
                     list="student-depts"
                    value={state.studentDept}
                    onChange={(e) => onChange({ studentDept: e.target.value })}
                     placeholder="e.g. Textile Engineering"
                     className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition shadow-sm placeholder-slate-400"
                   />
                   <datalist id="student-depts">
                     {DEPARTMENTS.map(d => (
                       <option key={d} value={d} />
                     ))}
                   </datalist>
                 </div>
               </div>
             )}
           </div>
         )}

        {/* SECTION 4: SUBMISSION DATES */}
        {activeTab !== 'index' && (
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <button
              onClick={() => toggleSection('dates')}
              className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-left hover:bg-slate-50 transition text-slate-700 uppercase tracking-wider cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-500" />
                <span>4. Date Settings</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform text-slate-400 ${openSection === 'dates' ? 'rotate-180' : ''}`} />
            </button>

            {openSection === 'dates' && (
              <div className="p-4 border-t border-slate-100 space-y-3.5 bg-slate-50/40">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Date of Submission</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={state.submissionDate}
                      onChange={(e) => onChange({ submissionDate: e.target.value })}
                      placeholder="e.g. 25/07/2026"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition placeholder-slate-400"
                    />
                    <button 
                      onClick={() => onChange({ submissionDate: new Date().toLocaleDateString('en-GB') })}
                      className="absolute right-2 top-1.5 text-[9px] font-extrabold text-pink-600 bg-pink-100 px-2 py-0.5 rounded cursor-pointer hover:bg-pink-200 transition"
                    >
                      Today
                    </button>
                  </div>
                </div>

                {activeTab === 'lab' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Date of Performance (Optional)</label>
                    <input
                      type="text"
                      value={state.performanceDate || ''}
                      onChange={(e) => onChange({ performanceDate: e.target.value })}
                      placeholder="e.g. 18/07/2026"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition placeholder-slate-400"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SECTION 5: CUSTOM DOUBLE BORDER & SPACING ENGINE */}
        {!(activeTab === 'lab' && state.labFormat === 'obe') && (
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <button
              onClick={() => toggleSection('layout')}
              className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-left hover:bg-slate-50 transition text-slate-700 uppercase tracking-wider cursor-pointer font-sans"
            >
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-pink-500" />
                <span>{activeTab === 'index' ? '1. Index Layout Design' : '5. Custom Borders & Spacing'}</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform text-slate-400 ${openSection === 'layout' ? 'rotate-180' : ''}`} />
            </button>

            {openSection === 'layout' && (
              <div className="p-4 border-t border-slate-100 space-y-4 bg-slate-50/40 text-xs text-slate-700">
                
                {/* Border Color Preset Row */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-2">Border Color (Image style is Magenta/Pink)</label>
                  <div className="grid grid-cols-7 gap-1.5 mb-3">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => onChange({ borderColor: color.value })}
                        className="h-7 rounded-lg border border-slate-200 relative cursor-pointer transition active:scale-95 group shadow-sm"
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      >
                        {state.borderColor === color.value && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-white absolute inset-0 m-auto filter drop-shadow" />
                        )}
                      </button>
                    ))}
                  </div>
                  {/* Custom Hex Color Picker */}
                  <div className="flex items-center gap-2 bg-white border border-slate-200 p-2 rounded-xl shadow-sm">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase">Custom Hex:</span>
                    <input
                      type="color"
                      value={state.borderColor}
                      onChange={(e) => onChange({ borderColor: e.target.value })}
                      className="h-6 w-10 bg-transparent border-none outline-none cursor-pointer"
                    />
                    <input
                      type="text"
                      value={state.borderColor}
                      onChange={(e) => onChange({ borderColor: e.target.value })}
                      placeholder="#d946ef"
                      className="bg-slate-100 text-[11px] text-slate-800 font-mono rounded px-2 py-0.5 w-20 text-center focus:outline-none focus:ring-1 focus:ring-pink-500 border border-slate-200"
                    />
                  </div>
                </div>

                {/* Fonts Family Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Document Typography</label>
                  <div className="grid grid-cols-2 gap-2">
                    {FONT_PRESETS.map((font) => (
                      <button
                        key={font.value}
                        onClick={() => onChange({ fontFamily: font.value as any })}
                        className={`p-2 rounded-xl border text-left transition text-[11px] font-extrabold cursor-pointer ${
                          state.fontFamily === font.value
                            ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <span className={font.cssClass}>{font.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* CRITICAL FEATURE: "RISE UP" SUBMISSION BOX SLIDER */}
                {activeTab !== 'index' && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-pink-500 animate-pulse" />
                        <label className="block text-[11px] font-bold text-pink-600">Submission Box Position (Rise Up)</label>
                      </div>
                      <span className="text-[10px] font-extrabold text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded">{state.submissionBoxPosition}px rise</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="140"
                      value={state.submissionBoxPosition}
                      onChange={(e) => onChange({ submissionBoxPosition: parseInt(e.target.value) })}
                      className="w-full accent-pink-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none transition"
                    />
                    <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">
                      Adjust this slider to make the teacher & student info cards "rise up" perfectly. Avoids excessive white space!
                    </p>
                  </div>
                )}

                {/* Title styling block & Submission style */}
                {activeTab !== 'index' && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Title Box Accent</label>
                      <select
                        value={state.titleBoxStyle}
                        onChange={(e) => onChange({ titleBoxStyle: e.target.value as any })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500 cursor-pointer"
                      >
                        <option value="bordered">Single Box</option>
                        <option value="double">Double Box</option>
                        <option value="solid">Solid Block</option>
                        <option value="clean">Minimal Clean</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Submission Boxes</label>
                      <select
                        value={state.submissionBoxStyle}
                        onChange={(e) => onChange({ submissionBoxStyle: e.target.value as any })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500 cursor-pointer"
                      >
                        <option value="outlined-cards">Bordered Cards</option>
                        <option value="minimal">Minimalist Line</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SECTION 6: INDEX SHEET ROW MANAGER */}
        {activeTab === 'index' && (
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <button
              onClick={() => toggleSection('indexRows')}
              className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-left hover:bg-slate-50 transition text-slate-700 uppercase tracking-wider cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Table className="h-4 w-4 text-rose-500" />
                <span>2. Index Page Table Rows</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform text-slate-400 ${openSection === 'indexRows' ? 'rotate-180' : ''}`} />
            </button>

            {openSection === 'indexRows' && (
              <div className="p-4 border-t border-slate-100 space-y-4 bg-slate-50/40">
                {/* ACTIVE EDITOR ROW SUB-FORM */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] uppercase font-extrabold text-pink-600">
                      {editingRowId ? 'Edit Table Row' : 'Add New Experiment'}
                    </h4>
                    {editingRowId && (
                      <button 
                        onClick={() => {
                          setEditingRowId(null);
                          setNewRowNo('');
                          setNewRowName('');
                          setNewRowPerfDate('');
                          setNewRowSubDate('');
                          setNewRowPage('');
                          setNewRowRemarks('');
                        }}
                        className="text-[9px] text-slate-400 hover:text-slate-800 underline font-bold cursor-pointer"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-400 font-bold mb-0.5">Sl. No.</label>
                      <input
                        type="text"
                        value={newRowNo}
                        onChange={(e) => setNewRowNo(e.target.value)}
                        placeholder={String(indexRows.length + 1).padStart(2, '0')}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-center text-slate-800 focus:outline-none focus:border-pink-500"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[9px] text-slate-400 font-bold mb-0.5">Experiment Title</label>
                      <input
                        type="text"
                        value={newRowName}
                        onChange={(e) => setNewRowName(e.target.value)}
                        placeholder="e.g. Study on knit fabrics..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-400 font-bold mb-0.5">Subm. Date</label>
                    <input
                      type="text"
                      value={newRowSubDate}
                      onChange={(e) => setNewRowSubDate(e.target.value)}
                      placeholder="e.g. 22/05/2026"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <button
                    onClick={handleAddOrUpdateRow}
                    className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-white font-extrabold rounded-xl text-xs tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-pink-500/10"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{editingRowId ? 'Update Row Item' : 'Add Row to Table'}</span>
                  </button>
                </div>

                {/* CURRENT LIST OF ROWS & REORDER CONTROLS */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                    <span>Manage Added Rows ({indexRows.length})</span>
                    <div className="flex gap-2">
                      <button onClick={handleAutofillSequence} className="hover:text-slate-800 underline cursor-pointer font-bold">Auto No.</button>
                      <button onClick={() => setIndexRows([])} className="hover:text-rose-600 cursor-pointer font-bold">Clear All</button>
                    </div>
                  </div>

                  <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                    {indexRows.map((row, idx) => (
                      <div 
                        key={row.id} 
                        className={`p-2 bg-white border rounded-xl text-xs flex items-center justify-between transition shadow-sm ${
                          editingRowId === row.id ? 'border-pink-500 bg-pink-50/50' : 'border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div className="truncate flex-1 pr-3">
                          <span className="font-extrabold text-pink-600 mr-2">{row.no}</span>
                          <span className="text-slate-800 font-bold">{row.name}</span>
                          <span className="block text-[9px] text-slate-400 mt-0.5 font-mono">
                            Subm: {row.submissionDate || '—'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Reordering buttons */}
                          <button 
                            disabled={idx === 0}
                            onClick={() => moveRow(idx, 'up')}
                            className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded-lg disabled:opacity-30 transition border border-slate-100"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button 
                            disabled={idx === indexRows.length - 1}
                            onClick={() => moveRow(idx, 'down')}
                            className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded-lg disabled:opacity-30 transition border border-slate-100"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                          
                          <button 
                            onClick={() => handleEditRow(row)}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-extrabold rounded-lg transition cursor-pointer"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteRow(row.id)}
                            className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

      </div>

      {/* FOOTER ACTION PANEL - INSTANT HIGH RES DOWNLOAD */}
      <div className="p-5 border-t border-slate-200 bg-white shadow-[0_-5px_15px_rgba(0,0,0,0.02)] space-y-2">
       {/* <button
    onClick={async () => {
      const filename = `BUFT-${activeTab === 'lab' ? 'Lab-Report' : activeTab === 'assignment' ? 'Assignment' : 'Index'}-${state.courseCode || 'Document'}.pdf`;
      await downloadA4PDF('a4-pdf-capture-page', filename);
    }}
    className="w-full py-3 bg-gradient-to-r from-pink-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-pink-500/10 hover:shadow-pink-500/20 cursor-pointer active:scale-98"
  >
    <Printer className="h-4 w-4" />
    <span>Download A4 PDF</span>
  </button> 
*/}
        
        <button
          onClick={() => window.print()}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25 cursor-pointer active:scale-[0.98]"
        >
          <Printer className="h-4 w-4" />
          <span>Print & Save Page</span>
        </button>

        <div className="mt-2 text-[10px] text-slate-400 text-center leading-relaxed">
          💡 <span className="font-bold text-slate-500">Print Tip:</span> Set browser margins to <span className="text-pink-600 font-bold">"None"</span> and enable <span className="text-pink-600 font-bold">"Background graphics"</span> in the printing window.
        </div>
      </div>
    </div>
  );
};
