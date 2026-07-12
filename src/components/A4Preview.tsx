import React from 'react';
import { CoverPageState, IndexRow } from '../types';
import { FONT_PRESETS } from '../data';
// @ts-ignore


export interface A4PreviewProps {
  state: CoverPageState;
  indexRows: IndexRow[];
  activeTab: 'lab' | 'assignment' | 'index';
  id?: string;
}

export const A4Preview: React.FC<A4PreviewProps> = ({ state, indexRows, activeTab, id = 'a4-print-page' }) => {
  // Find the selected font preset
  const selectedFont = FONT_PRESETS.find((f) => f.value === state.fontFamily) || FONT_PRESETS[0];

  // Dynamic Border Style Calculator
  const getBorderStyle = () => {
    const color = state.borderColor;
    const thickness = `${state.borderThickness}px`;
    const gap = `${state.borderGap}px`;
    const padding = `${state.borderPadding}mm`;

    return {
      padding,
      borderColor: color,
      thickness,
      gap,
    };
  };

  const bs = getBorderStyle();

  // Spacing helper based on verticalSpacing (1-10) and submissionBoxPosition (0-100)
  // Higher vertical spacing means elements themselves have more padding/margins.
  const spacingMultiplier = state.verticalSpacing * 0.25; // scaling factor
  
  // Permanent university logo with local asset fallback to avoid CORS issues
  const logoSrc = state.customLogo || (state.logoUrl === 'https://buft.edu.bd/logo-326x329.png' ? BUFT_LOGO_BASE64 : state.logoUrl);

  return (
    <div className="flex-1 flex justify-center items-start overflow-auto p-4 md:p-8 no-print select-none">
      {/* Real A4 Paper representation on screen */}
      <div
        id={id}
        className={`bg-white w-[210mm] h-[297mm] min-w-[210mm] min-h-[297mm] shadow-[0_10px_30px_rgba(0,0,0,0.15)] relative overflow-hidden box-border flex flex-col ${selectedFont.cssClass}`}
        style={{
          printColorAdjust: 'exact',
          WebkitPrintColorAdjust: 'exact',
        }}
      >
        {/* Outer Boundary Frame - Styled precisely as a double-bordered page from the 2nd picture */}
        <div
          className="w-full h-full flex flex-col box-border relative"
          style={{
            padding: bs.padding,
          }}
        >
          {/* Double line mimic: Outer Line Container */}
          <div
            className="w-full h-full flex flex-col box-border relative"
            style={{
              border: `${bs.thickness} solid ${bs.borderColor}`,
              padding: bs.gap,
            }}
          >
            {/* Inner Line Container completing the premium academic border effect */}
            <div
              className="w-full h-full flex flex-col items-center box-border relative"
              style={{
                border: `${bs.thickness} solid ${bs.borderColor}`,
                padding: '2.5rem 1.8rem',
              }}
            >
              {/* UNIVERSITY HEADER BANNER */}
              <div className="w-full text-center flex flex-col items-center z-10">
                <h1 
                  className="font-bold tracking-wide text-center uppercase"
                  style={{
                    color: state.borderColor === '#1e293b' ? '#0f172a' : state.borderColor,
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
                      border: `1.5px solid ${state.borderColor}`,
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
                /* INDEX PAGE LAYOUT CONTAINER */
                <div className="w-full flex-1 flex flex-col items-center relative box-border mt-2">
                  <div 
                    className="w-[180px] text-center px-4 py-1.5 mt-2 mb-6"
                    style={{
                      border: `1.5px solid ${state.borderColor}`,
                      borderWidth: '2.5px',
                      borderStyle: 'double',
                    }}
                  >
                    <span 
                      className="text-base font-bold tracking-widest uppercase"
                      style={{ color: state.borderColor }}
                    >
                      INDEX
                    </span>
                  </div>

                  {/* Index Metadata - Now Editable */}
                  <div 
                    className="w-full grid grid-cols-2 gap-4 text-xs font-bold text-slate-700 mb-4 border p-3 rounded-lg"
                    style={{ borderColor: state.borderColor }}
                  >
                    <div>
                      <p className="text-slate-400 uppercase tracking-widest text-[9px] mb-0.5">Course Code</p>
                      <p className="text-slate-900 font-bold">{state.courseCode || '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 uppercase tracking-widest text-[9px] mb-0.5">Course Title</p>
                      <p className="text-slate-900 font-bold leading-tight truncate">{state.courseTitle || '—'}</p>
                    </div>
                  </div>

                  {/* HIGH RESOLUTION INDEX TABLE WITH APPLIED DOCUMENT TYPOGRAPHY */}
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
                          <th className="p-2.5 text-center w-[12%] border font-bold" style={{ borderColor: state.borderColor }}>Sl. No.</th>
                          <th className="p-2.5 text-left w-[63%] border font-bold" style={{ borderColor: state.borderColor }}>Experiment Name / Title</th>
                          <th className="p-2.5 text-center w-[15%] border font-bold" style={{ borderColor: state.borderColor }}>Date of Subm.</th>
                          <th className="p-2.5 text-center w-[10%] border font-bold" style={{ borderColor: state.borderColor }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-900">
                        {indexRows.map((row, index) => (
                          <tr 
                            key={row.id} 
                            className="hover:bg-slate-50 transition border-b"
                            style={{ borderBottomColor: state.borderColor }}
                          >
                            <td 
                              className="p-2 text-center font-bold border text-slate-700"
                              style={{ borderColor: state.borderColor }}
                            >
                              {row.no || String(index + 1).padStart(2, '0')}
                            </td>
                            <td 
                              className="p-2 font-semibold text-slate-800 border text-[11.5px] leading-relaxed"
                              style={{ borderColor: state.borderColor }}
                            >
                              {row.name}
                            </td>
                            <td 
                              className="p-2 text-center text-[11.5px] font-semibold text-slate-700 border whitespace-nowrap"
                              style={{ borderColor: state.borderColor }}
                            >
                              {row.submissionDate || '—'}
                            </td>
                            <td 
                              className="p-2 text-center text-slate-600 font-semibold border text-[11px]"
                              style={{ borderColor: state.borderColor }}
                            >
                              
                            </td>
                          </tr>
                        ))}
                        
                        {/* Empty Rows Filler customized for exactly 4 columns */}
                        {Array.from({ length: Math.max(1, 14 - indexRows.length) }).map((_, i) => {
                          const rowIndex = indexRows.length + i + 1;
                          return (
                            <tr key={`empty-${i}`} className="h-9">
                              <td 
                                className="border text-center text-slate-400 font-mono text-[9px] select-none"
                                style={{ borderColor: state.borderColor }}
                              >
                                {String(rowIndex).padStart(2, '0')}
                              </td>
                              <td className="border" style={{ borderColor: state.borderColor }}></td>
                              <td className="border" style={{ borderColor: state.borderColor }}></td>
                              <td className="border" style={{ borderColor: state.borderColor }}></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* BOTTOM FOOTER SIGNS - Relocated Teacher's Signature to the right */}
                  <div className="w-full grid grid-cols-2 gap-20 text-center mt-auto pt-6 text-[11px] font-bold text-slate-600 uppercase">
                    <div>
                      {/* Left space is intentionally empty as requested */}
                    </div>
                    <div>
                      <p className="border-t pt-1 border-dashed" style={{ borderColor: state.borderColor }}>Teacher's Signature</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
