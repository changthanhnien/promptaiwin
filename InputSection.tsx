import React, { useRef, useState } from 'react';
import { Upload, FileVideo, RefreshCw, Zap, MessageSquare, Link as LinkIcon, Youtube, Sparkles } from 'lucide-react';
import { InputMode, FeatureId, ToneId } from './types';
import { FEATURES, TONES } from './constants';
import { FeatureCard } from './FeatureCard';

interface InputSectionProps {
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;
  url: string;
  setUrl: (url: string) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  selectedFeature: FeatureId;
  setSelectedFeature: (id: FeatureId) => void;
  selectedTone: ToneId;
  setSelectedTone: (id: ToneId) => void;
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({
  inputMode, setInputMode,
  url, setUrl,
  file, setFile,
  selectedFeature, setSelectedFeature,
  selectedTone, setSelectedTone,
  customPrompt, setCustomPrompt,
  onAnalyze, isLoading
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB in bytes

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.size > MAX_FILE_SIZE) {
        alert("File quá lớn. Vui lòng chọn file nhỏ hơn 1GB.");
        return;
      }
      setFile(droppedFile);
      setInputMode(InputMode.FILE);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > MAX_FILE_SIZE) {
        alert("File quá lớn. Vui lòng chọn file nhỏ hơn 1GB.");
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      setFile(selectedFile);
      setInputMode(InputMode.FILE);
    }
  };

  const triggerFileUpload = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; 
      fileInputRef.current.click();
    }
  };

  const SectionTitle = ({ icon: Icon, title, action }: { icon: any, title: string, action?: React.ReactNode }) => (
    <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-200">
            <Icon size={16} className="text-primary" />
            <h2 className="text-sm font-bold tracking-wide uppercase">{title}</h2>
        </div>
        {action}
    </div>
  );

  return (
    <div className="flex flex-col gap-8 h-full pb-28">
      
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* SECTION 1: SOURCE SELECTION */}
      <div className="glass-panel rounded-2xl p-6">
        <SectionTitle icon={Upload} title="Nguồn Video" />
        
        <div className="flex bg-slate-900/50 p-1 rounded-lg mb-4 border border-white/5">
            <button
                onClick={() => setInputMode(InputMode.FILE)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all duration-300 ${
                    inputMode === InputMode.FILE 
                    ? 'bg-surfaceHighlight text-white shadow-lg' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
            >
                <FileVideo size={16} />
                <span>Tải File</span>
            </button>
            <button
                onClick={() => setInputMode(InputMode.LINK)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all duration-300 ${
                    inputMode === InputMode.LINK 
                    ? 'bg-surfaceHighlight text-white shadow-lg' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
            >
                <LinkIcon size={16} />
                <span>Nhập Link</span>
            </button>
        </div>

        {inputMode === InputMode.FILE ? (
            <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileUpload}
            className={`
                relative overflow-hidden group
                rounded-xl h-[120px] w-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300
                ${dragActive 
                ? 'border-2 border-primary bg-primary/10' 
                : 'border border-dashed border-slate-700 bg-slate-900/30 hover:border-slate-500 hover:bg-slate-800'
                }
            `}
            >
            {file ? (
                <div className="flex items-center gap-4 w-full px-6 animate-fade-in">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shrink-0">
                    <FileVideo size={24} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{file.name}</p>
                    <p className="text-slate-400 text-xs font-mono mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button 
                    type="button"
                    onClick={triggerFileUpload}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                    <RefreshCw size={16} />
                </button>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2 text-center">
                <div className="p-3 bg-slate-800 rounded-full group-hover:scale-110 transition-transform duration-300">
                    <Upload size={20} className="text-slate-400 group-hover:text-primary" />
                </div>
                <div>
                    <h3 className="text-sm font-medium text-slate-200">Click để upload hoặc kéo thả</h3>
                    <p className="text-[11px] text-slate-500 mt-1">MP4, MOV (Max 1GB)</p>
                </div>
                </div>
            )}
            </div>
        ) : (
            <div className="space-y-3 animate-fade-in">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Youtube size={18} className="text-red-500" />
                    </div>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Dán link YouTube hoặc TikTok..."
                        className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl leading-5 bg-slate-900/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:bg-slate-900 focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm transition-all"
                    />
                </div>
                <p className="text-[11px] text-slate-500 pl-1">
                    *Lưu ý: Với link, AI sẽ tìm kiếm thông tin từ web hoặc giả lập nội dung nếu không có dữ liệu.
                </p>
            </div>
        )}
      </div>

      {/* SECTION 2: FEATURES */}
      <div>
        <SectionTitle icon={Zap} title="Chọn Tính Năng" />
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map((feat) => (
            <FeatureCard
              key={feat.id}
              feature={feat}
              isSelected={selectedFeature === feat.id}
              onClick={setSelectedFeature}
            />
          ))}
        </div>
      </div>

      {/* SECTION 3: CONFIG */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Tone */}
        <div>
            <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Phong cách (Tone)</h3>
            <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
                <button
                key={t.id}
                onClick={() => setSelectedTone(t.id)}
                className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200
                    ${selectedTone === t.id
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-surface border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    }
                `}
                >
                {t.label}
                </button>
            ))}
            </div>
        </div>

        {/* Prompt */}
        <div className="flex-1">
            <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                 <MessageSquare size={12} /> Yêu cầu thêm (Optional)
            </h3>
            <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Nhập ghi chú cụ thể cho AI..."
                className="w-full h-24 bg-surface border border-slate-800 rounded-xl p-3 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-slate-200 placeholder-slate-600 resize-none transition-all"
            />
        </div>
      </div>

      {/* FIXED FOOTER ACTION */}
      <div className="fixed bottom-0 left-0 lg:left-auto lg:w-[calc(41.666667%-3rem)] w-full p-6 bg-gradient-to-t from-background via-background to-transparent z-20">
        <button
          onClick={onAnalyze}
          disabled={isLoading || (inputMode === InputMode.FILE && !file) || (inputMode === InputMode.LINK && !url)}
          className={`
            w-full py-3.5 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2
            transition-all duration-300 btn-primary
            ${isLoading || (inputMode === InputMode.FILE && !file) || (inputMode === InputMode.LINK && !url) ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:-translate-y-1'}
          `}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Đang xử lý...</span>
            </>
          ) : (
            <>
              <Zap size={18} fill="currentColor" />
              <span>BẮT ĐẦU PHÂN TÍCH</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
