'use client';

import { Variant } from '@/lib/gemini';
import { motion } from 'motion/react';
import Image from 'next/image';
import { Copy, Download, Check, Sparkles, Tag } from 'lucide-react';
import { useState, useRef } from 'react';

interface VariantCardProps {
  variant: Variant;
  index: number;
}

export default function VariantCard({ variant, index }: VariantCardProps) {
  const [copied, setCopied] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const width = scrollRef.current.offsetWidth;
      const idx = Math.round(scrollLeft / width);
      setActiveIndex(idx);
    }
  };

  const handleCopy = () => {
    const textToCopy = `${variant.text}\n\n${variant.tags.join(' ')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollTo = (index: number) => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({
        left: width * index,
        behavior: 'smooth'
      });
      setActiveIndex(index);
    }
  };

  const handleDownload = async (imgUrl: string, idx: number) => {
    try {
      // Fetch the image as a blob to force a local download instead of browser navigation
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `xhs-variant-${index + 1}-img-${idx + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL after a short delay
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error("Failed to download image directly, falling back to window.open", error);
      window.open(imgUrl, '_blank');
    }
  };

  const handleDownloadAll = () => {
    variant.images.forEach((img, idx) => {
      setTimeout(() => {
        handleDownload(img, idx);
      }, idx * 200);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col"
    >
      <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-red-500 rounded-lg">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-black text-gray-900">版本 {index + 1} — {variant.style}</span>
        </div>
        <div className="flex items-center gap-2">
          {variant.images.length > 0 && (
            <button
              onClick={handleDownloadAll}
              className="p-2 rounded-xl bg-white text-gray-500 hover:bg-gray-100 border border-gray-200 transition-all flex items-center gap-1.5 text-xs font-bold"
              title="下载所有图片"
            >
              <Download className="w-3.5 h-3.5" />
              下载全图
            </button>
          )}
          <button
            onClick={handleCopy}
            className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold ${
              copied ? 'bg-green-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? '已复制' : '复制文案'}
          </button>
        </div>
      </div>

      <div className="p-0 space-y-0 flex-1">
        {/* Generated Images Horizontal Scroll */}
        {variant.images.length > 0 && (
          <div className="relative group">
            <div 
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide touch-pan-x"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {variant.images.map((img, idx) => (
                <div key={idx} className="relative flex-none w-full aspect-[3/4] snap-center">
                  <Image
                    src={img}
                    alt={`Variant Image ${idx}`}
                    fill
                    className="object-cover pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={() => handleDownload(img, idx)}
                    className="absolute bottom-2 right-2 p-2 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-black/70 transition-all z-10"
                    title="下载此图片"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination Dots */}
            {variant.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 px-2 py-1 bg-black/20 backdrop-blur-md rounded-full z-10">
                {variant.images.map((_, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => scrollTo(idx)}
                    className={`w-1 h-1 rounded-full transition-all ${idx === activeIndex ? 'bg-white scale-125' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Text Content */}
        <div className="p-6 space-y-4">
          <div className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed font-medium">
            {variant.text}
          </div>
          
          <div className="flex flex-wrap gap-1.5 pt-2">
            {variant.tags.map((tag, idx) => (
              <div key={idx} className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-blue-500 rounded-full text-[10px] font-bold border border-gray-100">
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
