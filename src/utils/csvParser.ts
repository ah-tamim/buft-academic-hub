import { RoutineItem } from "../routineTypes";

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseClassCell(cellText: string) {
  if (!cellText || !cellText.includes(":")) return null;
  
  let facultyInitial = "";
  const facultyMatch = cellText.match(/\(([^)]+)\)\s*$/);
  let mainText = cellText;
  if (facultyMatch) {
    facultyInitial = facultyMatch[1].trim();
    mainText = cellText.replace(/\(([^)]+)\)\s*$/, "").trim();
  }
  
  const colonIndex = mainText.indexOf(":");
  if (colonIndex === -1) return null;
  
  const courseCode = mainText.substring(0, colonIndex).trim();
  const rest = mainText.substring(colonIndex + 1).trim();
  
  const lastDashIndex = rest.lastIndexOf("-");
  if (lastDashIndex === -1) {
    return {
      courseCode,
      courseName: rest,
      batch: "Unknown",
      fullSectionString: "Unknown",
      facultyInitial
    };
  }
  
  const courseName = rest.substring(0, lastDashIndex).trim();
  const sectionInfo = rest.substring(lastDashIndex + 1).trim();
  
  let batch = "";
  let fullSectionString = "";
  
  const batchMatch = sectionInfo.match(/(\d{3})/);
  if (batchMatch) {
    batch = batchMatch[1];
    const afterBatchIndex = sectionInfo.indexOf(batch) + batch.length;
    let secPart = sectionInfo.substring(afterBatchIndex).trim();
    secPart = secPart.replace(/^[-_ ]*(?:MBA[-_ ]*)?/i, "").trim();
    fullSectionString = secPart || "1";
  } else {
    const batchMatch2 = sectionInfo.match(/(\d{2})/);
    if (batchMatch2) {
      batch = batchMatch2[1];
      const afterBatchIndex = sectionInfo.indexOf(batch) + batch.length;
      let secPart = sectionInfo.substring(afterBatchIndex).trim();
      secPart = secPart.replace(/^[-_ ]*(?:MBA[-_ ]*)?/i, "").trim();
      fullSectionString = secPart || "1";
    } else {
      batch = "Unknown";
      fullSectionString = sectionInfo;
    }
  }
  
  return {
    courseCode,
    courseName,
    batch,
    fullSectionString,
    facultyInitial
  };
}

export function convertToCSVUrl(url: string): string {
  if (!url) return "";
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) {
    const sheetId = match[1];
    const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
    const gid = gidMatch ? `&gid=${gidMatch[1]}` : "";
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gid}`;
  }
  return url;
}

export function parseCSVToRoutine(csvText: string): RoutineItem[] {
  const lines = csvText.split(/\r?\n/);
  let currentDepartment = "";
  let currentHeaders: string[] = [];
  let currentDay = "";
  const parsedItems: RoutineItem[] = [];
  let index = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const cols = parseCSVLine(line);
    if (cols.length < 3) continue;
    
    if (cols[0] && cols[0].trim()) {
      currentDepartment = cols[0].replace(/^"|"$/g, "").trim();
    }
    
    const isHeader = cols[2] && cols[2].trim().toLowerCase() === "room number";
    if (isHeader) {
      currentHeaders = cols;
      continue;
    }
    
    if (cols[1] && cols[1].trim()) {
      const potentialDay = cols[1].trim().toUpperCase();
      if (["SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"].includes(potentialDay)) {
        currentDay = potentialDay;
      }
    }
    
    const roomNo = cols[2] && cols[2].trim();
    if (roomNo && currentHeaders.length > 0 && currentDay) {
      for (let j = 3; j < cols.length; j++) {
        const cellText = cols[j] && cols[j].trim();
        if (cellText) {
          let timeSlot = "";
          for (let h = j; h >= 3; h--) {
            if (currentHeaders[h] && currentHeaders[h].trim()) {
              timeSlot = currentHeaders[h].trim();
              break;
            }
          }
          
          if (timeSlot && /\d{1,2}:\d{2}/.test(timeSlot)) {
            const details = parseClassCell(cellText);
            if (details) {
              let dept = currentDepartment;
              if (dept.includes(",")) {
                dept = dept.split(",")[0].trim();
              }
              if (dept.includes("|")) {
                dept = dept.split("|")[0].trim();
              }
              
              let section = "";
              let subsection = "";
              if (details.fullSectionString) {
                const match = details.fullSectionString.match(/^(\d+)([A-Za-z]+)$/);
                if (match) {
                  section = match[1];
                  subsection = match[2];
                } else {
                  section = details.fullSectionString;
                  subsection = "";
                }
              }
              
              parsedItems.push({
                id: `routine-${index++}`,
                department: dept,
                batch: details.batch,
                section,
                subsection,
                fullSectionString: details.fullSectionString,
                day: currentDay,
                timeSlot: timeSlot.replace(/\r/g, ""),
                courseName: details.courseName,
                courseCode: details.courseCode,
                roomNo,
                facultyInitial: details.facultyInitial
              });
            }
          }
        }
      }
    }
  }
  return parsedItems;
}
