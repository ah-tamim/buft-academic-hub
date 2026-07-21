export interface CoverPageState {
  universityName: string;
  logoUrl: string;
  coverType: 'lab' | 'assignment' | 'index';
  courseCode: string;
  courseTitle: string;
  experimentNo: string;
  experimentName: string;
  assignmentTopic: string;
  
  // Submitted To
  teacherName: string;
  teacherDesignation: string;
  teacherDept: string;
  
  // Submitted By
  studentName: string;
  studentId: string;
  studentSection: string;
  studentDept: string;
  studentBatch: string;
  studentSession: string;
  studentSemester: string;
  program?: string;
  
  // Dates
  submissionDate: string;
  performanceDate?: string; // Optional for Lab Reports
  
  // Layout & Styling
  borderColor: string;
  borderPadding: number; // in mm
  borderStyle: 'double' | 'solid' | 'dashed' | 'ornament' | 'border-in-border';
  borderThickness: number; // thickness of lines
  borderGap: number; // gap between lines for double border
  verticalSpacing: number; // space multiplier for margins (compact vs wide)
  submissionBoxPosition: number; // vertical lift offset (percentage or pixels)
  fontFamily: 'serif' | 'sans' | 'mono' | 'georgia' | 'playfair';
  showLogo: boolean;
  customLogo: string | null;
  titleBoxStyle: 'bordered' | 'solid' | 'double' | 'clean';
  submissionBoxStyle: 'grid' | 'stacked' | 'outlined-cards' | 'minimal';
  indexFormat?: 'without_marks' | 'with_marks';

  // OBE Format optional extensions
  labFormat?: string;
  obeShortDept?: string;
  obeSupervisor?: string;
  obeSemester?: string;
  obeCategory?: string;
  obeLevelTerm?: string;
  obeL?: string;
  obeT?: string;
  obeP?: string;
  obeC?: string;
  obeClo?: string;
  obePlo?: string;
  obeClevel?: string;

  // Box Format optional extensions
  facultyInitials?: string;
  gtaInitials?: string;
  labRoomNo?: string;
  boxSubStyle?: '10' | '20';
  colorMode?: 'colored' | 'bw';
  boxCriteriaType?: 'workshop' | 'eee' | 'cse' | 'mechanical' | 'custom';
  customCriteriaList?: { no: string; text: string; marks: number }[];
  boxGradingType?: 'fail' | 'vgood';
}

export interface IndexRow {
  id: string;
  no: string;
  name: string;
  performanceDate: string;
  submissionDate: string;
  pageNo: string;
  remarks: string;
}
