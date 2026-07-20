import { CoverPageState, IndexRow } from './types';

// =========================================================================
// FEEDBACK HUB CONFIGURATION (For Static Hosting: GitHub / Netlify / Vercel)
// =========================================================================
// Since static sites do not run a server database, you can receive all student feedback 
// directly in your email box (ahsanhabibtamim.new@gmail.com) completely for free!
//
// HOW TO SET IT UP:
// 1. Visit Web3Forms (https://web3forms.com) or Formspree (https://formspree.io) and register.
// 2. Paste your endpoint URL or access key below:
// =========================================================================
export const FEEDBACK_ENDPOINT = 'https://api.web3forms.com/submit'; // e.g., 'https://api.web3forms.com/submit' OR 'https://formspree.io/f/your_form_id'
export const WEB3FORMS_ACCESS_KEY = '60a3f1b6-8745-4a10-bcac-e46877516556'; // If using Web3Forms, paste your Access Key here (e.g., '48f94d9f-...')

export const COLOR_PRESETS = [
  { name: 'Magenta Pink (Classic)', value: '#d946ef' },
  { name: 'Deep Pink (Vibrant)', value: '#ec4899' },
  { name: 'BUFT Navy (Brand)', value: '#0c2340' },
  { name: 'Dark Emerald', value: '#0f766e' },
  { name: 'Royal Blue', value: '#1d4ed8' },
  { name: 'Charcoal Black', value: '#1e293b' },
  { name: 'Maroon Red', value: '#991b1b' },
];

export const FONT_PRESETS = [
  { name: 'Standard Academic (Times New Roman Style)', value: 'serif', cssClass: 'font-times' },
  { name: 'Clean Modern (Inter / Arial Style)', value: 'sans', cssClass: 'font-sans' },
  { name: 'Georgia Elegant', value: 'georgia', cssClass: 'font-[Georgia,serif]' },
  { name: 'Editorial Display (Playfair Style)', value: 'playfair', cssClass: 'font-["Playfair_Display",serif]' },
  { name: 'Technical / Monospace', value: 'mono', cssClass: 'font-mono' },
];

export const DEPARTMENTS = [
  'Textile Engineering (TE)',
  'Knitwear Engineering (KE)',
  'Textile Engineering & Management (TEM)',
  'Apparel Merchandising & Management (AMM)',
  'Apparel Manufacturing & Technology (AMT)',
  'Fashion Studies',
  'Fashion Design & Technology (FDT)',
  'English',
  'Business Administration',
  'Computer Science & Engineering (CSE)',
  'Industrial Engineering (IE)',
  'Department of Environmental Science (ES)',
];

export const DESIGNATIONS = [
  'Lecturer',
  'Senior Lecturer',
  'Assistant Professor',
  'Associate Professor',
  'Professor',
  'Adjunct Faculty',
  'Guest Teacher',
];

export const INITIAL_COVER_STATE: CoverPageState = {
  universityName: 'BGMEA UNIVERSITY OF FASHION & TECHNOLOGY',
  logoUrl: 'https://buft.edu.bd/logo-326x329.png',
  coverType: 'lab',
  courseCode: '',
  courseTitle: '',
  experimentNo: '',
  experimentName: '',
  assignmentTopic: '',
  
  // Submitted To
  teacherName: 'Dr. Md. Mostafizur Rahman',
  teacherDesignation: 'Associate Professor',
  teacherDept: 'Textile Engineering',
  
  // Submitted By
  studentName: '',
  studentId: '',
  studentSection: '',
  studentDept: '',
  studentBatch: '',
  studentSession: '',
  studentSemester: 'r',
  
  // Dates
  submissionDate: new Date().toLocaleDateString('en-GB'),
  performanceDate: new Date().toLocaleDateString('en-GB'),
  
  // Layout & Styling
  borderColor: '#d946ef', // default pink magenta from second picture
  borderPadding: 10, // 10mm inset padding fixed
  borderStyle: 'double',
  borderThickness: 1.5,
  borderGap: 2.5,
  verticalSpacing: 10, // 10 scale (Balanced) fixed
  submissionBoxPosition: 45, // 0 to 100 scale, controlling the "rises up" offset
  fontFamily: 'serif',
  showLogo: true,
  customLogo: null,
  titleBoxStyle: 'bordered',
  submissionBoxStyle: 'minimal',
  
  // OBE Format default extensions
  labFormat: 'plain',
  obeShortDept: 'TE',
  obeSupervisor: 'Mizanur Rahman',
  obeSemester: 'Spring 2026',
  obeCategory: 'Major',
  obeLevelTerm: 'L2 T2',
  obeL: '3',
  obeT: '0',
  obeP: '0',
  obeC: '2',
  obeClo: '--',
  obePlo: '--',
  obeClevel: '--',
};

export const SAMPLE_INDEX_ROWS: IndexRow[] = [
  {
    id: '1',
    no: '01',
    name: 'Determination of moisture regain and moisture content of cotton fiber.',
    performanceDate: '15/05/2026',
    submissionDate: '22/05/2026',
    pageNo: '01-05',
    remarks: ''
  }
  
];
