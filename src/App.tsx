import React, { useState, useEffect, useRef } from 'react';
import { CoverPageState, IndexRow } from './types';
import { INITIAL_COVER_STATE, SAMPLE_INDEX_ROWS, FEEDBACK_ENDPOINT, WEB3FORMS_ACCESS_KEY } from './data';
import { SidebarControls } from './components/SidebarControls';
import { A4Preview } from './components/A4Preview';
import { CgpaCalculator } from './components/CgpaCalculator';
import RoutineViewer from './components/RoutineViewer';
import { HashRouter, Routes, Route } from "react-router-dom";
import ExamRoutine from "./components/ExamRoutine"; // Adjust path as needed
import { downloadA4PDF } from './utils/pdfGenerator';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, 
  Settings2, 
  Printer, 
  HelpCircle,
  X,
  Sparkles,
  Award,
  BookOpen,
  FileText,
  Table,
  Bus,
  ExternalLink,
  MessageSquare,
  Check,
  GraduationCap,
  Heart,
  Calculator,
  Home,
  Menu
} from 'lucide-react';

export default function App() {
  // Current view: Reads the URL Hash link directly so bookmarks and link sharing work perfectly!
  const [currentView, setCurrentView] = useState<'home' | 'generator' | 'cgpa' | 'classroutine' | 'examroutine'>(() => {
    const currentHash = window.location.hash;
    if (currentHash === '#/cgpa') return 'cgpa';
    if (currentHash === '#/pagemaker') return 'generator';
    if (currentHash === '#/classroutine') return 'classroutine';
    if (currentHash === '#/examroutine') return 'examroutine';
    
    // Legacy support for your old query parameters if anyone uses them
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'cgpa') return 'cgpa';
    
    return 'home';
  });

  // Try loading from localStorage first, or fallback to default
  const [coverState, setCoverState] = useState<CoverPageState>(() => {
    const saved = localStorage.getItem('buft_cover_state_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing cover state', e);
      }
    }
    return INITIAL_COVER_STATE;
  });

  const [indexRows, setIndexRows] = useState<IndexRow[]>(() => {
    const saved = localStorage.getItem('buft_index_rows_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing index rows', e);
      }
    }
    return SAMPLE_INDEX_ROWS;
  });

  // Current active sub-tab (Matches the state's coverType)
  const [activeTab, setActiveTab] = useState<'lab' | 'assignment' | 'index'>('lab');

  // Sync activeTab with state.coverType
  useEffect(() => {
    setCoverState(prev => ({ ...prev, coverType: activeTab }));
  }, [activeTab]);

  // Listen for browser navigation changes (if back/forward buttons are pressed)
  useEffect(() => {
    const handleHashChange = () => {
      const currentHash = window.location.hash;
      if (currentHash === '#/cgpa') {
        setCurrentView('cgpa');
      } else if (currentHash === '#/pagemaker') {
        setCurrentView('generator');
        } else if (currentHash === '#/classroutine') { 
        setCurrentView('classroutine');
        } else if (currentHash === '#/examroutine') { 
      setCurrentView('examroutine');
      } else if (currentHash === '' || currentHash === '#/') {
        setCurrentView('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Mobile navigation views: 'edit' or 'preview'
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');

  // Dynamic scaling for A4 Preview across all devices (PC, tablet, mobile)
  const [previewScale, setPreviewScale] = useState<number>(1);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (!previewContainerRef.current) return;
      
      let containerWidth = previewContainerRef.current.clientWidth;
      
      // Fallback calculation if element is hidden during rendering/tab switching
      if (containerWidth === 0) {
        const isMobile = window.innerWidth < 1024;
        containerWidth = isMobile ? window.innerWidth : (window.innerWidth - 380);
      }
      
      // Provide a small margin (padding) so document is not flush with container boundaries
      const padding = window.innerWidth < 640 ? 16 : 48;
      const availableWidth = containerWidth - padding;
      
      // Base full A4 preview width including typical padding (approx 826px)
      const calculatedScale = Math.max(0.3, Math.min(1, availableWidth / 826));
      setPreviewScale(calculatedScale);
    };

    // Initial run
    handleResize();

    // Use ResizeObserver for accurate sizing on element width changes (e.g. sidebar open/close)
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    if (previewContainerRef.current) {
      resizeObserver.observe(previewContainerRef.current);
    }

    window.addEventListener('resize', handleResize);

    // Run handleResize on a small timeout to guarantee latest layout styles are evaluated
    const timeoutId = setTimeout(handleResize, 50);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [currentView, mobileView]); // re-run if view or mobile navigation tabs toggle

  // Dialog Modals
  const [showHelp, setShowHelp] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Floating In-App bottom banner control state
  const [showBottomNotify, setShowBottomNotify] = useState(true);

  // Formspree / Web3Forms Endpoint URL state for static deployment
  const [formEndpoint, setFormEndpoint] = useState(() => {
    return localStorage.getItem('buft_feedback_endpoint') || '';
  });

  // Feedback form state
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackDept, setFeedbackDept] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const [feedbacks, setFeedbacks] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('buft_feedbacks_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default sample feedback
    return [
      {
        id: '1',
        name: 'Sajid Islam',
        dept: 'TE 231',
        email: 'sajid@example.com',
        text: 'Awesome utility! The custom alignment slider really solved my double border printing margins issue on Google Chrome.',
        timestamp: '12/07/2026, 11:34 AM'
      }
    ];
  });

  // Sync states to local storage
  useEffect(() => {
    localStorage.setItem('buft_cover_state_v1', JSON.stringify(coverState));
  }, [coverState]);

  useEffect(() => {
    localStorage.setItem('buft_index_rows_v1', JSON.stringify(indexRows));
  }, [indexRows]);

  // Mass update state helper
  const handleCoverStateChange = (newState: Partial<CoverPageState>) => {
    setCoverState((prev) => ({ ...prev, ...newState }));
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newFb = {
      id: Date.now().toString(),
      name: feedbackName,
      dept: feedbackDept,
      email: feedbackEmail || 'no-email@buft.edu',
      text: feedbackText,
      timestamp: new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, month: 'short', day: 'numeric', year: 'numeric' })
    };
    const updated = [newFb, ...feedbacks];
    setFeedbacks(updated);
    localStorage.setItem('buft_feedbacks_v2', JSON.stringify(updated));

    // If a custom form endpoint is configured (Formspree, Web3Forms, etc.)
    const endpoint = FEEDBACK_ENDPOINT || formEndpoint.trim();
    if (endpoint) {
      try {
        const payload: any = {
          name: feedbackName,
          department: feedbackDept,
          email: feedbackEmail || 'no-email@buft.edu',
          message: feedbackText,
          _subject: `New BUFT Academic HUB Feedback from ${feedbackName}`
        };

        // Add access key for Web3Forms if provided
        if (WEB3FORMS_ACCESS_KEY) {
          payload.access_key = WEB3FORMS_ACCESS_KEY;
        }

        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error('Error submitting feedback to endpoint:', err);
      }
    }

    setFeedbackSubmitted(true);
    setTimeout(() => {
      setFeedbackSubmitted(false);
      setFeedbackName('');
      setFeedbackDept('');
      setFeedbackEmail('');
      setFeedbackText('');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-neutral-50 to-indigo-50/40 text-slate-800 flex flex-col overflow-x-hidden antialiased font-sans transition-colors duration-500">
      
      {/* GLOBAL NAVBAR */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/75 border-b border-emerald-100/50 px-4 lg:px-8 py-3 flex items-center justify-between shadow-sm no-print">
        <div className="flex items-center gap-2.5">
          <a 
            href="#/"
            onClick={(e) => {
              e.preventDefault();
              setCurrentView('home');
              window.location.hash = '#/';
            }} 
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <div className="bg-emerald-600 p-1.5 rounded-xl text-white shadow-md shadow-emerald-600/10 group-hover:scale-105 transition-transform">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-slate-950 flex items-center gap-1.5">
                BUFT <span className="text-emerald-600">Academic Hub</span>
              </h1>
            </div>
          </a>
        </div>

        {/* Desktop Nav: Automatically appears on PC (md:flex) */}
        <nav className="hidden md:flex items-center gap-6">
          <a 
            href="#/"
            onClick={(e) => {
              e.preventDefault();
              setCurrentView('home');
              window.location.hash = '#/';
            }}
            className={`text-xs font-bold transition-all cursor-pointer ${currentView === 'home' ? 'text-emerald-600' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Home
          </a>
          
          <a 
            href="#/pagemaker"
            onClick={(e) => {
              e.preventDefault();
              setCurrentView('generator');
              setActiveTab('lab');
              window.location.hash = '#/pagemaker';
            }}
            className={`text-xs font-bold transition-all cursor-pointer ${currentView === 'generator' && activeTab === 'lab' ? 'text-emerald-600' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Tools
          </a>
         
          <a 
            href="#/cgpa"
            onClick={(e) => {
              e.preventDefault();
              setCurrentView('cgpa');
              window.location.hash = '#/cgpa';
            }}
            className={`text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${currentView === 'cgpa' ? 'text-emerald-600 font-extrabold' : 'text-slate-600 hover:text-indigo-600'}`}
          >
            <Calculator className={`h-3.5 w-3.5 ${currentView === 'cgpa' ? 'text-emerald-600' : 'text-indigo-500'}`} />
            <span>CGPA Calculator</span>
          </a>
          <a 
            href="#/classroutine"
            onClick={(e) => {
              e.preventDefault();
              setCurrentView('classroutine');
              window.location.hash = '#/classroutine';
            }}
            className={`text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${currentView === 'classroutine' ? 'text-emerald-600 font-extrabold' : 'text-slate-600 hover:text-emerald-600'}`}
          >
            <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
            <span>Class Routine</span>
          </a>
          <a 
            href="#/examroutine"
            onClick={(e) => {
              e.preventDefault();
              setCurrentView('examroutine');
              window.location.hash = '#/examroutine';
            }}
            className={`text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${currentView === 'examroutine' ? 'text-emerald-600 font-extrabold' : 'text-slate-600 hover:text-emerald-600'}`}
          >
            <FileText className="h-3.5 w-3.5 text-emerald-600" />
            <span>Exam Routine</span>
          </a>
          <a 
            href="https://naabilll.github.io/buft-bus-tracker/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-xs font-bold text-slate-600 hover:text-emerald-600 flex items-center gap-1 group transition cursor-pointer"
            title="Real-time BUFT shuttle tracker by Shazzad Hossain Nabil"
          >
            <Bus className="h-3.5 w-3.5 text-emerald-600 group-hover:animate-bounce" />
            <span>BUFT Bus Tracker</span>
            <ExternalLink className="h-2.5 w-2.5 opacity-60" />
          </a>
          <button 
            onClick={() => setShowFeedback(true)}
            className="text-xs font-bold text-slate-600 hover:text-emerald-600 flex items-center gap-1 cursor-pointer"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Feedback</span>
          </button>
          <button 
            onClick={() => setShowAbout(true)}
            className="text-xs font-bold text-slate-600 hover:text-emerald-600 flex items-center gap-1 cursor-pointer"
          >
            <Award className="h-3.5 w-3.5" />
            <span>About</span>
          </button>
        </nav>

        <div className="flex items-center gap-2">
          {/* Mobile elements container: Feedback & About on the left, followed by three-line button on the right */}
          <div className="flex md:hidden items-center gap-1 select-none mr-1">
            <button 
              onClick={() => setShowFeedback(true)}
              className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-50 rounded-xl transition cursor-pointer"
              title="Feedback"
              aria-label="Feedback"
            >
              <MessageSquare className="h-4.5 w-4.5" />
            </button>
            <button 
              onClick={() => setShowAbout(true)}
              className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-50 rounded-xl transition cursor-pointer"
              title="About"
              aria-label="About"
            >
              <Award className="h-4.5 w-4.5" />
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 ml-1 text-slate-600 hover:text-emerald-600 hover:bg-slate-50 rounded-xl transition cursor-pointer"
              title="Menu"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Desktop Right Side items */}
          <div className="hidden md:block">
            {currentView === 'home' ? (
              <a
                href="#/pagemaker"
                key="start-generating-btn"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentView('generator');
                  setActiveTab('lab');
                  window.location.hash = '#/pagemaker';
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 transition-all cursor-pointer block animate-fade-in"
              >
                Start Generating
              </a>
            ) : (
              <a
                href="#/"
                key="back-to-home-btn"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentView('home');
                  window.location.hash = '#/';
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer border border-slate-200/80 block animate-fade-in"
              >
                &larr; Back to Home
              </a>
            )}
          </div>
        </div>
      </header>

      {/* MOBILE EXPANDABLE MENU (Three-line button dropdown) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="md:hidden border-b border-emerald-100/50 bg-white/95 backdrop-blur-md no-print overflow-hidden shadow-lg z-30 sticky top-[53px]"
          >
            <div className="px-4 py-3 space-y-2 flex flex-col">
              <a 
                href="#/"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentView('home');
                  setMobileMenuOpen(false);
                  window.location.hash = '#/';
                }}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  currentView === 'home'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/40 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Home className="h-4 w-4 text-emerald-600" />
                <span>Home</span>
              </a>

              <a 
                href="#/pagemaker"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentView('generator');
                  setActiveTab('lab');
                  setMobileMenuOpen(false);
                  window.location.hash = '#/pagemaker';
                }}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  currentView === 'generator'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/40 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span>Tools & Cover Page Maker</span>
              </a>

              <a 
                href="#/cgpa"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentView('cgpa');
                  setMobileMenuOpen(false);
                  window.location.hash = '#/cgpa';
                }}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  currentView === 'cgpa'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/40 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Calculator className="h-4 w-4 text-indigo-500" />
                <span>CGPA Calculator</span>
              </a>

              <a 
                href="#/classroutine"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentView('classroutine');
                  setMobileMenuOpen(false);
                  window.location.hash = '#/classroutine';
                }}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  currentView === 'classroutine'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/40 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="h-4 w-4 text-emerald-600" />
                <span>Class Routine</span>
              </a>

              <a 
                href="#/examroutine"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentView('examroutine');
                  setMobileMenuOpen(false);
                  window.location.hash = '#/examroutine';
                }}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  currentView === 'examroutine'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/40 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileText className="h-4 w-4 text-emerald-600" />
                <span>Exam Routine</span>
              </a>

              <a 
                href="https://naabilll.github.io/buft-bus-tracker/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-between px-4 py-2.5 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Bus className="h-4 w-4 text-emerald-600 animate-pulse" />
                  <span>BUFT Bus Tracker</span>
                </div>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

     {/* RENDER VIEW: CGPA, HOME, OR GENERATOR */}
      {currentView === 'classroutine' ? (
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 lg:px-8 py-10 lg:py-16 flex flex-col items-center no-print animate-fade-in">
          <RoutineViewer />
        </main>
      ) : currentView === 'examroutine' ? (
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 lg:px-8 py-10 lg:py-16 flex flex-col items-center no-print animate-fade-in">
          <ExamRoutine />
        </main>
      ) : currentView === 'cgpa' ? (
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 lg:px-8 py-10 lg:py-16 flex flex-col items-center no-print animate-fade-in">
          {/* Header section for CGPA Page */}
          <div className="text-center max-w-3xl mb-8">
            <div className="mx-auto bg-gradient-to-tr from-pink-500 to-indigo-500 p-3.5 rounded-3xl text-white shadow-lg w-fit mb-4">
              <Calculator className="h-7 w-7" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-950 mb-2 leading-tight">
              CGPA Calculator
            </h2>
            <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed max-w-xl mx-auto">
              Plan and calculate your BUFT academic standings with precision. Add semesters, input grade credit points, and get real-time statistics.
            </p>
          </div>

          <div className="w-full">
            <CgpaCalculator />
          </div>

          <footer className="mt-16 text-center text-slate-400 text-[11px] font-medium border-t border-slate-200/50 pt-6 w-full max-w-5xl">
            <p>© 2026 BUFT Academic HUB.</p>
            <p className="mt-1 text-slate-500 font-semibold flex items-center justify-center gap-1">
              Made with <Heart className="h-3 w-3 text-red-500 fill-red-500 inline" /> for BUFTians | Ahsan Habib Tamim (TE 242)
            </p>
          </footer>
        </main>
      ) : currentView === 'home' ? (
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-10 lg:py-16 flex flex-col items-center justify-center no-print">
          {/* Centered Logo Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative flex items-center justify-center mb-8"
          >
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl w-32 h-32 animate-pulse"></div>
            <div className="relative bg-white/95 border border-emerald-100 p-4 rounded-full shadow-2xl w-24 h-24 flex items-center justify-center">
              <img 
                src="https://buft.edu.bd/logo-326x329.png" 
                alt="BUFT Logo" 
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </motion.div>

          {/* Hero Titles */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center max-w-3xl mb-12 lg:mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-950 mb-4 leading-tight">
              BUFT Academic HUB <br className="hidden sm:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">
                Generate & Explore 
              </span>
            </h2>
            <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
              Create beautifully customized, print-ready cover sheets for Assignments, Lab Reports, and Index Pages. Fully aligned with professional academic standards.
            </p>
          </motion.div>

          {/* Core Feature Tab Selector Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl mb-14"
          >
            {/* ASSIGNMENT CARD */}
            <a 
              href="#/pagemaker"
              onClick={(e) => {
                e.preventDefault();
                setCurrentView('generator');
                setActiveTab('assignment');
                window.location.hash = '#/pagemaker';
              }}
              className="bg-white/80 backdrop-blur-sm border border-slate-100/80 p-6 rounded-3xl hover:border-emerald-300/60 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="bg-emerald-100 text-emerald-700 p-3 rounded-2xl w-fit mb-5 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 mb-2">Assignment Cover</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Generate premium, high-contrast assignment layouts for BUFT.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                <span>Start Designing</span>
                <span className="ml-1">&rarr;</span>
              </div>
            </a>

            {/* LAB REPORT CARD */}
            <a 
              href="#/pagemaker"
              onClick={(e) => {
                e.preventDefault();
                setCurrentView('generator');
                setActiveTab('lab');
                window.location.hash = '#/pagemaker';
              }}
              className="bg-white/80 backdrop-blur-sm border border-slate-100/80 p-6 rounded-3xl hover:border-emerald-300/60 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="bg-emerald-100 text-emerald-700 p-3 rounded-2xl w-fit mb-5 group-hover:scale-110 transition-transform">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 mb-2">Lab Report Cover</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Create fully structured lab report front for BUFT.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                <span>Start Designing</span>
                <span className="ml-1">&rarr;</span>
              </div>
            </a>

            {/* INDEX PAGE CARD */}
            <a 
              href="#/pagemaker"
              onClick={(e) => {
                e.preventDefault();
                setCurrentView('generator');
                setActiveTab('index');
                window.location.hash = '#/pagemaker';
              }}
              className="bg-white/80 backdrop-blur-sm border border-slate-100/80 p-6 rounded-3xl hover:border-emerald-300/60 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="bg-emerald-100 text-emerald-700 p-3 rounded-2xl w-fit mb-5 group-hover:scale-110 transition-transform">
                  <Table className="h-6 w-6" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 mb-2">Index Table Page</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Assemble high-fidelity laboratory index registers for BUFT.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                <span>Start Designing</span>
                <span className="ml-1">&rarr;</span>
              </div>
            </a>

            {/* CGPA CALCULATOR CARD */}
            <a 
              href="#/cgpa"
              onClick={(e) => {
                e.preventDefault();
                setCurrentView('cgpa');
                window.location.hash = '#/cgpa';
              }}
              className="bg-white/80 backdrop-blur-sm border border-slate-100/80 p-6 rounded-3xl hover:border-emerald-300/60 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="bg-emerald-100 text-emerald-700 p-3 rounded-2xl w-fit mb-5 group-hover:scale-110 transition-transform">
                  <Calculator className="h-6 w-6" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 mb-2">CGPA Calculator</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Plan and project your academic grades! Easily calculate semester GPAs and project target CGPAs.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                <span>Open Calculator</span>
                <span className="ml-1">&rarr;</span>
              </div>
            </a>
        {/* CLASS ROUTINE CARD */}
            <a 
              href="#/classroutine"
              onClick={(e) => {
                e.preventDefault();
                setCurrentView('classroutine');
                window.location.hash = '#/classroutine';
              }}
              className="bg-white/80 backdrop-blur-sm border border-slate-100/80 p-6 rounded-3xl hover:border-emerald-300/60 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="bg-emerald-100 text-emerald-700 p-3 rounded-2xl w-fit mb-5 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 mb-2">Class Routine</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  View your daily class schedule and manage your academic routine efficiently.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                <span>View Class Routine</span>
                <span className="ml-1">&rarr;</span>
              </div>
            </a>

            {/* EXAM ROUTINE CARD */}
            <a 
              href="#/examroutine"
              onClick={(e) => {
                e.preventDefault();
                setCurrentView('examroutine');
                window.location.hash = '#/examroutine';
              }}
              className="bg-white/80 backdrop-blur-sm border border-slate-100/80 p-6 rounded-3xl hover:border-emerald-300/60 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between"
            >
  <div>
    <div className="bg-emerald-100 text-emerald-700 p-3 rounded-2xl w-fit mb-5 group-hover:scale-110 transition-transform">
      <FileText className="h-6 w-6" />
    </div>
    <h3 className="font-extrabold text-lg text-slate-900 mb-2">Exam Routine</h3>
    <p className="text-xs text-slate-500 leading-relaxed font-medium">
      Check exam schedules.
    </p>
  </div>
  <div className="mt-6 flex items-center text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
    <span>View Exam Routine</span>
    <span className="ml-1">&rarr;</span>
  </div>
</a>

            
          </motion.div>

          {/* BUS TRACKER DEDICATED BLOCK */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full max-w-5xl bg-gradient-to-r from-emerald-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden mb-16"
          >
            <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4 flex-1">
                <div className="bg-emerald-500/15 p-3 rounded-2xl text-emerald-400 mt-1 shrink-0">
                  <Bus className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-bold text-[9px] uppercase tracking-wider rounded-md">
                      Student Utility Integration
                    </span>
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      Courtesy of Owner Shazzad Hossain Nabil
                    </span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight mb-2">BUFT Shuttle & Bus Tracker</h3>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    Never worry about missing your bus again! This real-time tracker for BUFT shuttle routes and schedules is engineered with dedication by our respected senior brother <strong className="text-white">Shazzad Hossain Nabil (TE 221)</strong> to help the entire BUFT community. Open it & stay updated on current trips.
                  </p>
                </div>
              </div>

              <a 
                href="https://naabilll.github.io/buft-bus-tracker/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition cursor-pointer"
              >
                <span>Track My Shuttle</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </motion.div>

          {/* FOOTER */}
          <footer className="mt-16 text-center text-slate-400 text-[11px] font-medium border-t border-slate-200/50 pt-6 w-full max-w-5xl">
            <p>© 2026 BUFT Academic HUB. </p>
            <p className="mt-1 text-slate-500 font-semibold flex items-center justify-center gap-1">
              Made with <Heart className="h-3 w-3 text-red-500 fill-red-500 inline" /> for BUFTians | Ahsan Habib Tamim (TE 242)
            </p>
          </footer>
        </main>
      ) : (
        /* WORKSPACE GENERATOR VIEW */
        <div className="flex-1 flex flex-col lg:flex-row no-print h-[calc(100vh-3.5rem)] overflow-hidden">
          
          {/* SIDEBAR EDIT PANEL */}
          <div className={`lg:block ${mobileView === 'edit' ? 'block' : 'hidden'} w-full lg:w-auto h-full`}>
            <SidebarControls
              state={coverState}
              onChange={handleCoverStateChange}
              indexRows={indexRows}
              setIndexRows={setIndexRows}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </div>

          {/* PREVIEW CANVAS */}
          <div className={`flex-1 flex-col h-full overflow-hidden ${mobileView === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
            
            {/* DESKTOP/MOBILE WORKSPACE UPPER ACTION BAR */}
            <div className="bg-white border-b border-slate-200/80 px-6 py-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <a
                  href="#/"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentView('home');
                    window.location.hash = '#/';
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer border border-slate-200"
                >
                  &larr; Back to Home
                </a>
                <div className="h-4 w-[1px] bg-slate-200 hidden sm:block"></div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-xs font-medium text-slate-600">
                    A4 Canvas Preview: <span className="text-slate-900 capitalize font-bold">{activeTab === 'lab' ? 'Lab Report' : activeTab === 'assignment' ? 'Assignment' : 'Index Page'}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHelp(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-bold transition cursor-pointer border border-slate-200"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Printing Guide</span>
                </button>
                
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-md shadow-blue-500/10 active:scale-95"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print & Save Page</span>
                </button>
              </div>
            </div>

            {/* ACTIVE PAPER PREVIEW FRAME */}
            <div 
              ref={previewContainerRef}
              className="flex-1 bg-gradient-to-tr from-slate-200 via-zinc-100 to-indigo-100/30 overflow-y-auto overflow-x-auto flex justify-center items-start p-4 lg:p-8 scrollbar-thin scrollbar-thumb-slate-200"
            >
              <div className="flex flex-col items-center gap-5 w-full">
                {/* Floating quick action bar above preview */}
                <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-lg flex items-center gap-3.5 no-print animate-fade-in">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    <span className="text-xs font-bold text-slate-700">Ready to save?</span>
                  </div>
                  <div className="h-4 w-[1px] bg-slate-200"></div>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-blue-500/10 transition cursor-pointer hover:shadow-blue-500/20 active:scale-95"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print & Save Page</span>
                  </button>
                </div>

                <div 
                  className="overflow-visible flex items-start justify-start transition-all duration-300 ease-out"
                  style={{ 
                    width: `${826 * previewScale}px`, 
                    height: `${1155 * previewScale}px` 
                  }}
                >
                  <div 
                    className="origin-top-left"
                    style={{ 
                      transform: `scale(${previewScale})`,
                      width: '826px',
                      height: '1155px'
                    }}
                  >
                    <A4Preview
                      id="a4-preview-page"
                      state={coverState}
                      indexRows={indexRows}
                      activeTab={activeTab}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MOBILE RESPONSIVE FLOATING DOCK */}
          <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/95 border border-slate-200 p-1.5 rounded-2xl shadow-2xl flex items-center gap-1.5 z-40 backdrop-blur-xl no-print">
            <button
              onClick={() => setMobileView('edit')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                mobileView === 'edit'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/15'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Settings2 className="h-4 w-4" />
              <span>Edit Page</span>
            </button>
            <button
              onClick={() => setMobileView('preview')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                mobileView === 'preview'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/15'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Eye className="h-4 w-4" />
              <span>Preview Page</span>
            </button>
          </div>

        </div>
      )}

      {/* HIGH RES REAL A4 PRINT OUTLET CONTAINER */}
      <div className="print-only hidden">
        <A4Preview
          id="a4-print-page"
          state={coverState}
          indexRows={indexRows}
          activeTab={activeTab}
        />
      </div>

      {/* Off-screen capture page for html2canvas */}
      <div 
        className="fixed left-[-9999px] top-[-9999px] overflow-hidden no-print"
        style={{ width: '210mm', height: '297mm', pointerEvents: 'none' }}
      >
        <A4Preview
          id="a4-pdf-capture-page"
          state={coverState}
          indexRows={indexRows}
          activeTab={activeTab}
        />
      </div>

      {/* ABOUT & COURTESY MODAL DIALOG */}
      {showAbout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in no-print">
          <div className="bg-white border border-slate-100 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setShowAbout(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6">
              <div className="flex items-center gap-2.5 mb-5 border-b border-slate-100 pb-3">
                <Award className="h-5 w-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-slate-900">BUFT Academic Hub</h3>
              </div>
              
              <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 mb-1">Concept & Development</h4>
                  <p className="text-slate-700 font-medium leading-relaxed">
                    Designed and developed by <strong className="text-slate-950 font-bold">Ahsan Habib Tamim (TE 242)</strong>, Department of Textile Engineering.
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <h4 className="font-extrabold text-xs text-slate-900 mb-1 flex items-center gap-1">
                    <Bus className="h-3.5 w-3.5 text-emerald-600 inline" />
                    <span>BUFT Bus Tracker Integration</span>
                  </h4>
                  <p>
                    Special courtesy and thanks to our talented senior brother <strong className="text-slate-950">Shazzad Hossain Nabil (TE 221)</strong>, who built the highly helpful <a href="https://naabilll.github.io/buft-bus-tracker/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline font-bold">BUFT Bus Tracker app</a>. This tracker allows students to track buses in real-time, reducing academic hustle. We've linked it natively for quick access!
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-3 bg-emerald-50/40 -mx-6 -mb-6 p-6">
                  <p className="flex items-center gap-1.5 text-emerald-800 font-semibold mb-1 text-[11px]">
                    <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
                    <span>AI-Powered Innovation</span>
                  </p>
                  <p className="text-[11px] text-emerald-700/90">
                    Developed with advanced AI assistance and inspired by tools used at other universities.
                  </p>
                  
                  <button
                    onClick={() => setShowAbout(false)}
                    className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-emerald-600/10"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK MODAL DIALOG */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in no-print">
          <div className="bg-white border border-slate-100 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative transition-all duration-300">
            <button 
              onClick={() => setShowFeedback(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
                <h3 className="font-extrabold text-base text-slate-900">Feedback Hub</h3>
              </div>
              
              {feedbackSubmitted ? (
                <div className="py-8 flex flex-col items-center justify-center text-center animate-fade-in">
                  <div className="bg-emerald-100 text-emerald-600 p-3 rounded-full mb-4">
                    <Check className="h-6 w-6 stroke-[3]" />
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm mb-1">Feedback Submitted!</h4>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-medium">
                    Thank you! Your feedback has been successfully sent. We really appreciate your suggestions to improve BUFT Academic HUB!
                  </p>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Have features, templates, or CGPA updates you want to request? Share them directly here!
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Your Name</label>
                      <input 
                        type="text" 
                        required
                        value={feedbackName}
                        onChange={(e) => setFeedbackName(e.target.value)}
                        placeholder="e.g., Ahsan Habib"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-950 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Dept / Batch</label>
                      <input 
                        type="text" 
                        required
                        value={feedbackDept}
                        onChange={(e) => setFeedbackDept(e.target.value)}
                        placeholder="e.g., TE 242"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-950 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Your Email <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input 
                      type="email" 
                      value={feedbackEmail}
                      onChange={(e) => setFeedbackEmail(e.target.value)}
                      placeholder="e.g., ahsan@example.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-950 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Message</label>
                    <textarea 
                      required
                      rows={3}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Share your thoughts, suggestions, or bugs..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-950 focus:outline-none focus:border-indigo-500 transition resize-none leading-relaxed"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-indigo-600/10 mt-2"
                  >
                    Submit Feedback
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRINTING GUIDE MODAL DIALOG */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in no-print">
          <div className="bg-white border border-slate-100 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setShowHelp(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <Award className="h-5 w-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-slate-900">BUFT Printing & PDF Guide</h3>
              </div>
              
              <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                <p>
                  To achieve the absolute <span className="text-emerald-600 font-bold">"same to same" double border alignment</span> shown in the design references when generating your final files, follow these simple browser settings:
                </p>

                <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-start gap-2">
                    <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold text-[10px] shrink-0 mt-0.5">1</div>
                    <p>Click the <strong className="text-slate-900">Export PDF</strong> button or press <kbd className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-800 font-mono text-[10px]">Ctrl + P</kbd>.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold text-[10px] shrink-0 mt-0.5">2</div>
                    <p>Select <strong className="text-slate-900">Destination: Save as PDF</strong> or select your connected printer.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold text-[10px] shrink-0 mt-0.5">3</div>
                    <p>Set Paper Size to <strong className="text-slate-900">A4</strong> and Orientation to <strong className="text-slate-900">Portrait</strong>.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold text-[10px] shrink-0 mt-0.5">4</div>
                    <p>&nbsp; <strong className="text-emerald-600 font-bold">CRITICAL:</strong> Set Margins to <strong className="text-slate-900">"None"</strong> (or "Default" if none is unavailable).</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold text-[10px] shrink-0 mt-0.5">5</div>
                    <p>&nbsp; <strong className="text-emerald-600 font-bold">CRITICAL:</strong> Enable <strong className="text-slate-900">"Background graphics"</strong>.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowHelp(false)}
                className="mt-6 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-emerald-600/10"
              >
                Got it, let's build!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING BOTTOM IN-APP NOTIFICATION BANNER */}
      {showBottomNotify && (
        <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl shadow-2xl z-50 flex items-start gap-3.5 animate-fade-in no-print">
          <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-xl shrink-0 mt-0.5">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          
          <div className="flex-1">
            <h4 className="font-extrabold text-xs text-emerald-400 tracking-tight mb-1">
              💙 Dear BUFTian, Help Us Improve BUFT Academic Hub!
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
              Every report and suggestion helps us improve the BUFT Academic Hub. If you notice any bugs or have ideas for new features, please share them through the Feedback tab. Thank you for helping us grow!
            </p>
            <div className="mt-3 flex justify-end">
              <button 
                onClick={() => setShowBottomNotify(false)}
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-md"
              >
                Got it, thanks!
              </button>
            </div>
          </div>

          <button 
            onClick={() => setShowBottomNotify(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

    </div>
  );
}
