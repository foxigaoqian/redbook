'use client';

import { Key, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  onOpenApiKey: () => void;
  hasKey: boolean;
}

export default function Header({ onOpenApiKey, hasKey }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-gray-900 tracking-tight">AI 小红书笔记复刻器</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">XHS Note Replicator</p>
          </div>
        </div>

        <button
          onClick={onOpenApiKey}
          className={`px-6 py-2.5 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg ${
            hasKey 
              ? 'bg-green-50 text-green-600 border border-green-100 hover:bg-green-100' 
              : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
          }`}
        >
          <Key className="w-4 h-4" />
          {hasKey ? 'API Key 已配置' : '输入 API Key'}
        </button>
      </div>
    </header>
  );
}
