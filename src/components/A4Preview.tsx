import React from 'react';
import { CoverPageState, IndexRow } from '../types';
import { FONT_PRESETS } from '../data';

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return dateStr;
};

const getDeptShortForm = (deptStr: string) => {
  if (!deptStr) return '';
  // Check if there is a parenthesis with a short form, e.g. "Textile Engineering (TE)"
  const parenMatch = deptStr.match(/\(([^)]+)\)/);
  if (parenMatch) {
    return parenMatch[1].trim().toUpperCase();
  }
  // If the user typed the short form directly (e.g. "TE" or "AMT" or "CSE")
  if (deptStr.length <= 5 && deptStr === deptStr.toUpperCase()) {
    return deptStr;
  }
  // Fallbacks or initials
  const upper = deptStr.toUpperCase();
  if (upper.includes('TEXTILE ENGINEERING & MANAGEMENT')) return 'TEM';
  if (upper.includes('TEXTILE ENGINEERING')) return 'TE';
  if (upper.includes('KNITWEAR ENGINEERING')) return 'KE';
  if (upper.includes('APPAREL MERCHANDISING')) return 'AMM';
  if (upper.includes('APPAREL MANUFACTURING')) return 'AMT';
  if (upper.includes('FASHION DESIGN')) return 'FDT';
  if (upper.includes('FASHION STUDIES')) return 'FS';
  if (upper.includes('BUSINESS')) return 'BA';
  if (upper.includes('ENGLISH')) return 'ENG';
  if (upper.includes('COMPUTER SCIENCE')) return 'CSE';
  if (upper.includes('INDUSTRIAL ENGINEERING')) return 'IE';
  if (upper.includes('ENVIRONMENTAL SCIENCE')) return 'ES';
  
  // Otherwise, if it has spaces, take initials
  const cleanStr = deptStr.replace(/department of/i, '').trim();
  const words = cleanStr.split(/\s+/);
  if (words.length > 1) {
    return words.map(w => w[0]).join('').toUpperCase();
  }
  return deptStr.slice(0, 3).toUpperCase();
};

export interface A4PreviewProps {
  state: CoverPageState;
  indexRows: IndexRow[];
  activeTab: 'lab' | 'assignment' | 'index';
  id?: string;
}

