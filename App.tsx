import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import {
  Upload, FileVideo, RefreshCw, Zap, MessageSquare, Link as LinkIcon, Youtube, Sparkles,
  Copy, Bot, Play, Pause, Volume2, VolumeX, Maximize2, Globe, Download, Clapperboard,
  Check, FileText, FileJson, Clock, RotateCcw, Layers, ScrollText,
  ScanEye, Image as ImageIcon, PenTool, Video
} from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

// ─── TYPES ───────────────────────────────────────────────────────────────────

enum InputMode { LINK = 'LINK', FILE = 'FILE' }

enum FeatureId {
  CREATE_AI_PROMPT = 'create_ai_prompt',
  EXTRACT_SCRIPT = 'extract_script',
  DEEP_ANALYSIS = 'deep_analysis',
  AUDIT_THUMBNAIL = 'audit_thumbnail',
  REMAKE_POST = 'remake_post',
  REMAKE_SCRIPT = 'remake_script',
  TIKTOK_SCRIPT = 'tiktok_script',
}

enum ToneId {
  HUMOROUS = 'humorous', EXPERT = 'expert', FRIENDLY = 'friendly',
  EMOTIONAL = 'emotional', SARCASTIC = 'sarcastic', CONCISE = 'concise',
  SEXY_GIRL = 'sexy_girl', CUTE_HEARTWARMING = 'cute_heartwarming',
  STREET_FASHION = 'street_fashion', GIFT_FAMILY = 'gift_family',
}

interface AnalysisSegment { time: string; visual: string; audio: string; analysis: string; }
interface Source { title: string; uri: string; }
interface AnalysisResult { title: string; summary: string; segments: AnalysisSegment[]; sources?: Source[]; }
interface Feature { id: FeatureId; icon: any; title: string; description: string; }
interface Tone { id: ToneId; label: string; }

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const FEATURES: Feature[] = [
  { id: FeatureId.CREATE_AI_PROMPT, icon: Clapperboard, title: "Tạo Prompt Video AI", description: "Tạo prompt (Anh/Việt) cho Veo, Sora, Kling từ video gốc." },
  { id: FeatureId.DEEP_ANALYSIS, icon: ScanEye, title: "Phân Tích Sâu", description: "Lời thoại, hình ảnh & nội dung từng đoạn." },
  { id: FeatureId.EXTRACT_SCRIPT, icon: FileText, title: "Trích Xuất Script", description: "Chép lại lời thoại chi tiết từ video." },
  { id: FeatureId.AUDIT_THUMBNAIL, icon: ImageIcon, title: "Audit Thumbnail", description: "Đánh giá màu sắc, text & độ thu hút." },
  { id: FeatureId.REMAKE_POST, icon: PenTool, title: "Remake Bài Viết", description: "Paste text/link hoặc ảnh -> Tự viết lại bài mới." },
  { id: FeatureId.REMAKE_SCRIPT, icon: RefreshCw, title: "Remake Kịch Bản", description: "Viết lại script hài hước cho kênh của bạn." },
  { id: FeatureId.TIKTOK_SCRIPT, icon: Video, title: "Tạo Script TikTok", description: "Từ ý tưởng -> Kịch bản viral hoàn chỉnh." },
];

const TONES: Tone[] = [
  { id: ToneId.HUMOROUS, label: "Hài hước & Lầy lội" },
  { id: ToneId.EXPERT, label: "Chuyên gia & Nghiêm túc" },
  { id: ToneId.FRIENDLY, label: "Thân thiện & Gần gũi" },
  { id: ToneId.EMOTIONAL, label: "Cảm xúc & Kể chuyện" },
  { id: ToneId.SARCASTIC, label: "Xéo xắt & Drama" },
  { id: ToneId.CONCISE, label: "Ngắn gọn & Súc tích" },
  { id: ToneId.SEXY_GIRL, label: "Sexy Girl & Quyến rũ" },
  { id: ToneId.CUTE_HEARTWARMING, label: "Dễ thương & Chữa lành" },
  { id: ToneId.STREET_FASHION, label: "Street Style & Review Fashion" },
  { id: ToneId.GIFT_FAMILY, label: "Quà Tặng & Gia Đình" },
];

// ─── GEMINI SERVICE ───────────────────────────────────────────────────────────

