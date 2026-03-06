'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ApiKeyModal from '@/components/ApiKeyModal';
import NoteInput from '@/components/NoteInput';
import NotePreview from '@/components/NotePreview';
import ReplicationSettings from '@/components/ReplicationSettings';
import VariantCard from '@/components/VariantCard';
import { XhsNote, fetchXhsNote } from '@/lib/xhs-mock';
import { GenerationSettings, Variant, generateVariants, extractNoteFromUrl } from '@/lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [originalNote, setOriginalNote] = useState<XhsNote | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [genError, setGenError] = useState<string | null>(null);

  // Load API Key and Base URL from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    // Hardcode the Base URL here
    const hardcodedBaseUrl = "https://aigc.dianlichina.com.cn";
    
    if (savedKey) {
      setApiKey(savedKey);
    }
    
    // Always use the hardcoded URL
    setBaseUrl(hardcodedBaseUrl);
    
    if (!savedKey) {
      setIsApiKeyModalOpen(true);
    }
  }, []);

  const handleSaveApiKey = (key: string, _url: string) => {
    setApiKey(key);
    // Keep the hardcoded URL
    const hardcodedBaseUrl = "https://api.g4f.icu";
    setBaseUrl(hardcodedBaseUrl);
    localStorage.setItem('gemini_api_key', key);
    // No longer save base URL to local storage
  };

  const handleFetchNote = async (url: string) => {
    setIsFetching(true);
    setFetchError(null);
    setOriginalNote(null);
    setVariants([]);
    try {
      // 1. Try direct scrape first (fastest)
      console.log('Attempting direct scrape for:', url);
      const note = await fetchXhsNote(url);
      console.log('Scraped note successfully:', note.title);
      setOriginalNote(note);
    } catch (err: any) {
      console.warn('Direct scrape failed, trying AI extraction:', err.message);
      
      // 2. Fallback to AI extraction if API key is available
      if (apiKey) {
        try {
          const aiNote = await extractNoteFromUrl(url, apiKey, baseUrl);
          if (aiNote && aiNote.title && aiNote.content) {
            console.log('AI extracted note successfully:', aiNote.title);
            setOriginalNote(aiNote);
          } else {
            throw new Error('AI 提取内容不完整');
          }
        } catch (aiErr: any) {
          console.error('AI extraction failed:', aiErr);
          setFetchError(`抓取失败: ${err.message}。AI 提取也失败了: ${aiErr.message}`);
        }
      } else {
        setFetchError(`${err.message}。建议配置 API Key 以启用 AI 强力抓取模式。`);
      }
    } finally {
      setIsFetching(false);
    }
  };

  const handleGenerate = async (settings: GenerationSettings) => {
    if (!apiKey) {
      setIsApiKeyModalOpen(true);
      return;
    }
    if (!originalNote) return;

    setIsGenerating(true);
    setGenError(null);
    try {
      const results = await generateVariants(originalNote, settings, apiKey, baseUrl);
      setVariants(results);
      // Scroll to results
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      console.error(err);
      setGenError(err.message || '生成失败，请检查 API Key 或重试');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-gray-900 pb-20">
      <Header 
        onOpenApiKey={() => setIsApiKeyModalOpen(true)} 
        hasKey={!!apiKey} 
      />

      <div className="pt-32 px-6 max-w-7xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-full text-xs font-black uppercase tracking-widest border border-red-100"
          >
            <Sparkles className="w-4 h-4" />
            AI Content Replicator
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-black text-gray-900 tracking-tight"
          >
            复刻爆款笔记，<span className="text-red-500">一键生成</span>矩阵内容
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-500 max-w-2xl mx-auto font-medium"
          >
            输入小红书链接，AI 自动分析并生成多个不同风格的复刻版本，助你高效创作。
          </motion.p>
        </div>

        {/* Input Section */}
        <NoteInput 
          onFetch={handleFetchNote} 
          isLoading={isFetching} 
          error={fetchError} 
        />

        <AnimatePresence mode="wait">
          {originalNote && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="space-y-12"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <NotePreview note={originalNote} />
                <ReplicationSettings 
                  onGenerate={handleGenerate} 
                  isLoading={isGenerating} 
                />
              </div>

              {/* Error Message for Generation */}
              {genError && (
                <div className="max-w-3xl mx-auto p-6 bg-red-50 border-2 border-red-100 rounded-3xl flex items-center gap-4 text-red-600">
                  <AlertCircle className="w-8 h-8 shrink-0" />
                  <div>
                    <h4 className="font-bold text-lg">生成出错了</h4>
                    <p className="text-sm opacity-80">{genError}</p>
                    <button 
                      onClick={() => setIsApiKeyModalOpen(true)}
                      className="mt-2 text-xs font-black underline uppercase tracking-widest"
                    >
                      检查 API Key
                    </button>
                  </div>
                </div>
              )}

              {/* Results Section */}
              {variants.length > 0 && (
                <div id="results" className="space-y-8 pt-12 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500 rounded-xl">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-2xl font-black text-gray-900">复刻结果 ({variants.length})</h2>
                    </div>
                    <button 
                      onClick={() => setVariants([])}
                      className="text-sm font-bold text-gray-400 hover:text-red-500 transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      清空结果
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {variants.map((v, i) => (
                      <VariantCard key={i} variant={v} index={i} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ApiKeyModal 
        key={`${isApiKeyModalOpen}-${apiKey}-${baseUrl}`}
        isOpen={isApiKeyModalOpen} 
        onClose={() => setIsApiKeyModalOpen(false)} 
        onSave={handleSaveApiKey}
        currentKey={apiKey}
        currentBaseUrl={baseUrl}
      />
    </main>
  );
}
