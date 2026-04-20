import React, { useState, useRef } from 'react';
import { InputSection } from './InputSection';
import { ResultSection } from './ResultSection';
import { InputMode, FeatureId, ToneId, AnalysisResult } from './types';
import { analyzeVideo } from './geminiService';

export default function App() {
  const [inputMode, setInputMode] = useState<InputMode>(InputMode.FILE);
  const [url, setUrl] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  
  const [selectedFeature, setSelectedFeature] = useState<FeatureId>(FeatureId.CREATE_AI_PROMPT);
  const [selectedTone, setSelectedTone] = useState<ToneId>(ToneId.FRIENDLY);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  const resultRef = useRef<HTMLDivElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        const base64Content = base64String.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = error => reject(error);
    });
  };

  const performAnalysis = async (feature: FeatureId) => {
    setIsLoading(true);
    setResult(null);

    try {
      let fileData: string | null = null;
      let mimeType: string | null = null;

      if (inputMode === InputMode.FILE && file) {
        if (file.size > 1024 * 1024 * 1024) { 
            alert("File quá lớn. Vui lòng sử dụng file dưới 1GB để đảm bảo hiệu suất.");
            setIsLoading(false);
            return;
        }
        fileData = await fileToBase64(file);
        mimeType = file.type;
      }

      const featureToUse = feature || selectedFeature;

      const analysisData = await analyzeVideo(
        fileData,
        mimeType,
        inputMode === InputMode.LINK ? url : '',
        featureToUse,
        selectedTone,
        customPrompt
      );

      setResult(analysisData);
      
      setTimeout(() => {
        if (window.innerWidth < 1024 && resultRef.current) {
            resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

    } catch (error: any) {
      console.error("Analysis failed:", error);
      let msg = "Có lỗi xảy ra khi phân tích video.";
      if (error.message) msg += `\nChi tiết: ${error.message}`;
      alert(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = () => {
    performAnalysis(selectedFeature);
  };

  const handleQuickAction = (featureId: FeatureId) => {
    setSelectedFeature(featureId);
    setTimeout(() => {
        performAnalysis(featureId);
    }, 100);
  };

  const handleReset = () => {
    setResult(null);
    setFile(null);
    setUrl('');
    setCustomPrompt('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-bg min-h-screen text-slate-200 selection:bg-primary/30 selection:text-white flex flex-col lg:h-screen lg:overflow-hidden">
      
      <header className="shrink-0 flex items-center justify-between p-4 lg:px-6 lg:py-4 border-b border-white/5 bg-background/50 backdrop-blur-md z-30 sticky top-0 lg:relative">
          <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 text-white">
                      <path d="M13.5 2L3.5 12h7l-1 10 10-10h-7l1-10z" />
                  </svg>
              </div>
              <div>
                  <h1 className="text-lg font-bold text-white tracking-tight leading-none">
                      Viral Video MKT
                  </h1>
                  <p className="text-slate-400 text-xs font-medium mt-1">Video Intelligence Platform</p>
              </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-white/5 rounded-full border border-white/5">
              <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs font-medium text-slate-300">System Ready</span>
              </div>
          </div>
      </header>

      <div className="flex-1 lg:overflow-hidden">
          <div className="max-w-[1600px] mx-auto h-auto lg:h-full grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-8 p-0 lg:p-6">
            
            <div className={`
                lg:col-span-5 p-4 lg:p-0
                lg:h-full lg:overflow-y-auto custom-scrollbar
                block
            `}>
              <InputSection 
                inputMode={inputMode}
                setInputMode={setInputMode}
                url={url}
                setUrl={setUrl}
                file={file}
                setFile={setFile}
                selectedFeature={selectedFeature}
                setSelectedFeature={setSelectedFeature}
                selectedTone={selectedTone}
                setSelectedTone={setSelectedTone}
                customPrompt={customPrompt}
                setCustomPrompt={setCustomPrompt}
                onAnalyze={handleAnalyze}
                isLoading={isLoading}
              />
            </div>

            <div 
                ref={resultRef}
                className={`
                lg:col-span-7 p-4 lg:p-0
                lg:h-full lg:flex lg:flex-col
                ${!result ? 'hidden lg:flex' : 'flex'}
            `}>
              <ResultSection 
                inputMode={inputMode}
                file={file}
                url={url}
                result={result}
                isLoading={isLoading}
                selectedFeature={selectedFeature}
                selectedTone={selectedTone}
                onQuickAction={handleQuickAction}
                onReset={handleReset}
              />
            </div>

          </div>
      </div>
    </div>
  );
}