const mapToneToPrompt = (tone: ToneId): string => {
  const map: Record<ToneId, string> = {
    [ToneId.HUMOROUS]: "Hài hước, vui nhộn, dùng tiếng lóng Gen Z, teencode nếu phù hợp.",
    [ToneId.EXPERT]: "Chuyên nghiệp, phân tích sâu sắc, dùng thuật ngữ chuyên ngành marketing/film.",
    [ToneId.FRIENDLY]: "Thân thiện, thủ thỉ tâm tình, như người bạn đang chia sẻ kinh nghiệm.",
    [ToneId.EMOTIONAL]: "Đầy cảm xúc, chạm đến nỗi đau (pain point) hoặc khát khao của người xem.",
    [ToneId.SARCASTIC]: "Châm biếm, sắc sảo, xéo xắt, dùng ngôn từ mạnh.",
    [ToneId.CONCISE]: "Ngắn gọn, súc tích, gạch đầu dòng rõ ràng, đi thẳng vào vấn đề.",
    [ToneId.SEXY_GIRL]: "Quyến rũ, lôi cuốn, giọng điệu ngọt ngào pha chút bí ẩn, tự tin.",
    [ToneId.CUTE_HEARTWARMING]: "Ngọt ngào, đáng yêu, mang lại cảm giác chữa lành (healing).",
    [ToneId.STREET_FASHION]: "Năng động, Cool ngầu, đậm chất Streetwear. Tập trung vào Review chất vải, form dáng.",
    [ToneId.GIFT_FAMILY]: "Ấm áp, Trân trọng, Tinh tế. Tập trung khai thác ý nghĩa món quà.",
  };
  return map[tone] || "Trung lập, rõ ràng.";
};

const mapFeatureToInstruction = (feature: FeatureId): string => {
  const map: Record<FeatureId, string> = {
    [FeatureId.CREATE_AI_PROMPT]: `MỤC TIÊU: Tạo bộ Prompt chi tiết (Tiếng Anh & Tiếng Việt) để tái tạo video bằng Veo, Sora, Kling. Chia SHOT-BY-SHOT 2-5 giây/segment. Mô tả visual: [Subject]+[Action]+[Camera]+[Lighting]. KHÔNG chứa TEXT trong visual. Audio: lời thoại gốc + SFX + BGM.`,
    [FeatureId.EXTRACT_SCRIPT]: `MỤC TIÊU: Trích xuất CHÍNH XÁC từng câu thoại. Mỗi câu là một segment. Gắn mốc thời gian chính xác.`,
    [FeatureId.DEEP_ANALYSIS]: `MỤC TIÊU: Phân tích sâu chiến lược video. Chia theo Hook, Problem, Solution, CTA.`,
    [FeatureId.AUDIT_THUMBNAIL]: `MỤC TIÊU: Đánh giá CTR thumbnail. Chia thành các tiêu chí: Màu sắc, Text, Cảm xúc, Bố cục.`,
    [FeatureId.REMAKE_POST]: `MỤC TIÊU: Viết bài đăng MXH. Chia thành 3 phần: Mở bài (Hook), Thân bài (Value), Kết bài (CTA).`,
    [FeatureId.REMAKE_SCRIPT]: `MỤC TIÊU: Viết kịch bản Remake. Chia nhỏ từng cảnh quay (Scene).`,
    [FeatureId.TIKTOK_SCRIPT]: `MỤC TIÊU: Kịch bản TikTok nhanh. Chia nhỏ từng giây (0-3s, 3-10s...).`,
  };
  return map[feature] || "Phân tích video chi tiết.";
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    summary: { type: Type.STRING },
    segments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          time: { type: Type.STRING },
          visual: { type: Type.STRING },
          audio: { type: Type.STRING },
          analysis: { type: Type.STRING },
        },
        required: ["time", "visual", "audio", "analysis"]
      }
    }
  },
  required: ["title", "summary", "segments"]
};

function extractJSON(text: string): string {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) return text.substring(start, end + 1);
  return text;
}

