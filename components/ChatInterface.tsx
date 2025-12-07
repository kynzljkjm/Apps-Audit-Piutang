import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, FileText, Loader2, StopCircle, Volume2, Square } from 'lucide-react';
import { ChatMessage } from '../types';
import { startListening, speakText, stopSpeaking } from '../services/speechService';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speakingMsgIndex, setSpeakingMsgIndex] = useState<number | null>(null);
  const [lastInputMode, setLastInputMode] = useState<'text' | 'voice'>('text');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(messages.length);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Auto-speak response if the last input was voice
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      const lastMsgIndex = messages.length - 1;
      const lastMsg = messages[lastMsgIndex];
      
      // Jika pesan baru adalah dari model DAN input terakhir user adalah suara
      if (lastMsg.role === 'model' && lastInputMode === 'voice') {
        handleSpeak(lastMsg.content, lastMsgIndex);
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages, lastInputMode]);

  // Stop speaking when component unmounts
  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
    // Note: lastInputMode is already set by handleInputChange or handleMicClick
  };

  const handleMicClick = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      startListening(
        (text) => {
          setInput(text);
          setIsRecording(false);
          setLastInputMode('voice'); // Set mode ke voice
        },
        () => setIsRecording(false),
        (err) => {
          console.error(err);
          setIsRecording(false);
        }
      );
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setLastInputMode('text'); // Reset ke text jika user mengetik manual
  };

  const handleSpeak = (text: string, index: number) => {
    if (speakingMsgIndex === index) {
      stopSpeaking();
      setSpeakingMsgIndex(null);
    } else {
      stopSpeaking(); // Stop current
      setSpeakingMsgIndex(index);
      speakText(text, () => setSpeakingMsgIndex(null));
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <FileText className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-semibold text-slate-800">Konsultasi Auditor</h3>
        {speakingMsgIndex !== null && (
          <span className="ml-auto text-xs text-indigo-600 animate-pulse font-medium flex items-center gap-1">
            <Volume2 className="w-3 h-3" /> Berbicara...
          </span>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 mt-10">
            <p className="text-sm">Belum ada percakapan.</p>
            <p className="text-xs mt-1">Silakan bertanya mengenai prosedur audit atau upload dokumen.</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm relative group ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
              }`}
            >
              {msg.role === 'model' ? (
                 <ReactMarkdown 
                    components={{
                        ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                        strong: ({node, ...props}) => <span className="font-bold text-slate-900" {...props} />,
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />
                    }}
                 >
                    {msg.content}
                 </ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
            
            {/* Action Bar for Model Messages */}
            {msg.role === 'model' && (
              <div className="flex items-center gap-2 mt-1 ml-1">
                <button 
                  onClick={() => handleSpeak(msg.content, idx)}
                  className={`p-1.5 rounded-full transition-colors flex items-center gap-1 text-xs ${
                    speakingMsgIndex === idx 
                      ? 'bg-indigo-100 text-indigo-700 font-medium' 
                      : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                  }`}
                  title={speakingMsgIndex === idx ? "Hentikan suara" : "Dengarkan penjelasan"}
                >
                  {speakingMsgIndex === idx ? (
                    <>
                      <Square className="w-3 h-3 fill-current" />
                      <span>Berhenti</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">Dengar</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span className="text-xs text-slate-500">AI sedang menyusun penjelasan...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-slate-100 flex gap-2 items-center">
        <button
          type="button"
          onClick={handleMicClick}
          className={`p-3 rounded-full transition-all flex-shrink-0 ${
            isRecording 
              ? 'bg-red-100 text-red-600 animate-pulse ring-2 ring-red-200' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
          }`}
          title="Bicara sekarang"
        >
          {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder={isRecording ? "Mendengarkan suara Anda..." : "Tanyakan sesuatu..."}
          className={`flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${isRecording ? 'placeholder-red-400' : ''}`}
        />
        
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;