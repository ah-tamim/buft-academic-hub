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
  let trimmed = url.trim();
  
  // If it's already a published CSV or export link, keep it
  if (trimmed.includes("output=csv") || trimmed.includes("tqx=out:csv")) return trimmed;
  
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const sheetId = match[1];
    const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : "0";
    
    // gviz/tq?tqx=out:csv is very reliable for Google Sheets
    return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
  }
  return trimmed;
}

export function getExportCSVUrl(url: string): string {
  if (!url) return "";
  let trimmed = url.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const sheetId = match[1];
    const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : "0";
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  }
  return trimmed;
}

/**
 * Attempts to fetch CSV from Google Sheet URL with fallbacks
 */
export async function fetchCSVFromGoogleSheet(url: string): Promise<string> {
  if (!url) throw new Error("Spreadsheet URL is empty.");
  
  const trimmed = url.trim();
  const primaryUrl = convertToCSVUrl(trimmed);
  const fallbackUrl = getExportCSVUrl(trimmed);

  // Try primary URL (gviz/tq)
  try {
    const res = await fetch(primaryUrl);
    if (res.ok) {
      const text = await res.text();
      if (text && !text.includes("<!DOCTYPE html>")) {
        return text;
      }
    }
  } catch (e) {
    // Continue to fallback
  }

  // Try fallback URL (export?format=csv)
  if (fallbackUrl && fallbackUrl !== primaryUrl) {
    try {
      const res = await fetch(fallbackUrl);
      if (res.ok) {
        const text = await res.text();
        if (text && !text.includes("<!DOCTYPE html>")) {
          return text;
        }
      }
    } catch (e) {
      // Fallback failed
    }
  }

  // Also try direct URL as last resort
  if (trimmed !== primaryUrl && trimmed !== fallbackUrl) {
    const res = await fetch(trimmed);
    if (res.ok) {
      const text = await res.text();
      if (text && !text.includes("<!DOCTYPE html>")) return text;
    }
  }

  throw new Error("HTTP 400: Google Sheet is private or restricted. Please set sharing to 'Anyone with the link' or publish to web as CSV.");
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
