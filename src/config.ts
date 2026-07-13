/**
 * DEVELOPER CONFIGURATION
 * 
 * This file contains central configurations for BGMEA University of Fashion & Technology (BUFT)
 * Routine and Schedule Planner applet.
 * 
 * To update the spreadsheet:
 * 1. Publish your Google Sheet to the web as CSV:
 *    File > Share > Publish to web > Select CSV format
 * 2. Paste the spreadsheet link (or the direct published CSV link) into 'sheetUrl' below.
 * 
 * To update the last modified date displayed:
 * - Update 'lastUpdateDate' below.
 */

export const APP_CONFIG = {
  // Google Spreadsheet URL (Automatic background syncing)
  sheetUrl: "https://docs.google.com/spreadsheets/d/1vdPoJPxAwUDKblyyUv5Nd8cchFRxhcqe4FUAuUA-mTs/edit?usp=sharing",

  // Last update date shown prominently on the dashboard
  lastUpdateDate: "14/07/2026",

  // Academic Semester label shown across the portal and printed in exported PDFs
  semester: "Spring 2026 (261)",
};
