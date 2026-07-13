export interface RoutineItem {
  id: string;
  department: string;
  batch: string;
  section: string;
  subsection: string; // e.g. "A", "B", or ""
  fullSectionString: string; // e.g. "1B", "2A", "3", "Old", "SS"
  day: string; // e.g. "SATURDAY", "SUNDAY", etc.
  timeSlot: string; // e.g. "09:10 AM-10:25 AM"
  courseName: string;
  courseCode: string;
  roomNo: string;
  facultyInitial: string;
}

export interface FilterOptions {
  department: string;
  batch: string;
  section: string;
  subsection: string;
}
