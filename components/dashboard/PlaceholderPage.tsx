import React from "react";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: React.ElementType;
}

export function PlaceholderPage({ title, description, icon: Icon }: PlaceholderPageProps) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-slate-50/50 border border-slate-200 border-dashed">
        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-base font-bold text-slate-900 mb-2">Interface en construction</h2>
        <p className="text-sm text-slate-600 max-w-md">
          L'interface <span className="text-slate-900 font-semibold">{title}</span> est actuellement un placeholder. Elle sera développée ultérieurement.
        </p>
      </div>
    </div>
  );
}
