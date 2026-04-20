import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Copy, Bot, Play, Pause, Volume2, VolumeX, Maximize2, Globe, Sparkles, Download, Clapperboard, Check, FileText, FileJson, Clock, RotateCcw, Layers, ScrollText, Zap } from 'lucide-react';
import { AnalysisResult, InputMode, FeatureId, ToneId } from './types';

interface ResultSectionProps {
  inputMode: InputMode;
  file: File | null;
  url: string;
  result: AnalysisResult | null;
  isLoading: boolean;
  selectedFeature: FeatureId;
  selectedTone: ToneId;
  onQuickAction: (featureId: FeatureId) => void;
  onReset: () => void;
}

const formatTime = (time: number) => {
  if (!time || isNaN(time)) return "00:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const CopyButton = ({ text, className = "" }: { text: string, className?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className={`p-1.5 rounded hover:bg-white/10 transition-colors text-slate-400 hover:text-white ${className}`}
      title="Copy prompt này"
    >
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
    </button>
  );
};

const LocalVideoPlayer = ({ file }: { file: File }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const videoSrc = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => URL.revokeObjectURL(videoSrc);
  }, [videoSrc]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration || 0;
      setCurrentTime(current);
      setDuration(total);
      if (total > 0) setProgress((current / total) * 100);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const newProgress = parseFloat(e.target.value);
      const newTime = (newProgress / 100) * videoRef.current.duration;
      videoRef.current.currentTime = newTime;
      setProgress(newProgress);
      setCurrentTime(newTime);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div 
      className="relative w-full h-full bg-black rounded-xl overflow-hidden group shadow-2xl"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video 
        ref={videoRef}
        src={videoSrc}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />
      
      {!isPlaying && (
        <div onClick={togglePlay} className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer">
          <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-full flex items-center justify-center hover:scale-110 transition-transform">
             <Play size={28} className="text-white fill-white ml-1" />
          </div>
        </div>
      )}

      <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
         <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-mono text-white">{formatTime(currentTime)}</span>
            <input 
                type="range" 
                min="0" max="100" step="0.1"
                value={progress} 
                onChange={handleSeek}
                className="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-primary"
            />
            <span className="text-[10px] font-mono text-white/70">{formatTime(duration)}</span>
         </div>
         <div className="flex justify-between items-center">
            <button onClick={togglePlay} className="text-white hover:text-primary">
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>
            <div className="flex gap-3">
                 <button onClick={toggleMute} className="text-white hover:text-primary">
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                 </button>
                 <button onClick={() => videoRef.current?.requestFullscreen()} className="text-white hover:text-primary">
                    <Maximize2 size={18} />
                 </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export const ResultSection: React.FC<ResultSectionProps> = ({ 
  inputMode, file, url, result, isLoading, selectedFeature, selectedTone, onQuickAction, onReset
}) => {
  const [copied, setCopied] = React.useState(false);
  const [copiedFullPrompt, setCopiedFullPrompt] = React.useState(false);
  const [copiedVietnamese, setCopiedVietnamese] = React.useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showBottomDownloadMenu, setShowBottomDownloadMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const bottomMenuRef = useRef<HTMLDivElement>(null);

  const isPromptFeature = selectedFeature === FeatureId.CREATE_AI_PROMPT;
  const labels = {
    visual: isPromptFeature ? "VISUAL PROMPT (NO TEXT)" : "MÔ TẢ HÌNH ẢNH",
    audio: isPromptFeature ? "VOICE & SOUND EFFECTS" : "ÂM THANH / LỜI THOẠI",
    analysis: isPromptFeature ? "AI VIDEO ENGINE PROMPT" : "PHÂN TÍCH / GHI CHÚ"
  };

  const [isMinimalView, setIsMinimalView] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setShowDownloadMenu(false);
        }
        if (bottomMenuRef.current && !bottomMenuRef.current.contains(event.target as Node)) {
            setShowBottomDownloadMenu(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const copyToClipboard = () => {
    if (!result) return;
    const text = result.segments.map(s => 
      `[${s.time}]\n${labels.visual}: ${s.visual}\n${labels.audio}: ${s.audio}\n${labels.analysis}: ${s.analysis}\n`
    ).join('\n-------------------\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyFullSequencePrompt = () => {
    if (!result) return;
    const text = result.segments.map((s, idx) => 
        `Shot ${idx + 1} (${s.time}): ${s.analysis}`
    ).join('\nNEXT SHOT:\n');
    navigator.clipboard.writeText(text);
    setCopiedFullPrompt(true);
    setTimeout(() => setCopiedFullPrompt(false), 2000);
  };

  const copyVietnameseScenes = () => {
    if (!result) return;
    const text = result.segments.map((s, idx) => 
        `Cảnh ${idx + 1} (${s.time}): ${s.visual}`
    ).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedVietnamese(true);
    setTimeout(() => setCopiedVietnamese(false), 2000);
  };

  const downloadFile = (format: 'txt' | 'json' | 'doc') => {
    if (!result) return;
    
    const fullSequence = result.segments.map((s, idx) => 
        `Shot ${idx + 1} (${s.time}): ${s.analysis}`
    ).join('\nNEXT SHOT:\n');

    let content = "";
    let mimeType = "text/plain";
    let extension = "txt";

    if (format === 'json') {
        content = JSON.stringify(result, null, 2);
        mimeType = "application/json";
        extension = "json";
    } else if (format === 'doc') {
        mimeType = "application/msword";
        extension = "doc"; 
        
        content = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset="utf-8">
                <title>${result.title}</title>
                <style>
                    body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #000; }
                    h1 { font-size: 18pt; font-weight: bold; color: #1a1a1a; margin-bottom: 20px; }
                    .summary { background-color: #f5f5f5; padding: 15px; border-left: 5px solid #6366f1; margin-bottom: 30px; }
                    .sequence { background-color: #eef2ff; padding: 15px; border-left: 5px solid #4f46e5; margin-bottom: 30px; }
                    .segment { margin-bottom: 25px; page-break-inside: avoid; border-bottom: 1px solid #eee; padding-bottom: 15px; }
                    .time { font-weight: bold; color: #2563eb; font-size: 11pt; margin-bottom: 5px; }
                    .label { font-weight: bold; color: #444; text-transform: uppercase; font-size: 10pt; }
                    .prompt-box { background: #f8fafc; padding: 10px; border: 1px dashed #64748b; margin-top: 10px; font-family: 'Courier New', monospace; font-size: 11pt; color: #334155; }
                    p { margin-top: 5px; margin-bottom: 10px; }
                </style>
            </head>
            <body>
                <h1>${result.title}</h1>
                <div class="summary">
                    <p><strong>SUMMARY:</strong></p>
                    <p>${result.summary}</p>
                </div>
                <div class="sequence">
                    <p><strong>TỔNG HỢP CHUỖI PROMPT LIỀN MẠCH (FULL SEQUENCE):</strong></p>
                    <p style="font-family: 'Courier New', monospace; font-size: 11pt; color: #312e81; white-space: pre-wrap;">${fullSequence}</p>
                </div>
                <br/>
                <h3>CHI TIẾT TỪNG PHÂN CẢNH (SCENE DETAILS)</h3>
                <hr/>
                <br/>
                ${result.segments.map(s => `
                    <div class="segment">
                        <div class="time">[${s.time}]</div>
                        <p><span class="label">${labels.visual}:</span><br/>${s.visual}</p>
                        <p><span class="label">${labels.audio}:</span><br/>${s.audio}</p>
                        <div class="prompt-box">
                            <span class="label" style="color: #4f46e5;">${labels.analysis}:</span><br/>
                            ${s.analysis}
                        </div>
                    </div>
                `).join('')}
            </body>
            </html>
        `;
    } else {
        content = `TITLE: ${result.title}\nSUMMARY: ${result.summary}\n\n`;
        content += `========================================\n`;
        content += `TỔNG HỢP CHUỖI PROMPT LIỀN MẠCH (FULL SEQUENCE)\n`;
        content += `========================================\n\n`;
        content += fullSequence + "\n\n";
        content += `========================================\n`;
        content += `CHI TIẾT TỪNG PHÂN CẢNH\n`;
        content += `========================================\n\n`;
        result.segments.forEach(s => {
            content += `[TIME: ${s.time}]\n`;
            content += `${labels.visual}: ${s.visual}\n`;
            content += `${labels.audio}: ${s.audio}\n`;
            content += `${labels.analysis}:\n${s.analysis}\n`;
            content += `\n----------------------------------------\n\n`;
        });
    }

    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement("a");
    
    let videoName = "video_content";
    if (file) {
        videoName = file.name.replace(/\.[^/.]+$/, "");
    } else {
        videoName = result.title ? result.title : "video_link";
    }

    const safeVideoName = videoName.replace(/[^\w\s\u00C0-\u1EF9-]/g, '').trim().replace(/\s+/g, '_');
    
    link.href = URL.createObjectURL(blob);
    link.download = `prompt_video_${safeVideoName}_${selectedTone}.${extension}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowDownloadMenu(false);
    setShowBottomDownloadMenu(false);
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* VIDEO AREA */}
      <div className="h-[300px] w-full shrink-0">
        {inputMode === InputMode.FILE && file ? (
            <LocalVideoPlayer file={file} />
        ) : (
            <div className="w-full h-full bg-surface rounded-xl flex flex-col items-center justify-center border border-white/5 relative overflow-hidden">
                {url ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 p-8 text-center">
                         <Globe size={48} className="text-slate-600 mb-4" />
                         <p className="text-slate-400 text-sm max-w-[80%] truncate">{url}</p>
                    </div>
                ) : (
                    <>
                        <div className="p-4 bg-surfaceHighlight rounded-full mb-3">
                            <Play size={24} className="text-slate-600" fill="currentColor" />
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Video Preview</p>
                    </>
                )}
            </div>
        )}
      </div>

      {/* RESULT FEED */}
      <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden min-h-[400px] lg:min-h-0">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02] shrink-0">
            <h2 className="font-bold text-slate-200 text-sm flex items-center gap-2 uppercase tracking-wide">
                <Sparkles size={16} className="text-primary" />
                Kết quả phân tích
            </h2>
            <div className="flex items-center gap-2">
                 {isPromptFeature && result && (
                    <button 
                        onClick={() => setIsMinimalView(!isMinimalView)}
                        className={`text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all border ${
                            isMinimalView 
                            ? 'bg-primary text-white border-primary shadow-glow' 
                            : 'text-slate-300 hover:text-white border-white/5 hover:bg-white/5'
                        }`}
                        title="Display Prompt only"
                    >
                        <Zap size={14} fill={isMinimalView ? "currentColor" : "none"} />
                        <span className="hidden sm:inline">Prompt Board</span>
                    </button>
                 )}

                 <button 
                    onClick={onReset}
                    className="text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all border border-white/5 group"
                    title="Phân tích mới"
                >
                    <RotateCcw size={14} className="group-hover:-rotate-180 transition-transform duration-500" />
                    <span className="hidden sm:inline">Phân tích mới</span>
                </button>

                 {result && (
                    <div className="relative" ref={menuRef}>
                        <button 
                            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                            className="text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all border border-white/5"
                        >
                            <Download size={14} /> <span className="hidden sm:inline">Tải tất cả Prompts</span>
                        </button>
                        {showDownloadMenu && (
                            <div className="absolute top-full right-0 mt-2 w-40 bg-surface border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                                <button onClick={() => downloadFile('txt')} className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-white/10 hover:text-white flex items-center gap-2">
                                    <FileText size={14} /> Text (.txt)
                                </button>
                                <button onClick={() => downloadFile('doc')} className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-white/10 hover:text-white flex items-center gap-2">
                                    <FileText size={14} className="text-blue-400" /> Word (.doc)
                                </button>
                                <button onClick={() => downloadFile('json')} className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-white/10 hover:text-white flex items-center gap-2">
                                    <FileJson size={14} className="text-yellow-400" /> JSON
                                </button>
                            </div>
                        )}
                    </div>
                )}
                
                {result && selectedFeature === FeatureId.CREATE_AI_PROMPT && (
                     <button 
                     onClick={copyFullSequencePrompt}
                     className="text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all border border-white/5"
                      title="Gộp tất cả Scenes thành 1 Prompt dài (Tiếng Anh)"
                     >
                     {copiedFullPrompt ? <Check size={14} className="text-green-400" /> : <Layers size={14} />}
                     <span className="hidden sm:inline">{copiedFullPrompt ? 'Đã copy' : 'Copy Prompts (EN)'}</span>
                     </button>
                )}

                {result && (
                     <button 
                     onClick={copyVietnameseScenes}
                     className="text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all border border-white/5"
                     title="Copy mô tả cảnh (Tiếng Việt)"
                     >
                     {copiedVietnamese ? <Check size={14} className="text-green-400" /> : <ScrollText size={14} />}
                     <span className="hidden sm:inline">{copiedVietnamese ? 'Đã copy' : 'Copy Visual (VN)'}</span>
                     </button>
                )}

                {result && (
                    <button 
                    onClick={copyToClipboard}
                    className="text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all border border-white/5"
                    title="Copy toàn bộ báo cáo"
                    >
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    <span className="hidden sm:inline">{copied ? 'Đã copy' : 'Copy All Report'}</span>
                    </button>
                )}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-0 custom-scrollbar bg-black/20">
            {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="relative w-20 h-20">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                        <Bot className="absolute inset-0 m-auto text-primary animate-pulse" size={24} />
                    </div>
                    <div>
                        <h3 className="text-white font-medium">Đang phân tích video...</h3>
                        <p className="text-sm text-slate-500 mt-1">AI đang xem video và trích xuất dữ liệu cho bạn.</p>
                    </div>
                </div>
            ) : result ? (
                <div className="p-6 pb-20">
                    {selectedFeature === FeatureId.DEEP_ANALYSIS && (
                        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-violet-500 rounded-lg text-white">
                                    <Clapperboard size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white">Bạn muốn tạo video AI từ phân tích này?</h4>
                                    <p className="text-xs text-violet-200">Chuyển đổi ngay sang Prompt Veo/Sora mà không cần upload lại.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => onQuickAction(FeatureId.CREATE_AI_PROMPT)}
                                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg"
                            >
                                Tạo Prompt AI Video
                            </button>
                        </div>
                    )}

                    <div className="mb-8 p-6 bg-gradient-to-br from-indigo-900/20 to-slate-900/50 rounded-2xl border border-indigo-500/20">
                        <h1 className="text-xl font-bold text-white mb-2 leading-tight">{result.title}</h1>
                        <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-line">{result.summary}</p>
                        
                        {result.sources && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {result.sources.map((s, i) => (
                                    <a key={i} href={s.uri} target="_blank" className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-xs text-blue-300 transition-colors border border-white/5">
                                        <Globe size={10} /> {s.title}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {!isMinimalView ? (
                        <div className="relative space-y-6 pb-8">
                            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800/0"></div>

                            {result.segments.map((seg, idx) => (
                                <div key={idx} className="relative pl-12 group">
                                    <div className="absolute left-[14px] top-6 w-3 h-3 rounded-full bg-slate-800 border-2 border-slate-600 group-hover:border-primary group-hover:bg-primary transition-all z-10 shadow-sm"></div>
                                    
                                    <div className="bg-surface border border-white/5 rounded-xl overflow-hidden hover:border-primary/30 transition-all shadow-sm hover:shadow-md group">
                                        <div className="bg-white/[0.02] border-b border-white/5 px-4 py-2.5 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                 <div className="flex items-center justify-center w-5 h-5 rounded bg-slate-800/80 text-[10px] font-bold text-slate-300 border border-slate-700">
                                                    {idx + 1}
                                                 </div>
                                                 <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                                                    <Clock size={10} className="text-primary" />
                                                    <span className="text-[11px] font-mono text-primary font-bold">{seg.time}</span>
                                                 </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                                                <Clapperboard size={12} />
                                                <span>Scene</span>
                                            </div>
                                        </div>
                                        
                                        <div className="p-4">
                                            <div className="mb-3">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">{labels.audio}</span>
                                                <div className="text-slate-200 text-sm leading-6 whitespace-pre-wrap">{seg.audio}</div>
                                            </div>
                                            
                                            {(seg.visual || seg.analysis) && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-white/5">
                                                    {seg.visual && (
                                                        <div className="text-xs">
                                                            <span className="text-slate-500 font-bold mb-1 block uppercase text-[10px] tracking-widest">{labels.visual}</span>
                                                            <span className="text-slate-400">{seg.visual}</span>
                                                        </div>
                                                    )}
                                                    {seg.analysis && (
                                                        <div className={`text-xs rounded-lg p-3 border ${selectedFeature === FeatureId.CREATE_AI_PROMPT ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/5 border-white/10'}`}>
                                                            <div className={`flex items-center justify-between mb-2 ${selectedFeature === FeatureId.CREATE_AI_PROMPT ? 'text-indigo-400' : 'text-slate-400'}`}>
                                                                <div className="flex items-center gap-1.5">
                                                                    <Sparkles size={10} />
                                                                    <span className="font-bold uppercase text-[10px] tracking-widest">{labels.analysis}</span>
                                                                </div>
                                                                <CopyButton text={seg.analysis} />
                                                            </div>
                                                            <span className={`${selectedFeature === FeatureId.CREATE_AI_PROMPT ? 'text-indigo-200 font-mono' : 'text-slate-300'} text-[11px] leading-relaxed block`}>
                                                                {seg.analysis}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 pb-8">
                             <div className="flex items-center gap-2 px-6 py-2 bg-indigo-500/5 border-b border-indigo-500/10 mb-4">
                                <Bot size={14} className="text-indigo-400" />
                                <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Optimized Prompt Cards</span>
                             </div>
                             
                             {result.segments.map((seg, idx) => (
                                <div key={idx} className="bg-[#1a1f2e] border border-indigo-500/20 rounded-2xl p-5 mx-6 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Sparkles size={48} className="text-indigo-400" />
                                    </div>
                                    
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2 py-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded uppercase">Shot {idx + 1}</span>
                                                <span className="text-[10px] font-mono text-slate-500">{seg.time}</span>
                                            </div>
                                            {seg.audio && (
                                                <p className="text-xs text-slate-400 italic">"{seg.audio.slice(0, 100)}{seg.audio.length > 100 ? '...' : ''}"</p>
                                            )}
                                        </div>
                                        <CopyButton text={seg.analysis} className="bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white" />
                                    </div>

                                    <div className="bg-black/40 rounded-xl p-4 border border-white/5 font-mono text-[11px] text-indigo-200 leading-relaxed shadow-inner">
                                        {seg.analysis}
                                    </div>
                                    
                                    <div className="mt-3 flex items-center gap-4">
                                         <div className="flex items-center gap-1.5 text-[9px] text-slate-500 uppercase tracking-tighter">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            <span>Ready for Veo / Sora</span>
                                         </div>
                                         <div className="flex items-center gap-1.5 text-[9px] text-slate-500 uppercase tracking-tighter">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            <span>Shot Sequence {idx + 1}/{result.segments.length}</span>
                                         </div>
                                    </div>
                                </div>
                             ))}
                        </div>
                    )}

                    <div className="mt-8 flex justify-center pb-4 relative" ref={bottomMenuRef}>
                        <button 
                            onClick={() => setShowBottomDownloadMenu(!showBottomDownloadMenu)}
                            className="flex items-center gap-2 px-6 py-3 bg-surface border border-white/10 hover:bg-surfaceHighlight rounded-full text-slate-300 hover:text-white transition-all shadow-lg hover:shadow-primary/20 group"
                        >
                            <Download size={16} className="group-hover:-translate-y-0.5 transition-transform" />
                            <span className="font-medium text-sm">Tải toàn bộ Prompts</span>
                        </button>
                        
                        {showBottomDownloadMenu && (
                            <div className="absolute bottom-full mb-2 w-48 bg-surface border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in flex flex-col">
                                <button onClick={() => downloadFile('txt')} className="w-full text-left px-4 py-3 text-xs text-slate-300 hover:bg-white/10 hover:text-white flex items-center gap-2 border-b border-white/5">
                                    <FileText size={14} /> Text (.txt)
                                </button>
                                <button onClick={() => downloadFile('doc')} className="w-full text-left px-4 py-3 text-xs text-slate-300 hover:bg-white/10 hover:text-white flex items-center gap-2 border-b border-white/5">
                                    <FileText size={14} className="text-blue-400" /> Word (.doc)
                                </button>
                                <button onClick={() => downloadFile('json')} className="w-full text-left px-4 py-3 text-xs text-slate-300 hover:bg-white/10 hover:text-white flex items-center gap-2">
                                    <FileJson size={14} className="text-yellow-400" /> JSON
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                    <div className="w-16 h-16 bg-surfaceHighlight rounded-2xl flex items-center justify-center mb-4 border border-white/5">
                        <Bot size={32} />
                    </div>
                    <p className="text-sm">Chưa có dữ liệu phân tích</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
