import React from "react";
import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-12 py-8 text-center text-slate-500 text-xs font-medium border-t border-slate-200/80 w-full no-print bg-slate-50/50">
      <div className="max-w-5xl mx-auto px-4 space-y-1.5">
        <p className="font-semibold text-slate-700">© 2026 BUFT Academic HUB.</p>
        <p className="text-slate-600 font-semibold flex items-center justify-center gap-1 flex-wrap">
          <span>Made with</span>
          <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500 inline mx-0.5" />
          <span>for BUFTians |</span>
          <a
            href="https://www.facebook.com/aht.ahtamim"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 hover:text-emerald-800 font-bold underline underline-offset-2 hover:bg-emerald-50 px-1 py-0.5 rounded transition-colors"
          >
            Ahsan Habib Tamim (TE 242)
          </a>
        </p>
      </div>
    </footer>
  );
}
