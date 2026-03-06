'use client';

import { useState } from 'react';
import { Search, Link as LinkIcon, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface NoteInputProps {
  onFetch: (url: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export default function NoteInput({ onFetch, isLoading, error }: NoteInputProps) {
  const [url, setUrl] = useState('');

  const extractUrl = (text: string): string => {
    // Regex to find URLs starting with http or https
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    
    if (matches && matches.length > 0) {
      // Return the first URL that looks like an XHS link
      const xhsUrl = matches.find(u => u.includes('xiaohongshu.com') || u.includes('xhslink.com'));
      return xhsUrl || matches[0];
    }
    return text.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = extractUrl(url);
    if (cleanUrl) {
      await onFetch(cleanUrl);
    }
  };

  const [showManual, setShowManual] = useState(false);
  const [manualContent, setManualContent] = useState('');

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualContent.trim()) {
      // Create a mock note from manual content
      const lines = manualContent.trim().split('\n');
      const title = lines[0].substring(0, 50);
      const content = manualContent.trim();
      const tags = content.match(/#[\w\u4e00-\u9fa5]+/g) || [];
      
      // We'll need to pass this to a parent handler that can set the original note
      // For now, let's assume onFetch can handle a special object or we add a new prop
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {!showManual ? (
        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors">
            <LinkIcon className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="在此粘贴小红书分享内容或链接..."
            className="w-full pl-14 pr-36 py-5 bg-white border-2 border-gray-100 rounded-3xl shadow-xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all text-lg font-medium placeholder:text-gray-300"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="px-8 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-200 text-white rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-500/20"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              抓取并预览
            </button>
          </div>
        </form>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-6 rounded-3xl shadow-xl border-2 border-red-100 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900">手动输入笔记内容</h3>
            <button onClick={() => setShowManual(false)} className="text-xs text-gray-400 hover:text-red-500">返回链接抓取</button>
          </div>
          <textarea
            value={manualContent}
            onChange={(e) => setManualContent(e.target.value)}
            placeholder="如果抓取失败，请直接在此粘贴笔记的正文内容..."
            className="w-full h-40 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none transition-all text-sm resize-none"
          />
          <button
            onClick={() => {
              const lines = manualContent.trim().split('\n');
              const title = lines[0].substring(0, 50);
              const tags = manualContent.match(/#[\w\u4e00-\u9fa5]+/g) || [];
              onFetch(JSON.stringify({ title, content: manualContent, tags, images: [] }));
            }}
            className="w-full py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all"
          >
            确认内容并复刻
          </button>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-sm font-medium"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
          {!showManual && (
            <button 
              onClick={() => setShowManual(true)}
              className="text-xs bg-white border border-red-200 px-3 py-1.5 rounded-lg self-start hover:bg-red-100 transition-colors"
            >
              抓取不到？尝试手动粘贴内容
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
