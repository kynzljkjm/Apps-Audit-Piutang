import React from 'react';
import ReactMarkdown from 'react-markdown';
import { AlertTriangle, CheckCircle, FileText, Activity } from 'lucide-react';

interface AnalysisResultProps {
  content: string;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ content }) => {
  if (!content) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
        <div className="bg-green-100 p-2 rounded-lg text-green-700">
          <Activity className="w-6 h-6" />
        </div>
        <div>
            <h2 className="text-xl font-bold text-slate-900">Hasil Analisis Audit</h2>
            <p className="text-sm text-slate-500">Berdasarkan dokumen yang diunggah</p>
        </div>
      </div>
      
      <div className="prose prose-sm prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-800 prose-p:text-slate-600 prose-li:text-slate-600">
        <ReactMarkdown
          components={{
             h1: ({node, ...props}) => <h3 className="text-lg font-bold mt-6 mb-3 flex items-center gap-2 text-indigo-700 uppercase tracking-wide border-l-4 border-indigo-500 pl-3" {...props} />,
             h2: ({node, ...props}) => <h3 className="text-lg font-bold mt-6 mb-3 flex items-center gap-2 text-indigo-700 uppercase tracking-wide border-l-4 border-indigo-500 pl-3" {...props} />,
             h3: ({node, ...props}) => <h4 className="text-md font-semibold mt-4 mb-2 text-slate-800" {...props} />,
             ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-2 mb-4 bg-slate-50 p-4 rounded-lg border border-slate-100" {...props} />,
             ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-2 mb-4" {...props} />,
             li: ({node, ...props}) => <li className="pl-1" {...props} />,
             strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
             blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-amber-400 bg-amber-50 p-4 italic text-amber-900 my-4 rounded-r-lg" {...props} />
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 flex gap-4 text-xs text-slate-400">
         <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Standar Audit Diikuti
         </div>
         <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Analisis Awal (Non-Opini)
         </div>
      </div>
    </div>
  );
};

export default AnalysisResult;