const analyzeVideo = async (
  fileBase64: string | null, mimeType: string | null,
  url: string, feature: FeatureId, tone: ToneId, customPrompt: string
): Promise<AnalysisResult> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing. Please set GEMINI_API_KEY in Vercel environment variables.");

  const ai = new GoogleGenAI({ apiKey });
  const isUrlMode = !!url && !fileBase64;

  const systemInstruction = `Bạn là chuyên gia Viral Video Marketing và Scriptwriter.
  YÊU CẦU CHỨC NĂNG: ${mapFeatureToInstruction(feature)}
  PHONG CÁCH: ${mapToneToPrompt(tone)}
  YÊU CẦU TÙY CHỈNH: "${customPrompt || "Không có"}"
  QUAN TRỌNG: Chia thành nhiều segments. Ngôn ngữ trả về: Tiếng Việt (trừ khi tính năng cần tiếng Anh).
  ${isUrlMode ? `Output MUST be a single valid JSON object. No markdown.` : `Output phải là JSON hợp lệ.`}`;

  const parts: any[] = [];
  if (fileBase64 && mimeType) {
    parts.push({ inlineData: { data: fileBase64, mimeType } });
    parts.push({ text: "Hãy xử lý video này theo yêu cầu trên." });
  } else if (url) {
    parts.push({ text: `Phân tích video từ đường dẫn: ${url}. Dùng Google Search để tìm thông tin. Trả về JSON hợp lệ. Nếu không tìm thấy, trả về JSON thông báo lỗi rõ ràng.` });
  } else {
    throw new Error("Vui lòng cung cấp file video hoặc link.");
  }

  const requestConfig: any = { systemInstruction, temperature: 0.2 };
  if (isUrlMode) {
    requestConfig.tools = [{ googleSearch: {} }];
  } else {
    requestConfig.responseMimeType = "application/json";
    requestConfig.responseSchema = responseSchema;
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: { role: "user", parts },
    config: requestConfig,
  });

  if (!response.text) throw new Error("No response from AI");

  const jsonStr = extractJSON(response.text);
  try {
    const result = JSON.parse(jsonStr) as AnalysisResult;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      result.sources = groundingChunks
        .map((chunk: any) => ({ title: chunk.web?.title || 'Web Source', uri: chunk.web?.uri || '' }))
        .filter((s: any) => s.uri);
    }
    return result;
  } catch {
    throw new Error("AI trả về định dạng không xử lý được. Vui lòng thử lại.");
  }
};

// ─── FEATURE CARD ─────────────────────────────────────────────────────────────

