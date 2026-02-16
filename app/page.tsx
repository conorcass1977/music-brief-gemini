'use client';

import React, { useState } from 'react';
import { MessageCircle, ArrowRight, Sparkles } from 'lucide-react';

export default function MusicBriefAnalyzer() {
  const [step, setStep] = useState('input');
  const [briefText, setBriefText] = useState('');

  const analyzeBrief = async () => {
    setStep('analyzing');
    alert('Analysis feature coming soon! Your brief: ' + briefText.substring(0, 50) + '...');
    setStep('input');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto relative">
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-orange-500" />
            <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
              Music Brief Analyzer
            </h1>
          </div>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Powered by Google Gemini AI
          </p>
        </div>

        {step === 'input' && (
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl p-8 sm:p-10 border border-white/20">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white">Let&apos;s get started - paste your music brief</h2>
            </div>
            
            <textarea
              className="w-full h-72 p-5 bg-slate-800/50 border-2 border-slate-700/50 rounded-xl focus:border-orange-500 focus:outline-none font-mono text-sm text-slate-100 placeholder-slate-500 transition-all duration-200 backdrop-blur-sm"
              placeholder="Paste your existing music brief here, or describe your project and what kind of music you're looking for..."
              value={briefText}
              onChange={(e) => setBriefText(e.target.value)}
            />
            
            <button
              onClick={analyzeBrief}
              disabled={briefText.trim().length < 50}
              className="mt-6 w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white py-4 rounded-xl font-bold text-lg hover:from-orange-500 hover:to-orange-600 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100"
            >
              Analyze My Brief <ArrowRight className="w-6 h-6" />
            </button>
            
            {briefText.trim().length < 50 && briefText.length > 0 && (
              <p className="text-sm text-slate-400 mt-3 text-center">
                Please enter at least 50 characters ({50 - briefText.trim().length} more needed)
              </p>
            )}
          </div>
        )}

        {step === 'analyzing' && (
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl p-12 border border-white/20 text-center">
            <div className="animate-pulse">
              <div className="relative inline-block">
                <MessageCircle className="w-20 h-20 text-orange-500 mx-auto mb-6" />
                <div className="absolute inset-0 bg-orange-500 blur-xl opacity-50 animate-ping"></div>
              </div>
              <h2 className="text-3xl font-bold mb-3 text-white">Analyzing your brief...</h2>
              <p className="text-xl text-slate-300">Looking for strengths and gaps</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
