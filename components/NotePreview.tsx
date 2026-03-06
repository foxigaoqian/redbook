'use client';

import { XhsNote } from '@/lib/xhs-mock';
import { motion } from 'motion/react';
import Image from 'next/image';
import { Heart, MessageCircle, Star, Share2, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface NotePreviewProps {
  note: XhsNote;
}

export default function NotePreview({ note }: NotePreviewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const width = scrollRef.current.offsetWidth;
      const index = Math.round(scrollLeft / width);
      setActiveIndex(index);
    }
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
    >
      <div className="p-6 border-b border-gray-50 flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 border border-gray-200">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">原笔记预览</h3>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Original Content</p>
        </div>
      </div>

      <div className="p-0 space-y-0">
        {/* Images Horizontal Scroll */}
        <div className="relative group">
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide touch-pan-x"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {note.images.map((img, idx) => (
              <div 
                key={idx} 
                className="relative flex-none w-full aspect-[3/4] bg-gray-50 snap-center"
              >
                <Image
                  src={img}
                  alt={`XHS Image ${idx}`}
                  fill
                  className="object-cover pointer-events-none"
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
          </div>
          
          {/* Navigation Arrows */}
          {note.images.length > 1 && (
            <>
              <button 
                onClick={() => scrollTo(Math.max(0, activeIndex - 1))}
                className={`absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg text-gray-900 transition-all z-10 ${activeIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => scrollTo(Math.min(note.images.length - 1, activeIndex + 1))}
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg text-gray-900 transition-all z-10 ${activeIndex === note.images.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Pagination Dots */}
          {note.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-2 py-1 bg-black/20 backdrop-blur-md rounded-full z-10">
              {note.images.map((_, idx) => (
                <button 
                  key={idx} 
                  onClick={() => scrollTo(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${idx === activeIndex ? 'bg-white scale-125' : 'bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <h1 className="text-xl font-black text-gray-900 leading-tight">
            {note.title}
          </h1>
          <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">
            {note.content}
          </div>
          <div className="flex flex-wrap gap-2">
            {note.tags.map((tag, idx) => (
              <span key={idx} className="text-blue-500 text-sm font-medium hover:underline cursor-pointer">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Mock Interactions */}
        <div className="px-6 pb-6 pt-4 border-t border-gray-50 flex items-center justify-between text-gray-400">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 hover:text-red-500 transition-colors cursor-pointer">
              <Heart className="w-5 h-5" />
              <span className="text-xs font-bold">赞</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-blue-500 transition-colors cursor-pointer">
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs font-bold">评论</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-yellow-500 transition-colors cursor-pointer">
              <Star className="w-5 h-5" />
              <span className="text-xs font-bold">收藏</span>
            </div>
          </div>
          <Share2 className="w-5 h-5 hover:text-gray-600 cursor-pointer" />
        </div>
      </div>
    </motion.div>
  );
}
