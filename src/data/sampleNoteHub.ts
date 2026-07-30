import { NoteHubItem } from "../types";

export const BUFT_SEMESTERS = [
  "1st Semester",
  "2nd Semester",
  "3rd Semester",
  "4th Semester",
  "5th Semester",
  "6th Semester",
  "7th Semester",
  "8th Semester"
];

export const BUFT_DEPARTMENTS = [
  "AMT",
  "FDT",
  "CSE",
  "TE",
  "IPE",
  "TEM",
  "KMT",
  "BBA"
];

export const INITIAL_NOTE_HUB_ITEMS: NoteHubItem[] = [
  // 1st Semester - CSE
  {
    id: "nh-1",
    title: "Structured Programming Concepts & C Language Handouts",
    courseCode: "CSE 1101",
    semester: "1st Semester",
    department: "CSE",
    category: "notes",
    authorName: "Dr. Alimul Haque",
    fileUrl: "https://drive.google.com/drive/folders/1buft_sample_notes_cse1101",
    description: "Complete lecture notes covering C syntax, loops, arrays, pointers, functions and structures.",
    fileType: "Google Drive Folder",
    dateAdded: "15/07/2026",
    uploadedBy: "BUFT Academic Hub"
  },
  {
    id: "nh-2",
    title: "CSE 1101 Sessional & Midterm Examination Question Paper",
    courseCode: "CSE 1101",
    batch: "Batch 251",
    examType: "SME",
    semester: "1st Semester",
    department: "CSE",
    category: "questions",
    fileUrl: "https://drive.google.com/drive/folders/1buft_sample_q_sme_cse1101",
    description: "Midterm & Sessional examination question paper for Batch 251.",
    fileType: "PDF Archive",
    dateAdded: "18/07/2026",
    uploadedBy: "BUFT Academic Hub"
  },
  {
    id: "nh-2b",
    title: "CSE 1101 Semester End Examination (SEE) Question Paper",
    courseCode: "CSE 1101",
    batch: "Batch 242",
    examType: "SEE",
    semester: "1st Semester",
    department: "CSE",
    category: "questions",
    fileUrl: "https://drive.google.com/drive/folders/1buft_sample_q_see_cse1101",
    description: "Final Semester End Examination (SEE) question paper with solved answers.",
    fileType: "PDF Archive",
    dateAdded: "19/07/2026",
    uploadedBy: "BUFT Academic Hub"
  },
  {
    id: "nh-3",
    title: "C Programming Laboratory Manual & Experiment Solutions",
    courseCode: "CSE 1102",
    semester: "1st Semester",
    department: "CSE",
    category: "lab_reports",
    authorName: "Ahsan Habib Tamim",
    fileUrl: "https://drive.google.com/drive/folders/1buft_sample_lab_cse1102",
    description: "Complete laboratory experiment manuals, problem sets and code templates for C programming.",
    fileType: "PDF / Zip Code",
    dateAdded: "20/07/2026",
    uploadedBy: "BUFT Academic Hub"
  },

  // 1st Semester - TE
  {
    id: "nh-4",
    title: "Introduction to Textile Engineering - Full Lecture Slides",
    courseCode: "TE 1101",
    semester: "1st Semester",
    department: "TE",
    category: "notes",
    authorName: "Engr. Shahadat Hossain",
    fileUrl: "https://drive.google.com/drive/folders/1buft_sample_notes_te1101",
    description: "Fundamentals of textile fibers, yarn manufacturing processes, and fabric formation.",
    fileType: "Google Drive Folder",
    dateAdded: "10/07/2026",
    uploadedBy: "BUFT Academic Hub"
  },
  {
    id: "nh-5",
    title: "TE 1101 Sessional & Midterm Examination Question Paper",
    courseCode: "TE 1101",
    batch: "Batch 242",
    examType: "SME",
    semester: "1st Semester",
    department: "TE",
    category: "questions",
    fileUrl: "https://drive.google.com/drive/folders/1buft_sample_q_te1101_sme",
    description: "SME exam questions collection with marking breakdown.",
    fileType: "PDF Document",
    dateAdded: "12/07/2026",
    uploadedBy: "BUFT Academic Hub"
  },
  {
    id: "nh-5b",
    title: "TE 1101 Semester End Examination (SEE) Questions",
    courseCode: "TE 1101",
    batch: "Batch 231",
    examType: "SEE",
    semester: "1st Semester",
    department: "TE",
    category: "questions",
    fileUrl: "https://drive.google.com/drive/folders/1buft_sample_q_te1101_see",
    description: "SEE final question collection for Textile Engineering.",
    fileType: "PDF Document",
    dateAdded: "13/07/2026",
    uploadedBy: "BUFT Academic Hub"
  },
  {
    id: "nh-6",
    title: "Textile Fiber Identification Laboratory Report Guide",
    courseCode: "TE 1102",
    semester: "1st Semester",
    department: "TE",
    category: "lab_reports",
    authorName: "Ahsan Habib Tamim (TE 242)",
    fileUrl: "https://drive.google.com/drive/folders/1buft_sample_lab_te1102",
    description: "Burn test, microscopic analysis and chemical solubility lab report templates.",
    fileType: "PDF Manual",
    dateAdded: "14/07/2026",
    uploadedBy: "BUFT Academic Hub"
  }
];