const FeatureCard: React.FC<{ feature: Feature; isSelected: boolean; onClick: (id: FeatureId) => void }> = ({ feature, isSelected, onClick }) => {
  const Icon = feature.icon;
  return (
    <div onClick={() => onClick(feature.id)}
      className={`relative overflow-hidden rounded-xl p-4 cursor-pointer transition-all duration-300 flex flex-col gap-3 border ${isSelected ? 'bg-primary/10 border-primary/50 shadow-glow' : 'bg-surface border-white/5 hover:border-white/10 hover:bg-surfaceHighlight'}`}>
      <div className="flex items-center justify-between">
        <div className={`p-2.5 rounded-lg transition-all duration-300 ${isSelected ? 'bg-primary text-white' : 'bg-slate-800/50 text-slate-400'}`}>
          <Icon size={20} />
        </div>
        {isSelected && <div className="h-2 w-2 rounded-full bg-primary" />}
      </div>
      <div>
        <h3 className={`font-semibold text-sm mb-1 ${isSelected ? 'text-white' : 'text-slate-300'}`}>{feature.title}</h3>
        <p className={`text-xs leading-relaxed line-clamp-2 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>{feature.description}</p>
      </div>
    </div>
  );
};

// ─── COPY BUTTON ──────────────────────────────────────────────────────────────

const CopyButton: React.FC<{ text: string; className?: string }> = ({ text, className = "" }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className={`p-1.5 rounded hover:bg-white/10 transition-colors text-slate-400 hover:text-white ${className}`}>
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
    </button>
  );
};

// ─── VIDEO PLAYER ─────────────────────────────────────────────────────────────

const LocalVideoPlayer: React.FC<{ file: File }> = ({ file }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const videoSrc = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => { return () => URL.revokeObjectURL(videoSrc); }, [videoSrc]);

  const fmt = (t: number) => { const m = Math.floor(t / 60), s = Math.floor(t % 60); return `${m}:${s < 10 ? '0' : ''}${s}`; };
  const togglePlay = () => { if (videoRef.current) { isPlaying ? videoRef.current.pause() : videoRef.current.play(); setIsPlaying(!isPlaying); } };
  const handleTimeUpdate = () => { if (videoRef.current) { const c = videoRef.current.currentTime, d = videoRef.current.duration || 0; setCurrentTime(c); setDuration(d); if (d > 0) setProgress((c / d) * 100); } };
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => { if (videoRef.current) { const p = parseFloat(e.target.value), t = (p / 100) * videoRef.current.duration; videoRef.current.currentTime = t; setProgress(p); setCurrentTime(t); } };
  const toggleMute = () => { if (videoRef.current) { videoRef.current.muted = !isMuted; setIsMuted(!isMuted); } };

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden group shadow-2xl"
      onMouseEnter={() => setShowControls(true)} onMouseLeave={() => setShowControls(false)}>
      <video ref={videoRef} src={videoSrc} className="w-full h-full object-contain" onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleTimeUpdate} onEnded={() => setIsPlaying(false)} />
      {!isPlaying && (
        <div onClick={togglePlay} className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer">
          <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-full flex items-center justify-center hover:scale-110 transition-transform">
            <Play size={28} className="text-white fill-white ml-1" />
          </div>
        </div>
      )}
      <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] font-mono text-white">{fmt(currentTime)}</span>
          <input type="range" min="0" max="100" step="0.1" value={progress} onChange={handleSeek}
            className="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-primary" />
          <span className="text-[10px] font-mono text-white/70">{fmt(duration)}</span>
        </div>
        <div className="flex justify-between items-center">
          <button onClick={togglePlay} className="text-white hover:text-primary">
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </button>
          <div className="flex gap-3">
            <button onClick={toggleMute} className="text-white hover:text-primary">{isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
            <button onClick={() => videoRef.current?.requestFullscreen()} className="text-white hover:text-primary"><Maximize2 size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── INPUT SECTION ────────────────────────────────────────────────────────────

interface InputSectionProps {
  inputMode: InputMode; setInputMode: (m: InputMode) => void;
  url: string; setUrl: (u: string) => void;
  file: File | null; setFile: (f: File | null) => void;
  selectedFeature: FeatureId; setSelectedFeature: (id: FeatureId) => void;
  selectedTone: ToneId; setSelectedTone: (id: ToneId) => void;
  customPrompt: string; setCustomPrompt: (p: string) => void;
  onAnalyze: () => void; isLoading: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({
  inputMode, setInputMode, url, setUrl, file, setFile,
  selectedFeature, setSelectedFeature, selectedTone, setSelectedTone,
  customPrompt, setCustomPrompt, onAnalyze, isLoading
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const MAX = 1024 * 1024 * 1024;

  const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === "dragenter" || e.type === "dragover"); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); const f = e.dataTransfer.files?.[0]; if (f) { if (f.size > MAX) { alert("File quá lớn."); return; } setFile(f); setInputMode(InputMode.FILE); } };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) { if (f.size > MAX) { alert("File quá lớn."); if (fileInputRef.current) fileInputRef.current.value = ''; return; } setFile(f); setInputMode(InputMode.FILE); } };
  const triggerUpload = (e?: React.MouseEvent) => { e?.stopPropagation(); if (fileInputRef.current) { fileInputRef.current.value = ''; fileInputRef.current.click(); } };

  const SectionTitle = ({ icon: Icon, title }: { icon: any; title: string }) => (
    <div className="flex items-center gap-2 text-slate-200 mb-4">
      <Icon size={16} className="text-primary" />
      <h2 className="text-sm font-bold tracking-wide uppercase">{title}</h2>
    </div>
  );

  const canAnalyze = !isLoading && ((inputMode === InputMode.FILE && !!file) || (inputMode === InputMode.LINK && !!url));

  return (
    <div className="flex flex-col gap-8 h-full pb-28">
      <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileChange} className="hidden" />

      <div className="glass-panel rounded-2xl p-6">
        <SectionTitle icon={Upload} title="Nguồn Video" />
        <div className="flex bg-slate-900/50 p-1 rounded-lg mb-4 border border-white/5">
          {[{ mode: InputMode.FILE, icon: FileVideo, label: "Tải File" }, { mode: InputMode.LINK, icon: LinkIcon, label: "Nhập Link" }].map(({ mode, icon: Icon, label }) => (
            <button key={mode} onClick={() => setInputMode(mode)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all duration-300 ${inputMode === mode ? 'bg-surfaceHighlight text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
              <Icon size={16} /><span>{label}</span>
            </button>
          ))}
        </div>
        {inputMode === InputMode.FILE ? (
          <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={triggerUpload}
            className={`relative overflow-hidden group rounded-xl h-[120px] w-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${dragActive ? 'border-2 border-primary bg-primary/10' : 'border border-dashed border-slate-700 bg-slate-900/30 hover:border-slate-500 hover:bg-slate-800'}`}>
            {file ? (
              <div className="flex items-center gap-4 w-full px-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0"><FileVideo size={24} className="text-white" /></div>
                <div className="flex-1 min-w-0"><p className="text-white font-medium text-sm truncate">{file.name}</p><p className="text-slate-400 text-xs font-mono mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p></div>
                <button type="button" onClick={triggerUpload} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"><RefreshCw size={16} /></button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="p-3 bg-slate-800 rounded-full group-hover:scale-110 transition-transform duration-300"><Upload size={20} className="text-slate-400 group-hover:text-primary" /></div>
                <div><h3 className="text-sm font-medium text-slate-200">Click để upload hoặc kéo thả</h3><p className="text-[11px] text-slate-500 mt-1">MP4, MOV (Max 1GB)</p></div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Youtube size={18} className="text-red-500" /></div>
              <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Dán link YouTube hoặc TikTok..."
                className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-900/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm transition-all" />
            </div>
            <p className="text-[11px] text-slate-500 pl-1">*Với link, AI sẽ tìm kiếm thông tin từ web.</p>
          </div>
        )}
      </div>

      <div>
        <SectionTitle icon={Zap} title="Chọn Tính Năng" />
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map(feat => <FeatureCard key={feat.id} feature={feat} isSelected={selectedFeature === feat.id} onClick={setSelectedFeature} />)}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6">
        <div>
          <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Phong cách (Tone)</h3>
          <div className="flex flex-wrap gap-2">
            {TONES.map(t => (
              <button key={t.id} onClick={() => setSelectedTone(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${selectedTone === t.id ? 'bg-primary/10 border-primary text-primary' : 'bg-surface border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2"><MessageSquare size={12} /> Yêu cầu thêm (Optional)</h3>
          <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} placeholder="Nhập ghi chú cụ thể cho AI..."
            className="w-full h-24 bg-surface border border-slate-800 rounded-xl p-3 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-slate-200 placeholder-slate-600 resize-none transition-all" />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 lg:left-auto lg:w-[calc(41.666667%-3rem)] w-full p-6 bg-gradient-to-t from-background via-background to-transparent z-20">
        <button onClick={onAnalyze} disabled={!canAnalyze}
          className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all duration-300 btn-primary ${!canAnalyze ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:-translate-y-1'}`}>
          {isLoading ? (<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Đang xử lý...</span></>) : (<><Zap size={18} fill="currentColor" /><span>BẮT ĐẦU PHÂN TÍCH</span></>)}
        </button>
      </div>
    </div>
  );
};

