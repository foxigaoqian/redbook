'use client';

import { useState } from 'react';
import { Settings2, Image as ImageIcon, Copy, Layers, Sparkles, Check, Target, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { GenerationSettings } from '@/lib/gemini';

interface ReplicationSettingsProps {
  onGenerate: (settings: GenerationSettings) => void;
  isLoading: boolean;
}

const STYLES = [
  { id: '亲和交流', label: '亲和交流', icon: '😊' },
  { id: '干货知识', label: '干货知识', icon: '📚' },
  { id: '故事叙述', label: '故事叙述', icon: '📖' },
  { id: '标题爆款强化', label: '爆款强化', icon: '🔥' },
  { id: '数据分析式', label: '数据分析', icon: '📊' },
];

const GOALS = [
  { id: 'growth', label: '引流涨粉', icon: '📈' },
  { id: 'sales', label: '种草带货', icon: '🛍️' },
  { id: 'info', label: '知识干货', icon: '💡' },
];

export default function ReplicationSettings({ onGenerate, isLoading }: ReplicationSettingsProps) {
  const [includeImages, setIncludeImages] = useState(false);
  const [variants, setVariants] = useState(3);
  const [selectedStyles, setSelectedStyles] = useState<string[]>(['亲和交流']);
  const [creativityLevel, setCreativityLevel] = useState(0.5);
  const [goal, setGoal] = useState('growth');

  const toggleStyle = (style: string) => {
    setSelectedStyles(prev => 
      prev.includes(style) 
        ? prev.filter(s => s !== style) 
        : [...prev, style]
    );
  };

  const handleIncludeImagesChange = (include: boolean) => {
    setIncludeImages(include);
    if (include) {
      setVariants(1); // Force to 1 when images are included
    }
  };

  const handleGenerate = () => {
    onGenerate({
      includeImages,
      variants: includeImages ? 1 : variants,
      styles: selectedStyles.length > 0 ? selectedStyles : ['亲和交流'],
      creativityLevel,
      goal,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 p-8 space-y-8"
    >
      <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
        <div className="p-2 bg-red-50 rounded-xl">
          <Settings2 className="w-5 h-5 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">复刻设置</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left Column: Type & Count */}
        <div className="space-y-8">
          <div className="space-y-4">
            <label className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Copy className="w-4 h-4" />
              复刻内容类型
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleIncludeImagesChange(false)}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                  !includeImages ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-100 hover:border-gray-200 text-gray-400'
                }`}
              >
                <Copy className="w-6 h-6" />
                <span className="text-sm font-bold">仅复刻文案</span>
              </button>
              <button
                onClick={() => handleIncludeImagesChange(true)}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                  includeImages ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-100 hover:border-gray-200 text-gray-400'
                }`}
              >
                <ImageIcon className="w-6 h-6" />
                <span className="text-sm font-bold">文案 + 原图去重</span>
              </button>
            </div>
          </div>

          <div className={`space-y-4 transition-opacity ${includeImages ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-4 h-4" />
                生成版本数量 ({includeImages ? 1 : variants})
              </label>
              {includeImages && <span className="text-[10px] text-red-500 font-bold">图文模式仅支持单版</span>}
            </div>
            <div className="flex items-center gap-3">
              {[1, 3, 5, 10].map(num => (
                <button
                  key={num}
                  onClick={() => !includeImages && setVariants(num)}
                  disabled={includeImages}
                  className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${
                    (includeImages ? 1 : variants) === num ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-100 hover:border-gray-200 text-gray-400'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Target className="w-4 h-4" />
              创作目标
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GOALS.map(g => (
                <button
                  key={g.id}
                  onClick={() => setGoal(g.id)}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                    goal === g.id ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-100 hover:border-gray-200 text-gray-400'
                  }`}
                >
                  <span className="text-lg">{g.icon}</span>
                  <span className="text-[10px] font-black">{g.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4" />
                创作自由度
              </label>
              <span className="text-xs font-black text-red-500">
                {creativityLevel < 0.3 ? '保守' : creativityLevel > 0.7 ? '激进' : '平衡'}
              </span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              value={creativityLevel}
              onChange={(e) => setCreativityLevel(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-bold px-1">
              <span>还原原笔记</span>
              <span>完全原创</span>
            </div>
          </div>
        </div>

        {/* Right Column: Styles */}
        <div className="space-y-4">
          <label className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            生成风格 (可多选)
          </label>
          <div className="grid grid-cols-1 gap-2">
            {STYLES.map(style => (
              <button
                key={style.id}
                onClick={() => toggleStyle(style.id)}
                className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                  selectedStyles.includes(style.id) 
                    ? 'border-red-500 bg-red-50 text-red-600' 
                    : 'border-gray-100 hover:border-gray-200 text-gray-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{style.icon}</span>
                  <span className="font-bold">{style.label}</span>
                </div>
                {selectedStyles.includes(style.id) && <Check className="w-5 h-5" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-50">
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full py-5 bg-red-500 hover:bg-red-600 disabled:bg-gray-200 text-white rounded-3xl font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl shadow-red-500/30"
        >
          {isLoading ? (
            <>
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              正在复刻中...
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6" />
              生成复刻内容
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