export const A4Preview: React.FC<A4PreviewProps> = ({ state, indexRows, activeTab, id = 'a4-print-page' }) => {
  // Find the selected font preset
  const selectedFont = FONT_PRESETS.find((f) => f.value === state.fontFamily) || FONT_PRESETS[0];

  const isColored = state.colorMode !== 'bw';
  const greenBg = isColored ? '#b4cc9a' : '#f3f4f6'; // Light green from PDF vs present light gray
  const orangeBg = isColored ? '#f2be94' : '#f3f4f6'; // Light peach/orange from PDF vs present light gray
  const blueBg = isColored ? '#acd0dc' : '#f3f4f6'; // Light blue/teal from PDF vs present light gray
  const grayBg = isColored ? '#bfbfbf' : '#f3f4f6'; // Gray for Marks Obtained vs present light gray

  // Helper to force hex color for PDF compatibility
  const forceHex = (color: string) => {
    return color.startsWith('#') ? color : '#000000';
  };

  const getEvaluationCriteria = () => {
    const is10 = state.boxSubStyle === '10';
    const type = state.boxCriteriaType;

    if (type === 'custom') {
      const list = state.customCriteriaList || [
        { no: '1.', text: 'Custom Criterion 1', marks: 5 },
        { no: '2.', text: 'Custom Criterion 2', marks: 5 },
        { no: '3.', text: 'Custom Criterion 3', marks: 5 },
        { no: '4.', text: 'Custom Criterion 4', marks: 5 },
      ];
      return list.map(item => ({
        no: item.no,
        text: `${item.text} (${item.marks})`
      }));
    }

    if (is10) {
      if (type === 'eee') {
        return [
          { no: '1.', text: 'Top Page & Objective(s) (2)' },
          { no: '2.', text: 'Required Components & Circuit Diagram (2)' },
          { no: '3.', text: 'Data Table & Calculation (3)' },
          { no: '4.', text: 'Result & Discussion (3)' },
        ];
      }
      // default / workshop / general
      return [
        { no: '1.', text: 'Abstract/Top Page/Objective (2)' },
        { no: '2.', text: 'Theory/Background (2)' },
        { no: '3.', text: 'Diagram/Calculation/Assignment (3)' },
        { no: '4.', text: 'Result and Discussion (3)' },
      ];
    } else {
      if (type === 'mechanical') {
        return [
          { no: '1.', text: 'Top Page,Objective,Apparatus (5)' },
          { no: '2.', text: 'Theory/Background/Diagram (10)' },
          { no: '3.', text: 'Discussion (5)' },
        ];
      }
      // default / cse
      return [
        { no: '1.', text: 'Top Page & Introduction (5)' },
        { no: '2.', text: 'Algorithm (5)' },
        { no: '3.', text: 'Coding & Output (5)' },
        { no: '4.', text: 'Discussion (5)' },
      ];
    }
  };

  const getBorderStyle = () => {
    const isObe = activeTab === 'lab' && state.labFormat === 'obe';
    return {
      padding: `${state.borderPadding}mm`,
      borderColor: isObe ? '#000000' : forceHex(state.borderColor),
      thickness: `${state.borderThickness}px`,
      gap: `${state.borderGap}px`,
    };
  };

  const bs = getBorderStyle();
  const spacingMultiplier = state.verticalSpacing * 0.25;
  const logoSrc = state.customLogo || '/buft-logo.png';

  return (
    <div className="flex-1 flex justify-center items-start overflow-auto p-4 md:p-8 select-none">
      {/* Real A4 Paper representation on screen */}
      <div
        id={id}
        className={`bg-white w-[210mm] h-[297mm] min-w-[210mm] min-h-[297mm] shadow-[0_10px_30px_rgba(0,0,0,0.15)] relative overflow-hidden box-border flex flex-col ${
          activeTab === 'lab' && state.labFormat === 'obe' ? 'font-times text-black' : selectedFont.cssClass
        } lining-nums`}
        style={{
          printColorAdjust: 'exact',
          WebkitPrintColorAdjust: 'exact',
        }}
      >
        {/* Outer Boundary Frame - Styled precisely as a double-bordered page */}
        <div
          className="w-full h-full flex flex-col box-border relative"
          style={{
            padding: activeTab === 'lab' && state.labFormat === 'obe' 
              ? '0.6in 0.82in 0.5in 0.82in' 
              : activeTab === 'lab' && state.labFormat === 'box'
                ? '0.5in 0.64in 0.5in 0.64in'
                : bs.padding,
          }}
        >
          {/* Double line mimic: Outer Line Container */}
          <div
            className="w-full h-full flex flex-col box-border relative"
            style={{
              border: activeTab === 'lab' && (state.labFormat === 'obe' || state.labFormat === 'box') ? 'none' : `${bs.thickness} solid ${forceHex(bs.borderColor)}`,
              padding: activeTab === 'lab' && (state.labFormat === 'obe' || state.labFormat === 'box') ? '0' : bs.gap,
            }}
          >
            {/* Inner Line Container completing the premium academic border effect */}
            <div
              className="w-full h-full flex flex-col items-center box-border relative"
              style={{
                border: activeTab === 'lab' && (state.labFormat === 'obe' || state.labFormat === 'box') ? 'none' : `${bs.thickness} solid ${forceHex(bs.borderColor)}`,
                padding: activeTab === 'lab' && (state.labFormat === 'obe' || state.labFormat === 'box') ? '0px' : '2.5rem 1.8rem',
              }}
            >
              {activeTab === 'lab' && state.labFormat === 'obe' ? (
                // =========================================================================
                // OUTCOME-BASED EDUCATION (OBE) LAB REPORT COVER PAGE LAYOUT
                // =========================================================================
                <div 
                   className="w-full h-full flex flex-col items-center box-border text-black select-text" 
                   style={{ 
                     fontFamily: '"Times New Roman", Times, serif',
                     fontSize: '11pt',
                     lineHeight: '1.2'
                   }}
                >
                  {/* UNIVERSITY HEADER */}
                  <div className="w-full text-center flex flex-col items-center">
                    {logoSrc && (
                      <div className="mb-1 flex items-center justify-center" style={{ width: '0.72in', height: '0.73in' }}>
                        <img
                          src={logoSrc}
                          alt="University Crest"
                          crossOrigin="anonymous" 
                          style={{ width: '0.72in', height: '0.73in' }}
                          className="object-contain mix-blend-multiply"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <h1 
                      className="font-bold uppercase text-black tracking-wide leading-tight" 
                      style={{ 
                        fontFamily: '"Times New Roman", Times, serif', 
                        fontSize: '12pt' 
                      }}
                    >
                      BGMEA UNIVERSITY OF FASHION & TECHNOLOGY
                    </h1>
                    <div 
                      className="leading-normal" 
                      style={{ 
                        fontFamily: '"Segoe Script", "Segoe Print", "Brush Script MT", cursive', 
                        fontSize: '9pt' 
                      }}
                    >
                      Excellence Through Education
                    </div>
                    <h2 
                      className="font-bold uppercase text-black leading-snug" 
                      style={{ 
                        marginTop: '3pt',
                        fontFamily: '"Times New Roman", Times, serif',
                        fontSize: '11pt' 
                      }}
                    >
                      DEPARTMENT OF {state.studentDept ? state.studentDept.replace(/\s*\(.*\)/, '').toUpperCase() : 'APPAREL MANUFACTURING & TECHNOLOGY'}
                    </h2>
                  </div>

                  {/* LAB REPORT ASSESSMENT HEADER */}
                  <div className="my-1 text-center">
                    <div 
                      className="bg-[#2f5597] text-white font-bold tracking-wider px-5 py-0.5 uppercase inline-block select-all"
                      style={{ fontSize: '11pt' }}
                    >
                      LAB REPORT ASSESSMENT
                    </div>
                  </div>

                  {/* DETAILS TABLE */}
                  <div className="w-full my-1">
                    <div className="font-bold text-black mb-1 w-full text-left" style={{ fontSize: '11pt' }}>Course Information:</div>
                    <table 
                      className="w-full border-collapse border border-black text-left text-black" 
                      style={{ 
                        border: '1.5px solid black', 
                        borderCollapse: 'collapse',
                        fontSize: '11pt',
                        fontFamily: '"Times New Roman", Times, serif'
                      }}
                    >
                      <tbody>
                        <tr style={{ height: '0.17in' }}>
                          <td colSpan={3} className="border border-black px-1.5 py-0 font-bold" style={{ border: '1px solid black', width: '25%', height: '0.17in', verticalAlign: 'middle' }}>Course code</td>
                          <td colSpan={9} className="border border-black px-1.5 py-0" style={{ border: '1px solid black', width: '75%', height: '0.17in', verticalAlign: 'middle' }}>{state.courseCode || ''}</td>
                        </tr>
                        <tr style={{ height: '0.17in' }}>
                          <td colSpan={3} className="border border-black px-1.5 py-0 font-bold" style={{ border: '1px solid black', height: '0.17in', verticalAlign: 'middle' }}>Course title</td>
                          <td colSpan={9} className="border border-black px-1.5 py-0" style={{ border: '1px solid black', height: '0.17in', verticalAlign: 'middle' }}>{state.courseTitle || ''}</td>
                        </tr>
                        <tr style={{ height: '0.17in' }}>
                          <td colSpan={3} className="border border-black px-1.5 py-0 font-bold" style={{ border: '1px solid black', height: '0.17in', verticalAlign: 'middle' }}>Category</td>
                          <td colSpan={3} className="border border-black px-1.5 py-0" style={{ border: '1px solid black', width: '25%', height: '0.17in', verticalAlign: 'middle' }}>{state.obeCategory || ''}</td>
                          <td colSpan={3} className="border border-black px-1.5 py-0 font-bold" style={{ border: '1px solid black', width: '25%', height: '0.17in', verticalAlign: 'middle' }}>Level & Term</td>
                          <td colSpan={3} className="border border-black px-1.5 py-0" style={{ border: '1px solid black', width: '25%', height: '0.17in', verticalAlign: 'middle' }}>{state.obeLevelTerm || ''}</td>
                        </tr>
                        <tr style={{ height: '0.17in' }}>
                          <td colSpan={3} rowSpan={2} className="border border-black px-1.5 py-0 font-bold align-middle" style={{ border: '1px solid black', verticalAlign: 'middle' }}>Contact hours/week</td>
                          <td colSpan={2} className="border border-black p-0 text-center font-bold" style={{ border: '1px solid black', height: '0.17in', verticalAlign: 'middle' }}>L</td>
                          <td colSpan={2} className="border border-black p-0 text-center font-bold" style={{ border: '1px solid black', height: '0.17in', verticalAlign: 'middle' }}>T</td>
                          <td colSpan={2} className="border border-black p-0 text-center font-bold" style={{ border: '1px solid black', height: '0.17in', verticalAlign: 'middle' }}>P</td>
                          <td colSpan={3} className="border border-black p-0 text-center font-bold" style={{ border: '1px solid black', height: '0.17in', verticalAlign: 'middle' }}>C</td>
                        </tr>
                        <tr style={{ height: '0.17in' }}>
                          <td colSpan={2} className="border border-black p-0 text-center" style={{ border: '1px solid black', height: '0.17in', verticalAlign: 'middle' }}>{state.obeL || ''}</td>
                          <td colSpan={2} className="border border-black p-0 text-center" style={{ border: '1px solid black', height: '0.17in', verticalAlign: 'middle' }}>{state.obeT || ''}</td>
                          <td colSpan={2} className="border border-black p-0 text-center" style={{ border: '1px solid black', height: '0.17in', verticalAlign: 'middle' }}>{state.obeP || ''}</td>
                          <td colSpan={3} className="border border-black p-0 text-center" style={{ border: '1px solid black', height: '0.17in', verticalAlign: 'middle' }}>{state.obeC || ''}</td>
                        </tr>
                        <tr style={{ height: '0.25in' }}>
                          <td colSpan={2} className="border border-black px-1.5 py-0 font-bold" style={{ border: '1px solid black', width: '16.66%', height: '0.25in', verticalAlign: 'middle' }}>Semester:</td>
                          <td colSpan={2} className="border border-black px-1.5 py-0" style={{ border: '1px solid black', width: '16.66%', height: '0.25in', verticalAlign: 'middle' }}>{state.obeSemester || ''}</td>
                          <td colSpan={2} className="border border-black px-1.5 py-0 font-bold" style={{ border: '1px solid black', width: '16.66%', height: '0.25in', verticalAlign: 'middle' }}>Batch:</td>
                          <td colSpan={2} className="border border-black px-1.5 py-0" style={{ border: '1px solid black', width: '16.66%', height: '0.25in', verticalAlign: 'middle' }}>{state.studentBatch || ''}</td>
                          <td colSpan={2} className="border border-black px-1.5 py-0 font-bold" style={{ border: '1px solid black', width: '16.66%', height: '0.25in', verticalAlign: 'middle' }}>Section:</td>
                          <td colSpan={2} className="border border-black px-1.5 py-0" style={{ border: '1px solid black', width: '16.66%', height: '0.25in', verticalAlign: 'middle' }}>{state.studentSection || ''}</td>
                        </tr>
                        <tr style={{ height: '0.17in' }}>
                          <td colSpan={3} className="border border-black px-1.5 py-0 font-bold" style={{ border: '1px solid black', height: '0.17in', verticalAlign: 'middle' }}>Date of Submission</td>
                          <td colSpan={9} className="border border-black px-1.5 py-0" style={{ border: '1px solid black', height: '0.17in', verticalAlign: 'middle' }}>{state.submissionDate || ''}</td>
                        </tr>
                        <tr style={{ height: '0.17in' }}>
                          <td colSpan={3} className="border border-black px-1.5 py-0 font-bold" style={{ border: '1px solid black', height: '0.17in', verticalAlign: 'middle' }}>Supervisor</td>
                          <td colSpan={5} className="border border-black px-1.5 py-0" style={{ border: '1px solid black', height: '0.17in', verticalAlign: 'middle' }}>{state.obeSupervisor || ''}</td>
                          <td colSpan={2} className="border border-black px-1.5 py-0 font-bold" style={{ border: '1px solid black', height: '0.17in', verticalAlign: 'middle' }}>Department</td>
                          <td colSpan={2} className="border border-black px-1.5 py-0" style={{ border: '1px solid black', height: '0.17in', verticalAlign: 'middle' }}>{state.obeShortDept || ''}</td>
                        </tr>
                        <tr style={{ height: '0.17in' }}>
                          <td colSpan={2} className="border border-black px-1.5 py-0 font-bold" style={{ border: '1px solid black', height: '0.17in', verticalAlign: 'middle' }}>CLO</td>
                          <td colSpan={2} className="border border-black px-1.5 py-0 text-center" style={{ border: '1px solid black', height: '0.17in', verticalAlign: 'middle' }}>{state.obeClo || ''}</td>
                          <td colSpan={2} className="border border-black px-1.5 py-0 font-bold" style={{ border: '1px solid black', height: '0.17in', verticalAlign: 'middle' }}>PLO</td>
                          <td colSpan={2} className="border border-black px-1.5 py-0 text-center" style={{ border: '1px solid black', height: '0.17in', verticalAlign: 'middle' }}>{state.obePlo || ''}</td>
                          <td colSpan={2} className="border border-black px-1.5 py-0 font-bold" style={{ border: '1px solid black', height: '0.17in', verticalAlign: 'middle' }}>C-Level</td>
                          <td colSpan={2} className="border border-black px-1.5 py-0 text-center" style={{ border: '1px solid black', height: '0.17in', verticalAlign: 'middle' }}>{state.obeClevel || ''}</td>
                        </tr>
                        <tr style={{ height: '0.7in' }}>
                          <td colSpan={12} className="border border-black p-2 align-top text-left font-bold" style={{ border: '1px solid black', height: '0.7in' }}>
                            <div className="flex flex-row w-full items-start">
                              <div style={{ width: '1.4in', flexShrink: 0 }} className="break-words">
                                Exp. No: <span className="font-normal ml-1">{state.experimentNo || ''}</span>
                              </div>
                              <div className="flex-1 break-words">
                                Exp. Name: <span className="font-normal ml-1">{state.experimentName || ''}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* DECLARATION AND STATEMENT OF AUTHORSHIP */}
                  <div 
                    className="w-full text-left leading-[1.25] text-black my-1.5"
                    style={{ fontFamily: '"Times New Roman", Times, serif' }}
                  >
                    <div className="font-bold mb-1" style={{ fontSize: '11pt' }}>Declaration and statement of authorship:</div>
                    <div className="space-y-0.5" style={{ fontSize: '9pt' }}>
                      <div className="flex items-start">
                        <span className="w-4 flex-shrink-0 text-right mr-1.5 font-bold">1.</span>
                        <div>I have a copy of this report which can be produced if the original is lost/ damaged.</div>
                      </div>
                      <div className="flex items-start">
                        <span className="w-4 flex-shrink-0 text-right mr-1.5 font-bold">2.</span>
                        <div>This report is my original work and no part of it has been copied from any other student's work or from any other source except where due acknowledgement is made.</div>
                      </div>
                      <div className="flex items-start">
                        <span className="w-4 flex-shrink-0 text-right mr-1.5 font-bold">3.</span>
                        <div>No part of this report has been written for me by any other person except where such collaboration has been authorized by the lecturer/teacher concerned and is clearly acknowledged in the report.</div>
                      </div>
                      <div className="flex items-start">
                        <span className="w-4 flex-shrink-0 text-right mr-1.5 font-bold">4.</span>
                        <div>I have not previously submitted or currently submitting this work for any other course/unit.</div>
                      </div>
                      <div className="flex items-start">
                        <span className="w-4 flex-shrink-0 text-right mr-1.5 font-bold">5.</span>
                        <div>This work may be reproduced, communicated, compared and archived for the purpose of detecting plagiarism.</div>
                      </div>
                      <div className="flex items-start">
                        <span className="w-4 flex-shrink-0 text-right mr-1.5 font-bold">6.</span>
                        <div>I give permission for a copy of my marked work to be retained by the school for review and comparison, including review by external examiners.</div>
                      </div>
                    </div>

                    <div className="font-bold mt-1.5 mb-1" style={{ fontSize: '11pt' }}>I understand that:</div>
                    <div className="space-y-0.5" style={{ fontSize: '9pt' }}>
                      <div className="flex items-start">
                        <span className="w-4 flex-shrink-0 text-right mr-1.5 font-bold">7.</span>
                        <div>Plagiarism is the presentation of the work, idea or creation of another person as though it is your own. It is a form of cheating and is a very serious academic offence that may lead to expulsion from the University. Plagiarized material can be drawn from and presented in written, graphic and visual form including electronic data and oral presentations. Plagiarism occurs when the origin of the material used is not appropriately cited.</div>
                      </div>
                      <div className="flex items-start">
                        <span className="w-4 flex-shrink-0 text-right mr-1.5 font-bold">8.</span>
                        <div>Enabling plagiarism is the act of assisting or allowing another person to plagiarize or to copy your work.</div>
                      </div>
                    </div>
                  </div>

                  {/* SUBMITTED BY TABLE */}
                  <div className="w-full my-1">
                    <div className="font-bold text-black mb-1" style={{ fontSize: '11pt', marginTop: '3pt', fontFamily: '"Times New Roman", Times, serif' }}>Submitted by:</div>
                    <table 
                      className="w-full border-collapse border border-black text-left text-black" 
                      style={{ 
                        border: '1.5px solid black', 
                        borderCollapse: 'collapse',
                        fontSize: '11pt',
                        fontFamily: '"Times New Roman", Times, serif',
                        width: '6.63in',
                        maxWidth: '6.63in'
                      }}
                    >
                      <thead>
                        <tr className="bg-[#2f5597] text-white" style={{ height: '0.26in' }}>
                          <th className="border border-black font-bold" style={{ border: '1px solid black', color: 'white', width: '1.63in', minWidth: '1.63in', maxWidth: '1.63in', height: '0.26in', verticalAlign: 'middle', padding: '0px 6px' }}>Student's ID</th>
                          <th className="border border-black font-bold" style={{ border: '1px solid black', color: 'white', width: '3.19in', minWidth: '3.19in', maxWidth: '3.19in', height: '0.26in', verticalAlign: 'middle', padding: '0px 6px' }}>Student's Name</th>
                          <th className="border border-black font-bold text-center" style={{ border: '1px solid black', color: 'white', width: '1.81in', minWidth: '1.81in', maxWidth: '1.81in', height: '0.26in', verticalAlign: 'middle', padding: '0px 6px' }}>Signature</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ height: '0.24in' }}>
                          <td className="border border-black" style={{ border: '1px solid black', width: '1.63in', minWidth: '1.63in', maxWidth: '1.63in', height: '0.24in', verticalAlign: 'middle', padding: '0px 6px' }}>{state.studentId || ''}</td>
                          <td className="border border-black" style={{ border: '1px solid black', width: '3.19in', minWidth: '3.19in', maxWidth: '3.19in', height: '0.24in', verticalAlign: 'middle', padding: '0px 6px' }}>{state.studentName || ''}</td>
                          <td className="border border-black" style={{ border: '1px solid black', width: '1.81in', minWidth: '1.81in', maxWidth: '1.81in', height: '0.24in', verticalAlign: 'middle', padding: '0px 6px' }}></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* FOR FACULTY USE ONLY TABLE */}
                  <div className="w-full my-1">
                    <div className="font-bold text-black mb-1" style={{ fontSize: '11pt', marginTop: '3pt', fontFamily: '"Times New Roman", Times, serif' }}>For faculty use only:</div>
                    <table 
                      className="w-full border-collapse border border-black text-left text-black" 
                      style={{ 
                        border: '1.5px solid black', 
                        borderCollapse: 'collapse',
                        fontSize: '11pt',
                        fontFamily: '"Times New Roman", Times, serif',
                        width: '6.63in',
                        maxWidth: '6.63in'
                      }}
                    >
                      <thead>
                        <tr className="text-center bg-[#2f5597] text-white" style={{ height: '0.17in' }}>
                          <th rowSpan={2} style={{ border: '1.5px solid black', width: '0.25in', minWidth: '0.25in', maxWidth: '0.25in', verticalAlign: 'middle', color: 'white', padding: '0px 4px', fontSize: '11pt' }}>#</th>
                          <th rowSpan={2} style={{ border: '1.5px solid black', width: '2.25in', minWidth: '2.25in', maxWidth: '2.25in', verticalAlign: 'middle', textAlign: 'left', color: 'white', padding: '0px 6px', whiteSpace: 'nowrap', fontSize: '11pt' }}>Assessment/Evaluation Criteria</th>
                          <th colSpan={5} style={{ border: '1.5px solid black', width: '2.55in', minWidth: '2.55in', maxWidth: '2.55in', verticalAlign: 'middle', color: 'white', padding: '0px 4px', whiteSpace: 'nowrap', fontSize: '11pt' }}>Performance Level [Put Tick (✓) Mark]</th>
                          <th rowSpan={2} style={{ border: '1.5px solid black', width: '0.8in', minWidth: '0.8in', maxWidth: '0.8in', verticalAlign: 'middle', color: 'white', padding: '0px 4px', fontSize: '11pt' }}>Marks Obtained</th>
                          <th rowSpan={2} style={{ border: '1.5px solid black', width: '0.78in', minWidth: '0.78in', maxWidth: '0.78in', verticalAlign: 'middle', textAlign: 'left', color: 'white', padding: '0px 6px', fontSize: '11pt' }}>Remarks</th>
                        </tr>
                        <tr className="text-center bg-[#2f5597] text-white" style={{ height: '0.27in' }}>
                          <th style={{ border: '1.5px solid black', width: '0.51in', minWidth: '0.51in', maxWidth: '0.51in', verticalAlign: 'middle', color: 'white', padding: '0px 2px', fontSize: '8pt' }}>Excellent</th>
                          <th style={{ border: '1.5px solid black', width: '0.51in', minWidth: '0.51in', maxWidth: '0.51in', verticalAlign: 'middle', color: 'white', padding: '0px 2px', fontSize: '8pt' }}>Good</th>
                          <th style={{ border: '1.5px solid black', width: '0.51in', minWidth: '0.51in', maxWidth: '0.51in', verticalAlign: 'middle', color: 'white', padding: '0px 2px', fontSize: '8pt' }}>Fair</th>
                          <th style={{ border: '1.5px solid black', width: '0.51in', minWidth: '0.51in', maxWidth: '0.51in', verticalAlign: 'middle', color: 'white', padding: '0px 2px', fontSize: '8pt' }}>Average</th>
                          <th style={{ border: '1.5px solid black', width: '0.51in', minWidth: '0.51in', maxWidth: '0.51in', verticalAlign: 'middle', color: 'white', padding: '0px 2px', fontSize: '8pt' }}>Poor</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ height: '0.27in' }}>
                          <td style={{ border: '1px solid black', width: '0.25in', textAlign: 'center', verticalAlign: 'middle', padding: '0px 4px' }}>1</td>
                          <td style={{ border: '1px solid black', width: '2.25in', verticalAlign: 'middle', padding: '0px 6px' }}>Lab Report Format (5)</td>
                          <td style={{ border: '1px solid black', width: '0.51in' }}></td>
                          <td style={{ border: '1px solid black', width: '0.51in' }}></td>
                          <td style={{ border: '1px solid black', width: '0.51in' }}></td>
                          <td style={{ border: '1px solid black', width: '0.51in' }}></td>
                          <td style={{ border: '1px solid black', width: '0.51in' }}></td>
                          <td style={{ border: '1px solid black', width: '0.8in' }}></td>
                          <td style={{ border: '1px solid black', width: '0.78in' }}></td>
                        </tr>
                        <tr style={{ height: '0.27in' }}>
                          <td style={{ border: '1px solid black', width: '0.25in', textAlign: 'center', verticalAlign: 'middle', padding: '0px 4px' }}>2</td>
                          <td style={{ border: '1px solid black', width: '2.25in', verticalAlign: 'middle', padding: '0px 6px' }}>Experimental Procedures (5)</td>
                          <td style={{ border: '1px solid black', width: '0.51in' }}></td>
                          <td style={{ border: '1px solid black', width: '0.51in' }}></td>
                          <td style={{ border: '1px solid black', width: '0.51in' }}></td>
                          <td style={{ border: '1px solid black', width: '0.51in' }}></td>
                          <td style={{ border: '1px solid black', width: '0.51in' }}></td>
                          <td style={{ border: '1px solid black', width: '0.8in' }}></td>
                          <td style={{ border: '1px solid black', width: '0.78in' }}></td>
                        </tr>
                        <tr style={{ height: '0.27in' }}>
                          <td style={{ border: '1px solid black', width: '0.25in', textAlign: 'center', verticalAlign: 'middle', padding: '0px 4px' }}>3</td>
                          <td style={{ border: '1px solid black', width: '2.25in', verticalAlign: 'middle', padding: '0px 6px' }}>Presentation of Findings (5)</td>
                          <td style={{ border: '1px solid black', width: '0.51in' }}></td>
                          <td style={{ border: '1px solid black', width: '0.51in' }}></td>
                          <td style={{ border: '1px solid black', width: '0.51in' }}></td>
                          <td style={{ border: '1px solid black', width: '0.51in' }}></td>
                          <td style={{ border: '1px solid black', width: '0.51in' }}></td>
                          <td style={{ border: '1px solid black', width: '0.8in' }}></td>
                          <td style={{ border: '1px solid black', width: '0.78in' }}></td>
                        </tr>
                        <tr style={{ height: '0.27in' }}>
                          <td style={{ border: '1px solid black', width: '0.25in', textAlign: 'center', verticalAlign: 'middle', padding: '0px 4px' }}>4</td>
                          <td style={{ border: '1px solid black', width: '2.25in', verticalAlign: 'middle', padding: '0px 6px' }}>Analysis & Conclusions (5)</td>
                          <td style={{ border: '1px solid black', width: '0.51in' }}></td>
                          <td style={{ border: '1px solid black', width: '0.51in' }}></td>
                          <td style={{ border: '1px solid black', width: '0.51in' }}></td>
                          <td style={{ border: '1px solid black', width: '0.51in' }}></td>
                          <td style={{ border: '1px solid black', width: '0.51in' }}></td>
                          <td style={{ border: '1px solid black', width: '0.8in' }}></td>
                          <td style={{ border: '1px solid black', width: '0.78in' }}></td>
                        </tr>
                        <tr style={{ height: '0.27in' }}>
                          <td colSpan={7} style={{ border: '1px solid black', width: '5.05in', textAlign: 'right', verticalAlign: 'middle', padding: '0px 8px', fontWeight: 'bold' }}>Total marks 20</td>
                          <td style={{ border: '1px solid black', width: '0.8in' }}></td>
                          <td style={{ border: '1px solid black', width: '0.78in' }}></td>
                        </tr>
                      </tbody>
                    </table>
                    <div 
                      className="text-black font-serif mt-0.5 text-left"
                      style={{ fontSize: '8pt', fontFamily: '"Times New Roman", Times, serif' }}
                    >
                      [Excellent = 5.00, Good = 4.00, Fair = 3.00, Average = 2.00, Poor = 1.00]
                    </div>
                  </div>
                </div>
              ) : activeTab === 'lab' && state.labFormat === 'box' ? (
                // =========================================================================
                // BOX FORMAT COVER PAGE LAYOUT
                // =========================================================================
                <div 
                  className="w-full h-full flex flex-col items-center box-border text-black select-text" 
                  style={{ 
                    fontFamily: '"Times New Roman", Times, serif',
                    lineHeight: '1.2'
                  }}
                >
                  {/* UNIVERSITY HEADER */}
                  <div className="w-full text-center flex flex-col items-center">
                    <div className="flex items-center justify-center gap-3">
                      {logoSrc && (
                        <div className="flex items-center justify-center" style={{ width: '0.62in', height: '0.63in' }}>
                          <img
                            src={logoSrc}
                            alt="University Crest"
                            crossOrigin="anonymous" 
                            style={{ width: '0.62in', height: '0.63in' }}
                            className="object-contain mix-blend-multiply"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <h1 
                        className="font-bold text-black tracking-wide text-center" 
                        style={{ 
                          fontFamily: '"Times New Roman", Times, serif', 
                          fontSize: '18pt',
                          margin: 0
                        }}
                      >
                        BGMEA University of Fashion and Technology
                      </h1>
                    </div>
                    <div className="text-center" style={{ marginTop: '0px', marginBottom: '1.2rem' }}>
                      <span 
                        className="font-bold underline uppercase" 
                        style={{ 
                          fontFamily: '"Times New Roman", Times, serif', 
                          fontSize: '16pt' 
                        }}
                      >
                        Lab Report – Top Page
                      </span>
                    </div>
                  </div>

                  {/* Course Code & Course Title Spaced out */}
                  <div className="w-full flex justify-between items-center font-bold px-1" style={{ fontSize: '12pt', marginBottom: '1rem' }}>
                    <div>
                      <span>Course Code: </span>
                      <span className="font-bold">{state.courseCode || 'CSE06111102'}</span>
                    </div>
                    <div className="text-right max-w-[65%]">
                      <span>Course Title: </span>
                      <span className="font-bold">{state.courseTitle || 'Elements of Electrical Engineering & Electronics'}</span>
                    </div>
                  </div>

                  {/* Experiment No. & Experiment Name Box */}
                  <table className="w-full border-collapse text-[12pt]" style={{ border: '1.5px solid black', marginBottom: '1.2rem' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1.5px solid black', height: '0.24in' }}>
                        <td 
                          className="font-bold text-center" 
                          style={{ width: '1.37in', minWidth: '1.37in', maxWidth: '1.37in', borderRight: '1.5px solid black', verticalAlign: 'middle', height: '0.24in', padding: '0px', backgroundColor: greenBg }}
                        >
                          Experiment No.
                        </td>
                        <td className="text-left px-3 bg-white" style={{ width: '5.62in', minWidth: '5.62in', maxWidth: '5.62in', verticalAlign: 'middle', height: '0.24in', padding: '0px 12px' }}>
                          {state.experimentNo || '01'}
                        </td>
                      </tr>
                      <tr style={{ height: '0.63in' }}>
                        <td 
                          className="font-bold text-center" 
                          style={{ width: '1.37in', minWidth: '1.37in', maxWidth: '1.37in', borderRight: '1.5px solid black', verticalAlign: 'middle', height: '0.63in', padding: '0px', backgroundColor: greenBg }}
                        >
                          Experiment Name
                        </td>
                        <td className="text-left font-bold bg-white leading-tight" style={{ width: '5.62in', minWidth: '5.62in', maxWidth: '5.62in', verticalAlign: 'middle', height: '0.63in', padding: '4px 12px' }}>
                          {state.experimentName || 'Determination of While and For Logic Problem and Solving them'}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Evaluation Criteria Table */}
                  <table className="w-full border-collapse text-[12pt]" style={{ border: '1.5px solid black', marginBottom: '1.2rem', tableLayout: 'fixed', width: '6.99in' }}>
                    <thead>
                      <tr style={{ borderBottom: '1.5px solid black', height: '50px' }}>
                        <th 
                          rowSpan={2} 
                          className="text-center font-bold bg-white" 
                          style={{ width: '0.35in', minWidth: '0.35in', maxWidth: '0.35in', borderRight: '1.5px solid black', verticalAlign: 'middle', height: '180px' }}
                        >
                          No.
                        </th>
                        <th 
                          rowSpan={2} 
                          className="text-center font-bold bg-white" 
                          style={{ 
                            width: '1.99in', 
                            minWidth: '1.99in', 
                            maxWidth: '1.99in', 
                            borderRight: '1.5px solid black', 
                            verticalAlign: 'middle',
                            padding: '4px',
                            height: '180px'
                          }}
                        >
                          <div>Evaluation Criteria with</div>
                          <div>Marks</div>
                        </th>
                        <th 
                          colSpan={5} 
                          className="text-center font-bold bg-white" 
                          style={{ borderRight: '1.5px solid black', borderBottom: '1.5px solid black', padding: '4px 0', verticalAlign: 'middle', height: '50px' }}
                        >
                          Put Tick (✓) Mark
                        </th>
                        <th 
                          rowSpan={2} 
                          className="font-bold text-center" 
                          style={{ width: '0.70in', minWidth: '0.70in', maxWidth: '0.70in', borderRight: '1.5px solid black', verticalAlign: 'middle', height: '180px', backgroundColor: grayBg }}
                        >
                          <div className="flex items-center justify-center h-full w-full">
                            <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap' }}>
                              Marks Obtained
                            </span>
                          </div>
                        </th>
                        <th 
                          rowSpan={2} 
                          className="text-center font-bold bg-white" 
                          style={{ width: '1.20in', minWidth: '1.20in', maxWidth: '1.20in', verticalAlign: 'middle', height: '180px' }}
                        >
                          Remark
                        </th>
                      </tr>
                      <tr style={{ borderBottom: '1.5px solid black', height: '130px' }}>
                        {(state.boxGradingType === 'vgood' || (!state.boxGradingType && state.boxSubStyle === '20')
                          ? ['Excellent', 'V. Good', 'Good', 'Fair', 'Poor'] 
                          : ['Excellent', 'Good', 'Fair', 'Poor', 'Fail']
                        ).map((label, idx) => (
                          <th 
                            key={idx}
                            className="font-bold text-center" 
                            style={{ 
                              width: '0.55in', 
                              minWidth: '0.55in', 
                              maxWidth: '0.55in', 
                              borderRight: '1.5px solid black', 
                              height: '130px',
                              verticalAlign: 'middle',
                              backgroundColor: greenBg
                            }}
                          >
                            <div className="flex items-center justify-center h-full w-full">
                              <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap' }}>
                                {label}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                       {/* Sub-Header Group Row */}
                       <tr style={{ borderBottom: '1.5px solid black' }}>
                        <td colSpan={9} className="text-center font-bold bg-white py-1.5 text-[16pt] tracking-wider" style={{ verticalAlign: 'middle' }}>
                           Report Writing
                        </td>
                      </tr>
                      
                      {/* Evaluation Criteria Details */}
                      {getEvaluationCriteria().map((row, rowIdx) => (
                        <tr key={rowIdx} style={{ borderBottom: '1.5px solid black', height: '50px' }}>
                          <td 
                            className="text-center font-medium" 
                            style={{ borderRight: '1.5px solid black', verticalAlign: 'middle', height: '50px', backgroundColor: greenBg }}
                          >
                            {row.no}
                          </td>
                          <td 
                            className="text-left bg-white font-medium" 
                            style={{ 
                              borderRight: '1.5px solid black', 
                              verticalAlign: 'middle', 
                              height: '50px',
                              width: '1.99in',
                              minWidth: '1.99in',
                              maxWidth: '1.99in',
                              padding: '4px 8px',
                              fontSize: '11pt',
                              lineHeight: '1.15',
                              wordBreak: 'break-word'
                            }}
                          >
                            {row.text}
                          </td>
                          {/* Tick cells */}
                          {Array.from({ length: 5 }).map((_, colIdx) => (
                            <td 
                              key={colIdx} 
                              className="bg-white" 
                              style={{ borderRight: '1.5px solid black', height: '50px' }}
                            ></td>
                          ))}
                          {/* Marks Obtained cell */}
                          <td 
                            className="bg-white" 
                            style={{ borderRight: '1.5px solid black', height: '50px' }}
                          ></td>
                          {/* Remark cell */}
                          <td className="bg-white" style={{ height: '50px' }}></td>
                        </tr>
                      ))}

                      {/* Total Marks row */}
                      <tr style={{ height: '50px' }}>
                        <td 
                          className="text-center font-medium" 
                          style={{ borderRight: '1.5px solid black', verticalAlign: 'middle', height: '50px', backgroundColor: greenBg }}
                        ></td>
                        <td 
                          className="text-center font-bold bg-white text-[16pt]" 
                          style={{ borderRight: '1.5px solid black', verticalAlign: 'middle', height: '50px' }}
                        >
                          Total
                        </td>
                        {/* Tick cells */}
                        {Array.from({ length: 5 }).map((_, colIdx) => (
                          <td 
                            key={colIdx} 
                            className="bg-white" 
                            style={{ borderRight: '1.5px solid black', height: '50px' }}
                          ></td>
                        ))}
                        {/* Marks Obtained cell */}
                        <td 
                          className="bg-white" 
                          style={{ borderRight: '1.5px solid black', height: '50px' }}
                        ></td>
                        {/* Remark cell */}
                        <td className="bg-white" style={{ height: '50px' }}></td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Bottom section container pushed to the bottom of page */}
                  <div className="w-full mt-auto flex flex-col" style={{ marginTop: '0.35in' }}>
                    {/* Dates / Signatures table */}
                    <table className="w-full border-collapse text-[12pt]" style={{ border: '1.5px solid black', marginBottom: '1.2rem' }}>
                      <tbody>
                        <tr style={{ height: '0.3in', borderBottom: '1.5px solid black' }}>
                          <td className="w-1/3 text-center font-bold bg-white text-[14pt]" style={{ borderRight: '1.5px solid black', verticalAlign: 'middle', height: '0.3in', padding: '0px' }}>
                            {state.performanceDate || ''}
                          </td>
                          <td className="w-1/3 text-center font-bold bg-white text-[14pt]" style={{ borderRight: '1.5px solid black', verticalAlign: 'middle', height: '0.3in', padding: '0px' }}>
                            {state.submissionDate || ''}
                          </td>
                          <td className="w-1/3 bg-white" style={{ height: '0.3in', padding: '0px' }}></td>
                        </tr>
                        <tr style={{ height: '0.33in' }}>
                          <td 
                            className="w-1/3 font-bold text-center" 
                            style={{ borderRight: '1.5px solid black', verticalAlign: 'middle', height: '0.33in', padding: '0px', backgroundColor: orangeBg }}
                          >
                            Date of Experiment
                          </td>
                          <td 
                            className="w-1/3 font-bold text-center" 
                            style={{ borderRight: '1.5px solid black', verticalAlign: 'middle', height: '0.33in', padding: '0px', backgroundColor: orangeBg }}
                          >
                            Date of Submission
                          </td>
                          <td className="w-1/3 font-bold text-center" style={{ verticalAlign: 'middle', height: '0.33in', padding: '0px', backgroundColor: orangeBg }}>
                            Signature
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Submitted To / Submitted By Columns */}
                    <div className="flex justify-between items-start gap-4 w-full">
                      {/* Left Column: Submitted to */}
                      <div className="flex-1 flex flex-col items-start">
                        <div className="font-bold underline text-[14pt] mb-3 select-none">Submitted to:</div>
                        <table className="border-collapse text-[12pt]" style={{ border: '1.5px solid black', width: '2.34in' }}>
                          <tbody>
                            <tr style={{ borderBottom: '1.5px solid black', height: '30px' }}>
                              <td 
                                className="font-bold text-left px-2" 
                                style={{ width: '1.38in', minWidth: '1.38in', maxWidth: '1.38in', borderRight: '1.5px solid black', verticalAlign: 'middle', backgroundColor: blueBg }}
                              >
                                Faculty Initials:
                              </td>
                              <td 
                                className="text-center font-bold px-2 bg-white text-[14pt]" 
                                style={{ width: '0.96in', minWidth: '0.96in', maxWidth: '0.96in', verticalAlign: 'middle' }}
                              >
                                {state.facultyInitials || ''}
                              </td>
                            </tr>
                            <tr style={{ borderBottom: '1.5px solid black', height: '30px' }}>
                              <td 
                                className="font-bold text-left px-2" 
                                style={{ width: '1.38in', minWidth: '1.38in', maxWidth: '1.38in', borderRight: '1.5px solid black', verticalAlign: 'middle', backgroundColor: blueBg }}
                              >
                                GTA Initials
                              </td>
                              <td 
                                className="text-center font-bold px-2 bg-white text-[14pt]" 
                                style={{ width: '0.96in', minWidth: '0.96in', maxWidth: '0.96in', verticalAlign: 'middle' }}
                              >
                                {state.gtaInitials || ''}
                              </td>
                            </tr>
                            <tr style={{ height: '0.55in' }}>
                              <td 
                                className="font-bold text-left px-2" 
                                style={{ width: '1.38in', minWidth: '1.38in', maxWidth: '1.38in', borderRight: '1.5px solid black', verticalAlign: 'middle', height: '0.55in', backgroundColor: blueBg }}
                              >
                                Lab Room No:
                              </td>
                              <td 
                                className="text-center font-bold px-2 bg-white text-[14pt]" 
                                style={{ width: '0.96in', minWidth: '0.96in', maxWidth: '0.96in', verticalAlign: 'middle', height: '0.55in' }}
                              >
                                {state.labRoomNo || '910'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Right Column: Submitted by */}
                      <div className="flex-1 flex flex-col items-start">
                        <div className="font-bold underline text-[14pt] mb-3 select-none">Submitted by:</div>
                        <table className="w-full border-collapse text-[12pt]" style={{ border: '1.5px solid black' }}>
                          <tbody>
                            <tr style={{ borderBottom: '1.5px solid black', height: '30px' }}>
                              <td 
                                className="font-semibold text-left px-2" 
                                style={{ width: '135px', minWidth: '135px', maxWidth: '135px', borderRight: '1.5px solid black', verticalAlign: 'middle', backgroundColor: orangeBg }}
                              >
                                Student Name:
                              </td>
                              <td className="text-center font-bold px-2 bg-white text-[14pt]" style={{ verticalAlign: 'middle' }}>
                                {state.studentName || 'Mottakin'}
                              </td>
                            </tr>
                            <tr style={{ borderBottom: '1.5px solid black', height: '30px' }}>
                              <td 
                                className="font-semibold text-left px-2" 
                                style={{ width: '135px', minWidth: '135px', maxWidth: '135px', borderRight: '1.5px solid black', verticalAlign: 'middle', backgroundColor: orangeBg }}
                              >
                                Student ID:
                              </td>
                              <td className="text-center font-bold px-2 bg-white text-[14pt]" style={{ verticalAlign: 'middle' }}>
                                {state.studentId || '242-520-801'}
                              </td>
                            </tr>
                            <tr style={{ height: '0.55in' }}>
                              <td 
                                className="font-semibold text-left px-2" 
                                style={{ width: '135px', minWidth: '135px', maxWidth: '135px', borderRight: '1.5px solid black', verticalAlign: 'middle', height: '0.55in', backgroundColor: orangeBg }}
                              >
                                Department, Batch & Section:
                              </td>
                              <td className="text-center font-bold px-1.5 bg-white leading-tight text-[14pt]" style={{ verticalAlign: 'middle', height: '0.55in' }}>
                                <div>{getDeptShortForm(state.studentDept) || 'TE'} – {state.studentBatch || '242'}</div>
                                <div>Section – {state.studentSection || '6B'}</div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // =========================================================================
                // ORIGINAL PLAIN FORMAT COVER PAGE
                // =========================================================================
                <>
                  {/* UNIVERSITY HEADER BANNER */}
                  <div className="w-full text-center flex flex-col items-center z-10">
                    <h1 
                      className="font-bold tracking-wide text-center uppercase"
                      style={{
                        color: forceHex(state.borderColor === '#1e293b' ? '#0f172a' : state.borderColor),
                        fontSize: '22px',
                        lineHeight: '1.2',
                        fontFamily: state.fontFamily === 'serif' ? 'Times New Roman, Georgia, serif' : undefined,
                      }}
                    >
                      {state.universityName}
                    </h1>
                    
                    {/* Logo is permanently visible */}
                    {logoSrc && (
                      <div 
                        className="flex justify-center items-center my-4 transition-all"
                        style={{
                          height: `${45 + state.verticalSpacing * 6}px`,
                          marginTop: `${8 * spacingMultiplier}px`,
                          marginBottom: `${10 * spacingMultiplier}px`,
                        }}
                      >
                        <img
                          src={logoSrc}
                          alt="University Crest"
                          crossOrigin="anonymous" 
                          className="h-full w-auto object-contain mix-blend-multiply"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* COVER PAGE CONTENT - LAB REPORT OR ASSIGNMENT */}
                  {activeTab !== 'index' ? (
                    <div className="w-full flex-1 flex flex-col items-center relative box-border">
                      {/* Category Title Box Accent */}
                      <div 
                        className="w-[85%] text-center px-4 py-2 mt-2 transition-all"
                        style={{
                          border: `1.5px solid ${forceHex(state.borderColor)}`,
                          borderWidth: state.titleBoxStyle === 'double' ? '3px' : '1.5px',
                          borderStyle: state.titleBoxStyle === 'double' ? 'double' : 'solid',
                          backgroundColor: state.titleBoxStyle === 'solid' ? state.borderColor : 'transparent',
                        }}
                      >
                        <span 
                          className="text-lg font-bold tracking-widest uppercase"
                          style={{
                            color: state.titleBoxStyle === 'solid' ? '#ffffff' : state.borderColor,
                          }}
                        >
                          {activeTab === 'lab' ? 'LAB REPORT' : 'ASSIGNMENT'}
                        </span>
                      </div>

                      {/* DETAILS BODY */}
                      <div 
                        className="w-full text-left space-y-4 mt-8"
                        style={{
                          fontSize: '13.5px',
                          color: '#1e293b',
                        }}
                      >
                        {/* Course Code & Title */}
                        <div className="flex items-start">
                          <span className="shrink-0 text-slate-600 font-semibold uppercase tracking-wider w-[120px] text-xs">Course Code:</span>
                          <span className="border-b border-dashed border-slate-300 flex-1 pb-0.5 capitalize text-slate-800 font-medium text-[13.5px]">
                            {state.courseCode || '—'}
                          </span>
                        </div>

                        <div className="flex items-start">
                          <span className="shrink-0 text-slate-600 font-semibold uppercase tracking-wider w-[120px] text-xs">Course Title:</span>
                          <span className="border-b border-dashed border-slate-300 flex-1 pb-0.5 capitalize text-slate-800 font-medium text-[13.5px] leading-relaxed">
                            {state.courseTitle || '—'}
                          </span>
                        </div>

                        {/* LAB REPORT SPECIFIC FIELDS */}
                        {activeTab === 'lab' && (
                          <div className="space-y-4 pt-1 w-full">
                            <div className="flex items-start">
                              <span className="w-[120px] shrink-0 text-slate-600 font-semibold uppercase tracking-wider text-xs">Experiment No:</span>
                              <span className="font-medium border-b border-dashed border-slate-300 flex-1 pb-0.5 text-slate-800 text-[13.5px]">
                                {state.experimentNo || '—'}
                              </span>
                            </div>
                            <div className="flex items-start">
                              <span className="w-[120px] shrink-0 text-slate-600 font-semibold uppercase tracking-wider text-xs">Experiment Name:</span>
                              <span className="font-medium border-b border-dashed border-slate-300 flex-1 pb-0.5 text-slate-800 text-[13.5px] leading-relaxed">
                                {state.experimentName || '—'}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* ASSIGNMENT SPECIFIC FIELDS */}
                        {activeTab === 'assignment' && (
                          <div className="space-y-4 pt-1 w-full">
                            <div className="flex items-start">
                              <span className="w-[120px] shrink-0 text-slate-600 font-semibold uppercase tracking-wider text-xs">Topic Name:</span>
                              <span className="border-b border-dashed border-slate-300 flex-1 pb-0.5 text-slate-800 font-medium text-[14px] leading-relaxed">
                                {state.assignmentTopic || '—'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* SUBMISSION INFO SEGMENT - Rises up beautifully with padding bottom offset */}
                      <div 
                        className="w-full flex-1 flex flex-col justify-end"
                        style={{
                          paddingBottom: `${state.submissionBoxPosition * 1.5}px`,
                          transition: 'all 0.15s ease-out',
                        }}
                      >
                        <div 
                          className={`grid grid-cols-2 gap-5 w-full ${state.submissionBoxStyle !== 'outlined-cards' ? 'border-t border-slate-100 pt-5' : ''}`}
                        >
                          {/* SUBMITTED TO CARD (FIRST/LEFT POSITION) */}
                          <div 
                            className="flex flex-col justify-start font-sans border transition-all duration-200 text-left"
                            style={{
                              borderColor: state.borderColor,
                              borderWidth: state.submissionBoxStyle === 'outlined-cards' ? '1.5px' : '0px',
                              borderBottomWidth: (state.submissionBoxStyle === 'minimal' || state.submissionBoxStyle === 'outlined-cards') ? '1.5px' : '0px',
                              borderRadius: state.submissionBoxStyle === 'outlined-cards' ? '12px' : '0px',
                              backgroundColor: state.submissionBoxStyle === 'outlined-cards' ? 'rgba(255,255,255,0.7)' : 'transparent',
                              padding: state.submissionBoxStyle === 'outlined-cards' ? '16px' : '0px',
                              paddingBottom: state.submissionBoxStyle === 'outlined-cards' ? '16px' : '8px',
                            }}
                          >
                            <h3 
                              className="font-bold text-[12.5px] uppercase tracking-wider mb-2.5"
                              style={{ color: state.borderColor }}
                            >
                              Submitted To:
                            </h3>
                            <p className="text-sm font-extrabold text-slate-900 leading-tight">
                              {state.teacherName || '—'}
                            </p>
                            <p className="text-[12px] font-semibold text-slate-600 mt-1">
                              {state.teacherDesignation}
                            </p>
                            <p className="text-[12.5px] font-bold text-slate-800 mt-2 pt-1 border-t border-slate-100/80 leading-tight">
                              Dept. of {state.teacherDept || '—'}
                            </p>
                            <p className="text-[10.5px] font-bold text-slate-500 mt-1 uppercase tracking-wide">
                              {state.universityName || 'BGMEA UNIVERSITY OF FASHION & TECHNOLOGY'}
                            </p>
                          </div>

                          {/* SUBMITTED BY CARD (SECOND/RIGHT POSITION) */}
                          <div 
                            className="flex flex-col justify-start font-sans border transition-all duration-200 text-left"
                            style={{
                              borderColor: state.borderColor,
                              borderWidth: state.submissionBoxStyle === 'outlined-cards' ? '1.5px' : '0px',
                              borderBottomWidth: (state.submissionBoxStyle === 'minimal' || state.submissionBoxStyle === 'outlined-cards') ? '1.5px' : '0px',
                              borderRadius: state.submissionBoxStyle === 'outlined-cards' ? '12px' : '0px',
                              backgroundColor: state.submissionBoxStyle === 'outlined-cards' ? 'rgba(255,255,255,0.7)' : 'transparent',
                              padding: state.submissionBoxStyle === 'outlined-cards' ? '16px' : '0px',
                              paddingBottom: state.submissionBoxStyle === 'outlined-cards' ? '16px' : '8px',
                            }}
                          >
                            <h3 
                              className="font-bold text-[12.5px] uppercase tracking-wider mb-2.5"
                              style={{ color: state.borderColor }}
                            >
                              Submitted By:
                            </h3>
                            <p className="text-sm font-extrabold text-slate-900 leading-tight mb-2">
                              {state.studentName || '—'}
                            </p>
                            
                            <div className="space-y-1 text-[12px] font-medium">
                              <p className="flex items-center">
                                <span className="text-black w-14 shrink-0 font-bold">ID:</span> 
                                <span className="font-extrabold" style={{ color: state.borderColor }}>{state.studentId || '—'}</span>
                              </p>
                              <p className="flex items-center">
                                <span className="text-black w-14 shrink-0 font-bold">Section:</span> 
                                <span className="font-extrabold" style={{ color: state.borderColor }}>{state.studentSection || '—'}</span>
                              </p>
                              <p className="flex items-center">
                                <span className="text-black w-14 shrink-0 font-bold">Batch:</span> 
                                <span className="font-extrabold" style={{ color: state.borderColor }}>{state.studentBatch || '—'}</span>
                              </p>
                            </div>
                            <p className="text-[12px] font-bold text-slate-800 mt-2.5 pt-1 border-t border-slate-100/80 truncate">
                              Dept: {state.studentDept || '—'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* BOTTOM SUBMISSION DATE */}
                      <div className="w-full text-left pt-3 border-t border-slate-200/60 mt-auto">
                        <div className="flex items-center text-[13px] text-slate-700 font-bold">
                          <span className="uppercase tracking-wider mr-2 text-[11px]">Date of Submission:</span>
                          <span className="text-slate-900 font-bold border-b border-slate-300 pb-0.5 px-1 min-w-[120px] text-center">
                            {state.submissionDate || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // INDEX PAGE LAYOUT CONTAINER
                    <div className="w-full flex-1 flex flex-col items-center relative box-border mt-0">
                      {/* The Centered 'INDEX' Box with double-border */}
                      <div 
                        className="w-[140px] text-center px-3 py-1 mt-0 mb-2"
                        style={{
                          borderStyle: 'double',
                          borderWidth: '2.5px',
                          borderColor: state.borderColor,
                        }}
                      >
                        <span 
                          className="text-sm font-bold tracking-widest uppercase"
                          style={{ color: state.borderColor }}
                        >
                          INDEX
                        </span>
                      </div>

                      {/* Index Metadata - Beautifully formatted side-by-side compact details */}
                      <div 
                        className="w-full text-[11px] text-slate-800 mb-2 border rounded-md text-left px-4 py-2 flex flex-col gap-1.5"
                        style={{ borderColor: state.borderColor }}
                      >
                        {/* Row 1: Course Code (Left) & Course Title (Middle) */}
                        <div className="grid grid-cols-12 w-full items-center">
                          <div className="col-span-5 flex items-center text-left">
                            <span className="font-bold text-slate-600 uppercase tracking-wider mr-1.5 shrink-0">Course Code:</span>
                            <span className="font-extrabold text-slate-900 truncate">{state.courseCode || ''}</span>
                          </div>
                          <div className="col-span-7 flex items-center text-left">
                            <span className="font-bold text-slate-600 uppercase tracking-wider mr-1.5 shrink-0">Course Title:</span>
                            <span className="font-extrabold text-slate-900 truncate" title={state.courseTitle}>{state.courseTitle || ''}</span>
                          </div>
                        </div>
                        
                        {/* Row 2: Name (Left) | Student ID (Middle) | Section (Right-offset) */}
                        <div className="grid grid-cols-12 w-full items-center border-t border-slate-100 pt-1.5">
                          <div className="col-span-5 flex items-center text-left">
                            <span className="font-bold text-slate-600 uppercase tracking-wider mr-1.5 shrink-0">Name:</span>
                            <span className="font-extrabold text-slate-900 truncate" title={state.studentName}>{state.studentName || ''}</span>
                          </div>
                          <div className="col-span-4 flex items-center text-left">
                            <span className="font-bold text-slate-600 uppercase tracking-wider mr-1.5 shrink-0">ID:</span>
                            <span className="font-extrabold text-slate-900 truncate">{state.studentId || ''}</span>
                          </div>
                          <div className="col-span-3 flex items-center text-left">
                            <span className="font-bold text-slate-600 uppercase tracking-wider mr-1.5 shrink-0">Section:</span>
                            <span className="font-extrabold text-slate-900 truncate">{state.studentSection || ''}</span>
                          </div>
                        </div>

                        {/* Row 3: Department (Left) | Batch (Right-offset aligned under Section) */}
                        <div className="grid grid-cols-12 w-full items-center border-t border-slate-100 pt-1.5">
                          <div className="col-span-9 flex items-center text-left">
                            <span className="font-bold text-slate-600 uppercase tracking-wider mr-1.5 shrink-0">Department:</span>
                            <span className="font-extrabold text-slate-900 truncate" title={state.studentDept}>{state.studentDept || ''}</span>
                          </div>
                          <div className="col-span-3 flex items-center text-left">
                            <span className="font-bold text-slate-600 uppercase tracking-wider mr-1.5 shrink-0">Batch:</span>
                            <span className="font-extrabold text-slate-900 truncate">{state.studentBatch || ''}</span>
                          </div>
                        </div>
                      </div>

                      {/* High-Resolution Index Table with Applied Font Styles */}
                      <div className={`w-full overflow-hidden flex-1 flex flex-col ${selectedFont.cssClass}`}>
                        <table 
                          className="w-full border-collapse text-xs text-left border"
                          style={{
                            borderColor: state.borderColor,
                          }}
                        >
                          <thead>
                            <tr 
                              className="text-white font-bold text-[10px] uppercase tracking-wider"
                              style={{ backgroundColor: state.borderColor }}
                            >
                              <th className="p-2.5 text-center w-[10%] border font-bold" style={{ borderColor: state.borderColor }}>Exp. No.</th>
                              <th className="p-2.5 text-center w-[68%] border font-bold" style={{ borderColor: state.borderColor }}>Experiment Name / Title</th>
                              <th className="p-2.5 text-center w-[12%] border font-bold" style={{ borderColor: state.borderColor }}>Date of Subm.</th>
                              <th className="p-2.5 text-center w-[10%] border font-bold" style={{ borderColor: state.borderColor }}>Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {indexRows.map((row, index) => (
                              <tr 
                                key={row.id} 
                                className="hover:bg-slate-50 transition border-b"
                                style={{ borderBottomColor: state.borderColor, height: '54px' }}
                              >
                                <td 
                                  className="p-1.5 text-center font-bold border text-slate-700"
                                  style={{ borderColor: state.borderColor, width: '10%' }}
                                >
                                  {row.no || String(index + 1).padStart(2, '0')}
                                </td>
                                <td 
                                  className="p-1.5 font-semibold text-slate-800 border text-xs leading-tight text-left pl-3"
                                  style={{ borderColor: state.borderColor }}
                                >
                                  {row.name}
                                </td>
                                <td 
                                  className="p-1.5 text-center border text-slate-700 text-xs"
                                  style={{ borderColor: state.borderColor }}
                                >
                                  {row.submissionDate ? formatDate(row.submissionDate) : ''}
                                </td>
                                <td 
                                  className="p-1.5 text-center border text-slate-700 text-xs"
                                  style={{ borderColor: state.borderColor }}
                                >
                                  {row.remarks}
                                </td>
                              </tr>
                            ))}
                            
                            {/* Empty Rows Filler customized for exactly 4 columns & exactly 11 max rows */}
                            {Array.from({ length: Math.max(0, 11 - indexRows.length) }).map((_, i) => {
                              const rowIndex = indexRows.length + i + 1;
                              return (
                                <tr key={`empty-${i}`} style={{ height: '54px' }}>
                                  <td 
                                    className="border text-center text-slate-400 font-mono text-[9px] select-none"
                                    style={{ borderColor: state.borderColor }}
                                  >
                                    {String(rowIndex).padStart(2, '0')}
                                  </td>
                                  <td className="border text-left pl-3 text-xs" style={{ borderColor: state.borderColor }}></td>
                                  <td className="border text-center text-xs" style={{ borderColor: state.borderColor }}></td>
                                  <td className="border text-center text-xs" style={{ borderColor: state.borderColor }}></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
