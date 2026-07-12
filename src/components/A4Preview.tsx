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
  const selectedFont = FONT_PRESETS.find((f) => f.value === state.fontFamily) || FONT_PRESETS[0];

  // Helper to force hex color for PDF compatibility and prevent oklch parsing errors
  const forceHex = (color: string) => {
    return color && color.startsWith('#') ? color : '#000000';
  };

  const getBorderStyle = () => {
    return {
      padding: `${state.borderPadding}mm`,
      borderColor: forceHex(state.borderColor),
      thickness: `${state.borderThickness}px`,
      gap: `${state.borderGap}px`,
    };
  };

  const bs = getBorderStyle();
  const spacingMultiplier = state.verticalSpacing * 0.25;
  const logoSrc = state.customLogo || '/buft-logo.png';

  return (
    <div className="flex-1 flex justify-center items-start overflow-auto p-4 md:p-8 select-none">
      <div
        id={id}
        className={`bg-white w-[210mm] h-[297mm] min-w-[210mm] min-h-[297mm] shadow-[0_10px_30px_rgba(0,0,0,0.15)] relative overflow-hidden box-border flex flex-col ${selectedFont.cssClass}`}
        style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
      >
        <div className="w-full h-full flex flex-col box-border relative" style={{ padding: bs.padding }}>
          <div className="w-full h-full flex flex-col box-border relative" style={{ border: `${bs.thickness} solid ${bs.borderColor}`, padding: bs.gap }}>
            <div className="w-full h-full flex flex-col items-center box-border relative" style={{ border: `${bs.thickness} solid ${bs.borderColor}`, padding: '2.5rem 1.8rem' }}>
              
              {/* UNIVERSITY HEADER BANNER */}
              <div className="w-full text-center flex flex-col items-center z-10">
                <h1 className="font-bold tracking-wide text-center uppercase" style={{ color: forceHex(state.borderColor === '#1e293b' ? '#0f172a' : state.borderColor), fontSize: '22px', lineHeight: '1.2' }}>
                  {state.universityName}
                </h1>
                
                {logoSrc && (
                  <div className="flex justify-center items-center my-4 transition-all" style={{ height: `${45 + state.verticalSpacing * 6}px`, marginTop: `${8 * spacingMultiplier}px`, marginBottom: `${10 * spacingMultiplier}px` }}>
                    <img src={logoSrc} alt="University Crest" crossOrigin="anonymous" className="h-full w-auto object-contain mix-blend-multiply" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                  </div>
                )}
              </div>

              {/* COVER PAGE CONTENT */}
              {activeTab !== 'index' ? (
                <div className="w-full flex-1 flex flex-col items-center relative box-border">
                  <div className="w-[85%] text-center px-4 py-2 mt-2" style={{ border: `1.5px solid ${forceHex(state.borderColor)}`, borderWidth: state.titleBoxStyle === 'double' ? '3px' : '1.5px', borderStyle: state.titleBoxStyle === 'double' ? 'double' : 'solid', backgroundColor: state.titleBoxStyle === 'solid' ? forceHex(state.borderColor) : 'transparent' }}>
                    <span className="text-lg font-bold tracking-widest uppercase" style={{ color: state.titleBoxStyle === 'solid' ? '#ffffff' : forceHex(state.borderColor) }}>
                      {activeTab === 'lab' ? 'LAB REPORT' : 'ASSIGNMENT'}
                    </span>
                  </div>
                  {/* Body and Footer elements... */}
                </div>
              ) : (
                <div className="w-full flex-1 flex flex-col items-center relative box-border mt-2">
                   {/* Table content... */}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
