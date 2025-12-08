import React, { useState } from 'react';
import { ShieldCheck, LayoutDashboard, FileText, History, Menu, Trash2, X } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import AnalysisResult from './components/AnalysisResult';
import FileUploader from './components/FileUploader';
import { ChatMessage, UploadedFile, AnalysisStatus } from './types';
import { analyzeAuditDocument, chatWithAuditAssistant } from './services/geminiService';

function App() {
  const [activeFile, setActiveFile] = useState<UploadedFile | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initial welcome message
  React.useEffect(() => {
    setChatMessages([
      {
        role: 'model',
        content: "Halo, saya adalah **AI Audit Piutang**. Silakan unggah dokumen piutang (**PDF, Gambar, atau CSV**) untuk saya analisis, atau tanyakan prosedur audit kepada saya.",
        timestamp: Date.now()
      }
    ]);
  }, []);

  const handleFileUpload = async (file: UploadedFile) => {
    setActiveFile(file);
    setAnalysisStatus(AnalysisStatus.ANALYZING);
    setAnalysisResult(null); // Reset previous result
    
    // Add system message about processing
    const userMsg: ChatMessage = {
      role: 'user',
      content: `Mengunggah dokumen: ${file.name}`,
      timestamp: Date.now()
    };
    setChatMessages(prev => [...prev, userMsg]);

    try {
      const result = await analyzeAuditDocument(file);
      setAnalysisResult(result);
      setAnalysisStatus(AnalysisStatus.COMPLETED);
      
      const aiMsg: ChatMessage = {
        role: 'model',
        content: `Analisis untuk **${file.name}** telah selesai. Anda dapat melihat detailnya di panel analisis. Apakah ada bagian spesifik yang ingin kita diskusikan?`,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, aiMsg]);
      
    } catch (error) {
      console.error(error);
      setAnalysisStatus(AnalysisStatus.ERROR);
      setAnalysisResult("Gagal menganalisis dokumen. Pastikan format file didukung (PDF/Gambar/CSV) dan jelas.");
      
      const errorMsg: ChatMessage = {
        role: 'model',
        content: "Maaf, terjadi kesalahan saat menganalisis dokumen tersebut. Mohon coba lagi.",
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, errorMsg]);
    }
  };

  const handleSendMessage = async (text: string) => {
    const newUserMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: Date.now()
    };
    setChatMessages(prev => [...prev, newUserMsg]);
    setIsChatLoading(true);

    try {
      // Convert internal ChatMessage to API history format
      const history = chatMessages.map(m => ({ role: m.role, content: m.content }));
      
      const responseText = await chatWithAuditAssistant(text, history, activeFile);
      
      const newAiMsg: ChatMessage = {
        role: 'model',
        content: responseText,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, newAiMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        role: 'model',
        content: "Maaf, saya sedang mengalami gangguan koneksi. Silakan coba lagi.",
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleClearSession = () => {
    if (window.confirm("Hapus semua data sesi ini?")) {
        setActiveFile(null);
        setAnalysisResult(null);
        setAnalysisStatus(AnalysisStatus.IDLE);
        setChatMessages([{
            role: 'model',
            content: "Sesi telah direset. Silakan unggah dokumen baru.",
            timestamp: Date.now()
        }]);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 text-white shadow-xl">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-indigo-500 p-2 rounded-lg">
             <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">AI Audit</h1>
            <p className="text-xs text-slate-400">Piutang & Risiko</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button className="flex items-center gap-3 w-full p-3 bg-indigo-600/20 text-indigo-300 rounded-lg border border-indigo-500/30">
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Workspace Audit</span>
          </button>
          
          <div className="pt-6 pb-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Dokumen Aktif
          </div>
          {activeFile ? (
            <div className="mx-2 p-3 bg-slate-800 rounded-lg border border-slate-700 flex items-start gap-2">
              <FileText className="w-5 h-5 text-indigo-400 mt-1 shrink-0" />
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-slate-200 truncate">{activeFile.name}</p>
                <p className="text-xs text-slate-500">{activeFile.type.split('/')[1]?.toUpperCase() || 'FILE'}</p>
              </div>
            </div>
          ) : (
             <div className="mx-2 p-3 border border-dashed border-slate-700 rounded-lg text-center text-xs text-slate-500">
               Belum ada dokumen
             </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
             onClick={handleClearSession}
             className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors text-sm w-full p-2 hover:bg-slate-800 rounded-lg"
          >
            <Trash2 className="w-4 h-4" /> Reset Sesi
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-slate-900 text-white z-50 flex items-center justify-between px-4">
         <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span className="font-bold">AI Audit Piutang</span>
         </div>
         <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="w-6 h-6" />
         </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row h-full pt-16 md:pt-0 relative">
        
        {/* Left Panel: Analysis/Upload */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto h-full scrollbar-hide">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Header Area */}
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-bold text-slate-800">Kertas Kerja Analisis</h2>
               {activeFile && (
                 <button 
                   onClick={() => setActiveFile(null)} 
                   className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                 >
                   <UploadUploadedIcon className="w-3 h-3"/> Ganti Dokumen
                 </button>
               )}
            </div>

            {/* Upload or Analysis View */}
            {!activeFile ? (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                 <h3 className="text-lg font-semibold mb-4 text-slate-800">Mulai Audit Baru</h3>
                 <FileUploader onFileSelect={handleFileUpload} />
                 
                 <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FeatureCard 
                      icon={<FileText className="w-6 h-6 text-blue-500" />}
                      title="Analisis Dokumen"
                      desc="Upload Buku Besar, Aging Schedule, Invoice, atau CSV data."
                    />
                    <FeatureCard 
                      icon={<ShieldCheck className="w-6 h-6 text-green-500" />}
                      title="Deteksi Risiko"
                      desc="Identifikasi fraud, anomali saldo, dan risiko tak tertagih."
                    />
                    <FeatureCard 
                      icon={<History className="w-6 h-6 text-purple-500" />}
                      title="Saran Prosedur"
                      desc="Dapatkan rekomendasi prosedur audit sesuai standar ISA/PSAK."
                    />
                 </div>
              </div>
            ) : (
              <div className="h-[calc(100vh-140px)]">
                 {analysisStatus === AnalysisStatus.ANALYZING ? (
                    <div className="h-full flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 shadow-sm animate-pulse">
                        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <h3 className="text-lg font-semibold text-slate-700">Menganalisis Dokumen...</h3>
                        <p className="text-slate-500">AI sedang membaca data dan mengidentifikasi risiko.</p>
                    </div>
                 ) : (
                    <AnalysisResult content={analysisResult || ''} />
                 )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Chat */}
        <div className="w-full md:w-[400px] lg:w-[450px] border-l border-slate-200 h-full bg-white z-10 shadow-lg md:shadow-none flex flex-col">
          <ChatInterface 
            messages={chatMessages} 
            onSendMessage={handleSendMessage}
            isLoading={isChatLoading}
          />
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/95 z-50 flex flex-col p-6 text-white md:hidden">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold">Menu</h2>
                <button onClick={() => setMobileMenuOpen(false)}>
                    <X className="w-6 h-6" />
                </button>
            </div>
            <button 
                onClick={handleClearSession}
                className="w-full py-4 bg-red-600 rounded-lg font-semibold"
            >
                Reset Sesi Audit
            </button>
            <div className="mt-auto text-center text-slate-500 text-sm">
                AI Audit Piutang v1.0
            </div>
        </div>
      )}
    </div>
  );
}

// Helper components for pure UI
const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
    <div className="mb-3">{icon}</div>
    <h4 className="font-semibold text-slate-900 mb-1">{title}</h4>
    <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
  </div>
);

const UploadUploadedIcon = (props: any) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" viewBox="0 0 24 24" 
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
      {...props}
    >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
)

export default App;