// ─── RESULT SECTION ───────────────────────────────────────────────────────────

interface ResultSectionProps {
  inputMode: InputMode; file: File | null; url: string;
  result: AnalysisResult | null; isLoading: boolean;
  selectedFeature: FeatureId; selectedTone: ToneId;
  onQuickAction: (id: FeatureId) => void; onReset: () => void;
}

const ResultSection: React.FC<ResultSectionProps> = ({ inputMode, file, url, result, isLoading, selectedFeature, selectedTone, onQuickAction, onReset }) => {
  const [copied, setCopied] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);
  const [copiedVN, setCopiedVN] = useState(false);
  const [showDL, setShowDL] = useState(false);
  const [showDLBottom, setShowDLBottom] = useState(false);
  const [isMinimal, setIsMinimal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isPrompt = selectedFeature === FeatureId.CREATE_AI_PROMPT;
  const labels = {
    visual: isPrompt ? "VISUAL PROMPT (NO TEXT)" : "MÔ TẢ HÌNH ẢNH",
    audio: isPrompt ? "VOICE & SOUND EFFECTS" : "ÂM THANH / LỜI THOẠI",
    analysis: isPrompt ? "AI VIDEO ENGINE PROMPT" : "PHÂN TÍCH / GHI CHÚ",
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowDL(false);
      if (bottomRef.current && !bottomRef.current.contains(e.target as Node)) setShowDLBottom(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const copyAll = () => { if (!result) return; navigator.clipboard.writeText(result.segments.map(s => `[${s.time}]\n${labels.visual}: ${s.visual}\n${labels.audio}: ${s.audio}\n${labels.analysis}: ${s.analysis}\n`).join('\n---\n')); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const copyEN = () => { if (!result) return; navigator.clipboard.writeText(result.segments.map((s, i) => `Shot ${i+1} (${s.time}): ${s.analysis}`).join('\nNEXT SHOT:\n')); setCopiedFull(true); setTimeout(() => setCopiedFull(false), 2000); };
  const copyVN = () => { if (!result) return; navigator.clipboard.writeText(result.segments.map((s, i) => `Cảnh ${i+1} (${s.time}): ${s.visual}`).join('\n\n')); setCopiedVN(true); setTimeout(() => setCopiedVN(false), 2000); };

  const download = (format: 'txt' | 'json' | 'doc') => {
    if (!result) return;
    const seq = result.segments.map((s, i) => `Shot ${i+1} (${s.time}): ${s.analysis}`).join('\nNEXT SHOT:\n');
    let content = "", mime = "text/plain", ext = "txt";
    if (format === 'json') { content = JSON.stringify(result, null, 2); mime = "application/json"; ext = "json"; }
    else if (format === 'doc') {
      mime = "application/msword"; ext = "doc";
      content = `<html><head><meta charset="utf-8"><title>${result.title}</title></head><body><h1>${result.title}</h1><p><b>SUMMARY:</b> ${result.summary}</p><hr/><pre>${seq}</pre><hr/>${result.segments.map((s,i) => `<div><b>Scene ${i+1} [${s.time}]</b><p>${labels.visual}: ${s.visual}</p><p>${labels.audio}: ${s.audio}</p><p>${labels.analysis}: ${s.analysis}</p></div>`).join('')}</body></html>`;
    } else {
      content = `TITLE: ${result.title}\nSUMMARY: ${result.summary}\n\n${seq}\n\n` + result.segments.map(s => `[${s.time}]\n${labels.visual}: ${s.visual}\n${labels.audio}: ${s.audio}\n${labels.analysis}: ${s.analysis}\n`).join('\n---\n');
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    const name = (file?.name.replace(/\.[^/.]+$/, '') || result.title || 'video').replace(/[^\w\s\u00C0-\u1EF9-]/g, '').trim().replace(/\s+/g, '_');
    a.download = `prompt_${name}_${selectedTone}.${ext}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setShowDL(false); setShowDLBottom(false);
  };

  const DLMenu = ({ onClose }: { onClose: () => void }) => (
    <div className="w-40 bg-surface border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
      {(['txt', 'doc', 'json'] as const).map(f => (
        <button key={f} onClick={() => download(f)} className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-white/10 hover:text-white flex items-center gap-2">
          {f === 'json' ? <FileJson size={14} className="text-yellow-400" /> : <FileText size={14} className={f === 'doc' ? 'text-blue-400' : ''} />}
          {f === 'txt' ? 'Text (.txt)' : f === 'doc' ? 'Word (.doc)' : 'JSON'}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="h-[300px] w-full shrink-0">
        {inputMode === InputMode.FILE && file ? <LocalVideoPlayer file={file} /> : (
          <div className="w-full h-full bg-surface rounded-xl flex flex-col items-center justify-center border border-white/5">
            {url ? <div className="flex flex-col items-center p-8 text-center"><Globe size={48} className="text-slate-600 mb-4" /><p className="text-slate-400 text-sm max-w-[80%] truncate">{url}</p></div>
              : <><div className="p-4 bg-surfaceHighlight rounded-full mb-3"><Play size={24} className="text-slate-600" fill="currentColor" /></div><p className="text-slate-500 text-sm">Video Preview</p></>}
          </div>
        )}
      </div>

      <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden min-h-[400px] lg:min-h-0">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02] shrink-0">
          <h2 className="font-bold text-slate-200 text-sm flex items-center gap-2 uppercase tracking-wide"><Sparkles size={16} className="text-primary" />Kết quả phân tích</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {isPrompt && result && (
              <button onClick={() => setIsMinimal(!isMinimal)} className={`text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all border ${isMinimal ? 'bg-primary text-white border-primary' : 'text-slate-300 hover:text-white border-white/5 hover:bg-white/5'}`}>
                <Zap size={14} fill={isMinimal ? "currentColor" : "none"} /><span className="hidden sm:inline">Prompt Board</span>
              </button>
            )}
            <button onClick={onReset} className="text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all border border-white/5 group">
              <RotateCcw size={14} className="group-hover:-rotate-180 transition-transform duration-500" /><span className="hidden sm:inline">Phân tích mới</span>
            </button>
            {result && (<div className="relative" ref={menuRef}>
              <button onClick={() => setShowDL(!showDL)} className="text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all border border-white/5">
                <Download size={14} /><span className="hidden sm:inline">Tải Prompts</span>
              </button>
              {showDL && <div className="absolute top-full right-0 mt-2"><DLMenu onClose={() => setShowDL(false)} /></div>}
            </div>)}
            {result && isPrompt && <button onClick={copyEN} className="text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all border border-white/5">{copiedFull ? <Check size={14} className="text-green-400" /> : <Layers size={14} />}<span className="hidden sm:inline">{copiedFull ? 'Đã copy' : 'Copy (EN)'}</span></button>}
            {result && <button onClick={copyVN} className="text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all border border-white/5">{copiedVN ? <Check size={14} className="text-green-400" /> : <ScrollText size={14} />}<span className="hidden sm:inline">{copiedVN ? 'Đã copy' : 'Visual (VN)'}</span></button>}
            {result && <button onClick={copyAll} className="text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all border border-white/5">{copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}<span className="hidden sm:inline">{copied ? 'Đã copy' : 'Copy All'}</span></button>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                <Bot className="absolute inset-0 m-auto text-primary animate-pulse" size={24} />
              </div>
              <div><h3 className="text-white font-medium">Đang phân tích video...</h3><p className="text-sm text-slate-500 mt-1">AI đang xem video và trích xuất dữ liệu.</p></div>
            </div>
          ) : result ? (
            <div className="p-6 pb-20">
              {selectedFeature === FeatureId.DEEP_ANALYSIS && (
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500 rounded-lg text-white"><Clapperboard size={20} /></div>
                    <div><h4 className="text-sm font-bold text-white">Tạo video AI từ phân tích này?</h4><p className="text-xs text-violet-200">Chuyển sang Prompt Veo/Sora không cần upload lại.</p></div>
                  </div>
                  <button onClick={() => onQuickAction(FeatureId.CREATE_AI_PROMPT)} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-lg transition-colors">Tạo Prompt AI Video</button>
                </div>
              )}
              <div className="mb-8 p-6 bg-gradient-to-br from-indigo-900/20 to-slate-900/50 rounded-2xl border border-indigo-500/20">
                <h1 className="text-xl font-bold text-white mb-2">{result.title}</h1>
                <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-line">{result.summary}</p>
                {result.sources && <div className="mt-4 flex flex-wrap gap-2">{result.sources.map((s, i) => <a key={i} href={s.uri} target="_blank" className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-xs text-blue-300 border border-white/5"><Globe size={10} />{s.title}</a>)}</div>}
              </div>
              {!isMinimal ? (
                <div className="relative space-y-6 pb-8">
                  <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800/0"></div>
                  {result.segments.map((seg, idx) => (
                    <div key={idx} className="relative pl-12 group">
                      <div className="absolute left-[14px] top-6 w-3 h-3 rounded-full bg-slate-800 border-2 border-slate-600 group-hover:border-primary group-hover:bg-primary transition-all z-10"></div>
                      <div className="bg-surface border border-white/5 rounded-xl overflow-hidden hover:border-primary/30 transition-all">
                        <div className="bg-white/[0.02] border-b border-white/5 px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-5 h-5 rounded bg-slate-800/80 text-[10px] font-bold text-slate-300 border border-slate-700">{idx+1}</div>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/10 border border-primary/20"><Clock size={10} className="text-primary" /><span className="text-[11px] font-mono text-primary font-bold">{seg.time}</span></div>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase"><Clapperboard size={12} /><span>Scene</span></div>
                        </div>
                        <div className="p-4">
                          <div className="mb-3"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">{labels.audio}</span><div className="text-slate-200 text-sm leading-6 whitespace-pre-wrap">{seg.audio}</div></div>
                          {(seg.visual || seg.analysis) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-white/5">
                              {seg.visual && <div className="text-xs"><span className="text-slate-500 font-bold mb-1 block uppercase text-[10px] tracking-widest">{labels.visual}</span><span className="text-slate-400">{seg.visual}</span></div>}
                              {seg.analysis && (
                                <div className={`text-xs rounded-lg p-3 border ${isPrompt ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/5 border-white/10'}`}>
                                  <div className={`flex items-center justify-between mb-2 ${isPrompt ? 'text-indigo-400' : 'text-slate-400'}`}>
                                    <div className="flex items-center gap-1.5"><Sparkles size={10} /><span className="font-bold uppercase text-[10px] tracking-widest">{labels.analysis}</span></div>
                                    <CopyButton text={seg.analysis} />
                                  </div>
                                  <span className={`${isPrompt ? 'text-indigo-200 font-mono' : 'text-slate-300'} text-[11px] leading-relaxed block`}>{seg.analysis}</span>
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
                  <div className="flex items-center gap-2 px-6 py-2 bg-indigo-500/5 border-b border-indigo-500/10 mb-4"><Bot size={14} className="text-indigo-400" /><span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Optimized Prompt Cards</span></div>
                  {result.segments.map((seg, idx) => (
                    <div key={idx} className="bg-[#1a1f2e] border border-indigo-500/20 rounded-2xl p-5 mx-6 relative overflow-hidden group">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1"><span className="px-2 py-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded uppercase">Shot {idx+1}</span><span className="text-[10px] font-mono text-slate-500">{seg.time}</span></div>
                          {seg.audio && <p className="text-xs text-slate-400 italic">"{seg.audio.slice(0,100)}{seg.audio.length > 100 ? '...' : ''}"</p>}
                        </div>
                        <CopyButton text={seg.analysis} className="bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white" />
                      </div>
                      <div className="bg-black/40 rounded-xl p-4 border border-white/5 font-mono text-[11px] text-indigo-200 leading-relaxed">{seg.analysis}</div>
                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-500 uppercase"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div><span>Ready for Veo / Sora</span></div>
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-500 uppercase"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div><span>Shot {idx+1}/{result.segments.length}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-8 flex justify-center pb-4 relative" ref={bottomRef}>
                <button onClick={() => setShowDLBottom(!showDLBottom)} className="flex items-center gap-2 px-6 py-3 bg-surface border border-white/10 hover:bg-surfaceHighlight rounded-full text-slate-300 hover:text-white transition-all shadow-lg group">
                  <Download size={16} className="group-hover:-translate-y-0.5 transition-transform" /><span className="font-medium text-sm">Tải toàn bộ Prompts</span>
                </button>
                {showDLBottom && <div className="absolute bottom-full mb-2"><DLMenu onClose={() => setShowDLBottom(false)} /></div>}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <div className="w-16 h-16 bg-surfaceHighlight rounded-2xl flex items-center justify-center mb-4 border border-white/5"><Bot size={32} /></div>
              <p className="text-sm">Chưa có dữ liệu phân tích</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [inputMode, setInputMode] = useState<InputMode>(InputMode.FILE);
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<FeatureId>(FeatureId.CREATE_AI_PROMPT);
  const [selectedTone, setSelectedTone] = useState<ToneId>(ToneId.FRIENDLY);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const fileToBase64 = (f: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(f);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });

  const performAnalysis = async (feature: FeatureId) => {
    setIsLoading(true); setResult(null);
    try {
      let fileData: string | null = null, mimeType: string | null = null;
      if (inputMode === InputMode.FILE && file) {
        if (file.size > 1024 * 1024 * 1024) { alert("File quá lớn."); setIsLoading(false); return; }
        fileData = await fileToBase64(file); mimeType = file.type;
      }
      const data = await analyzeVideo(fileData, mimeType, inputMode === InputMode.LINK ? url : '', feature, selectedTone, customPrompt);
      setResult(data);
      setTimeout(() => { if (window.innerWidth < 1024 && resultRef.current) resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
    } catch (error: any) {
      let msg = "Có lỗi xảy ra.";
      if (error.message) msg += `\nChi tiết: ${error.message}`;
      alert(msg);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="app-bg min-h-screen text-slate-200 flex flex-col lg:h-screen lg:overflow-hidden">
      <header className="shrink-0 flex items-center justify-between p-4 lg:px-6 lg:py-4 border-b border-white/5 bg-background/50 backdrop-blur-md z-30 sticky top-0 lg:relative">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 text-white"><path d="M13.5 2L3.5 12h7l-1 10 10-10h-7l1-10z" /></svg>
          </div>
          <div><h1 className="text-lg font-bold text-white tracking-tight leading-none">Viral Video MKT</h1><p className="text-slate-400 text-xs font-medium mt-1">Video Intelligence Platform</p></div>
        </div>
        <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-white/5 rounded-full border border-white/5">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div><span className="text-xs font-medium text-slate-300">System Ready</span></div>
        </div>
      </header>
      <div className="flex-1 lg:overflow-hidden">
        <div className="max-w-[1600px] mx-auto h-auto lg:h-full grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-8 p-0 lg:p-6">
          <div className="lg:col-span-5 p-4 lg:p-0 lg:h-full lg:overflow-y-auto custom-scrollbar block">
            <InputSection inputMode={inputMode} setInputMode={setInputMode} url={url} setUrl={setUrl} file={file} setFile={setFile}
              selectedFeature={selectedFeature} setSelectedFeature={setSelectedFeature} selectedTone={selectedTone} setSelectedTone={setSelectedTone}
              customPrompt={customPrompt} setCustomPrompt={setCustomPrompt}
              onAnalyze={() => performAnalysis(selectedFeature)} isLoading={isLoading} />
          </div>
          <div ref={resultRef} className={`lg:col-span-7 p-4 lg:p-0 lg:h-full lg:flex lg:flex-col ${!result ? 'hidden lg:flex' : 'flex'}`}>
            <ResultSection inputMode={inputMode} file={file} url={url} result={result} isLoading={isLoading}
              selectedFeature={selectedFeature} selectedTone={selectedTone}
              onQuickAction={(id) => { setSelectedFeature(id); setTimeout(() => performAnalysis(id), 100); }}
              onReset={() => { setResult(null); setFile(null); setUrl(''); setCustomPrompt(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
          </div>
        </div>
      </div>
    </div>
  );
}
