'use client';

import { useState } from 'react';
import { X, Key, Save, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string, baseUrl: string) => void;
  currentKey: string;
  currentBaseUrl: string;
}

export default function ApiKeyModal({ isOpen, onClose, onSave, currentKey, currentBaseUrl }: ApiKeyModalProps) {
  const [key, setKey] = useState(currentKey);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    // Keep the existing baseUrl if any, just update the key
    onSave(key, currentBaseUrl);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-50 rounded-xl">
                  <Key className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">配置 API Key</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500 leading-relaxed">
                请输入你的 API Key。该 Key 将保存在本地浏览器中，仅用于调用模型生成内容。
              </p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="w-3 h-3" />
                    API Key
                  </label>
                  <input
                    type="password"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="在此粘贴你的 API Key..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all font-mono text-sm"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleSave}
                  disabled={!key || isSaved}
                  className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                    isSaved 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 hover:bg-red-600 text-white active:scale-95'
                  }`}
                >
                  {isSaved ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      已保存
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      保存配置
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
