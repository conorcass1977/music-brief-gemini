'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, FileText, CheckCircle, AlertCircle, ArrowRight, Sparkles, Edit3, Download, Save, X } from 'lucide-react';

export default function MusicBriefAnalyzer() {
  const [step, setStep] = useState('input');
  const [briefText, setBriefText] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [refinedBrief, setRefinedBrief] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const briefContentRef = useRef<HTMLDivElement>(null);

  const analyzeBrief = async () => {
    setStep('analyzing');
    
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: `You are an expert music supervisor analyzing a music brief. 

Score this brief out of 10 using this framework:

ESSENTIAL (6 points possible):
- Clear emotional direction (2 pts) - How should viewer feel?
- Visual/narrative context (2 pts) - What's happening on screen?
- Music's role (2 pts) - Hero or supportive? Under VO?

STRONG (3 points possible):
- Specific musical characteristics (1 pt) - Tempo, instrumentation, vocals
- Reference tracks with context (1 pt) - Not just "I like this" but WHY
- Practical details (1 pt) - Stems needed? Multiple cuts? Budget range?

EXCELLENT (1 point possible):
- Target audience insights (0.5 pts)
- Cultural/sonic strategy (0.5 pts)

Analyze this brief and return a JSON object with this structure:
{
  "score": <number out of 10>,
  "strengths": ["strength 1", "strength 2"],
  "gaps": ["gap 1", "gap 2", "gap 3"],
  "questions": [
    {"question": "...", "context": "why we're asking", "category": "emotional|musical|practical|audience"},
    ...3-5 questions total
  ]
}

Brief to analyze:
${briefText}

Return ONLY the JSON object, no other text.`
            }
          ]
        })
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('API Error:', data.error);
        throw new Error(data.error);
      }
      
      if (!data.content || !data.content[0] || !data.content[0].text) {
        console.error('Unexpected API response:', data);
        throw new Error('Invalid response from API');
      }
      
      const content = data.content[0].text;
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const analysisData = JSON.parse(cleanContent);
      
      setAnalysis(analysisData);
      setStep('analysis');
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error analyzing brief: ${errorMessage}\n\nPlease try with a shorter brief or simpler language.`);
      setStep('input');
    }
  };

  const handleAnswer = (answer: string) => {
    const questionKey = `q${currentQuestion}`;
    setAnswers({ ...answers, [questionKey]: answer });
    
    if (currentQuestion < analysis.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      generateRefinedBrief();
    }
  };

  const generateRefinedBrief = async () => {
    setStep('generating');
    
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: `You are an expert music supervisor. Create a refined, professional music brief.

Original brief:
${briefText}

Questions asked and answers:
${analysis.questions.map((q: any, i: number) => `Q: ${q.question}\nA: ${answers[`q${i}`]}`).join('\n\n')}

Create a refined brief in this style (use clear sections, be specific, include all relevant details):

# Music Brief: [Project Name]

## Project Context
[What's happening visually/narratively]

## Emotional Direction
[How should the viewer feel? What's the emotional journey?]

## Musical Characteristics
- Tempo: [BPM range or descriptive]
- Instrumentation: [Specific instruments or sound palette]
- Vocals: [Male/Female/None/Instrumental]
- Genre/Style: [Specific but not limiting]

## Reference Tracks
[Track name - Artist]
- Why this reference: [What specifically do you like?]

## Practical Requirements
- Duration: [Length needed]
- Role of music: [Hero/supportive, under VO, etc.]
- Stems needed: [Yes/No]
- Other technical needs: [Any special requirements]

## Target Audience
[Who are we reaching and why does it matter?]

## Additional Context
[Budget range, territory, usage rights, deadlines, etc.]

Write the brief in a professional, clear tone. Be specific but not restrictive. Give the music supervisor enough to work with while leaving room for creative interpretation.`
            }
          ]
        })
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('API Error:', data.error);
        throw new Error(data.error);
      }
      
      if (!data.content || !data.content[0] || !data.content[0].text) {
        console.error('Unexpected API response:', data);
        throw new Error('Invalid response from API');
      }
      
      const brief = data.content[0].text;
      setRefinedBrief(brief);
      setStep('output');
    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error generating brief: ${errorMessage}\n\nPlease try with shorter answers.`);
      setStep('questions');
      setCurrentQuestion(analysis.questions.length - 1);
    }
  };

  const convertMarkdownToHTML = (markdown: string) => {
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br />');
  };

  // Update the ref content when entering edit mode
  useEffect(() => {
    if (isEditing && briefContentRef.current) {
      briefContentRef.current.innerHTML = convertMarkdownToHTML(refinedBrief);
    }
  }, [isEditing, refinedBrief]);

  const handleSaveEdit = () => {
    if (briefContentRef.current) {
      // Save the HTML content, not just innerText
      const htmlContent = briefContentRef.current.innerHTML;
      
      // Convert HTML back to markdown-like format for storage
      let markdownContent = htmlContent
        .replace(/<h1>(.*?)<\/h1>/g, '# $1')
        .replace(/<h2>(.*?)<\/h2>/g, '\n## $1')
        .replace(/<h3>(.*?)<\/h3>/g, '\n### $1')
        .replace(/<li>(.*?)<\/li>/g, '- $1\n')
        .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
        .replace(/<\/p><p>/g, '\n\n')
        .replace(/<p>|<\/p>/g, '')
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/<[^>]*>/g, ''); // Remove any remaining HTML tags
      
      setRefinedBrief(markdownContent);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const startOver = () => {
    setStep('input');
    setBriefText('');
    setAnalysis(null);
    setCurrentQuestion(0);
    setAnswers({});
    setRefinedBrief('');
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iIzFmMjkzNyIgc3Ryb2tlLXdpZHRoPSIuNSIgb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-30"></div>
      
      <div className="max-w-5xl mx-auto relative">
        
        {/* Header */}
        <div className="text-center mb-12 print:mb-6">
          <div className="inline-flex items-center gap-2 mb-4 print:hidden">
            <Sparkles className="w-8 h-8 text-orange-500" />
            <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
              Music Brief Analyzer
            </h1>
          </div>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto print:hidden">
            Powered by Google Gemini AI
          </p>
        </div>

        {/* Input Step */}
        {step === 'input' && (
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl p-8 sm:p-10 border border-white/20">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white">Let's get started - paste your music brief</h2>
            </div>
            
            <textarea
              className="w-full h-72 p-5 bg-slate-800/50 border-2 border-slate-700/50 rounded-xl focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-white text-base resize-none transition-all duration-200"
              placeholder="Paste your existing music brief here, or describe your project and what kind of music you're looking for..."
              value={briefText}
              onChange={(e) => setBriefText(e.target.value)}
            />
            
            <button
              onClick={analyzeBrief}
              disabled={briefText.trim().length < 50}
              className="mt-6 w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white py-4 rounded-xl font-bold text-lg hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-orange-500/50 flex items-center justify-center gap-3"
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

        {/* Analyzing Step */}
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

        {/* Analysis Results Step */}
        {step === 'analysis' && analysis && (
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl p-8 sm:p-10 border border-white/20">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-white">Brief Quality Score</h2>
                <div className="relative">
                  <div className="text-6xl font-bold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                    {analysis.score}/10
                  </div>
                  {analysis.score >= 7 && (
                    <div className="absolute -top-2 -right-2">
                      <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="w-full bg-slate-700/50 rounded-full h-4 backdrop-blur-sm">
                <div
                  className="bg-gradient-to-r from-orange-500 to-orange-600 h-4 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-orange-500/50"
                  style={{ width: `${(analysis.score / 10) * 100}%` }}
                />
              </div>
            </div>

            {/* Strengths */}
            {analysis.strengths.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-400/20 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="font-bold text-xl text-white">What's Working</h3>
                </div>
                <ul className="space-y-3">
                  {analysis.strengths.map((strength: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-slate-200 bg-green-400/5 p-4 rounded-lg backdrop-blur-sm border border-green-400/20">
                      <span className="text-green-400 mt-0.5 text-xl">✓</span>
                      <span className="text-base">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gaps */}
            {analysis.gaps.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-400/20 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-orange-400" />
                  </div>
                  <h3 className="font-bold text-xl text-white">What's Missing</h3>
                </div>
                <ul className="space-y-3">
                  {analysis.gaps.map((gap: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-slate-200 bg-orange-400/5 p-4 rounded-lg backdrop-blur-sm border border-orange-400/20">
                      <span className="text-orange-400 mt-0.5 text-xl">⚠</span>
                      <span className="text-base">{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-xl p-6 mb-8 border border-orange-500/30 backdrop-blur-sm">
              <p className="text-slate-100 text-lg">
                <strong className="text-orange-400">Let's level up your brief!</strong> I'll ask {analysis.questions.length} targeted questions to fill in the gaps.
              </p>
            </div>

            <button
              onClick={() => setStep('questions')}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white py-4 rounded-xl font-bold text-lg hover:from-orange-500 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-orange-500/50 flex items-center justify-center gap-3"
            >
              Start Questions <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Questions Step */}
        {step === 'questions' && analysis && (
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl p-8 sm:p-10 border border-white/20">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-bold text-white">
                  Question {currentQuestion + 1} of {analysis.questions.length}
                </h2>
                <span className="text-sm font-semibold text-orange-500 bg-orange-500/20 px-4 py-2 rounded-full">
                  {analysis.questions[currentQuestion].category}
                </span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-3 backdrop-blur-sm">
                <div
                  className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500 ease-out shadow-lg shadow-orange-500/50"
                  style={{ width: `${((currentQuestion + 1) / analysis.questions.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-4 text-white">
                {analysis.questions[currentQuestion].question}
              </h3>
              <p className="text-slate-300 text-base mb-6 bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                {analysis.questions[currentQuestion].context}
              </p>
              
              <textarea
                className="w-full h-40 p-5 bg-slate-800/50 border-2 border-slate-700/50 rounded-xl focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-white text-base resize-none transition-all duration-200"
                placeholder="Your answer..."
                value={answers[`q${currentQuestion}`] || ''}
                onChange={(e) => setAnswers({ ...answers, [`q${currentQuestion}`]: e.target.value })}
                autoFocus
              />
            </div>

            <button
              onClick={() => handleAnswer(answers[`q${currentQuestion}`] || '')}
              disabled={!answers[`q${currentQuestion}`]?.trim()}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white py-4 rounded-xl font-bold text-lg hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-orange-500/50 flex items-center justify-center gap-3"
            >
              {currentQuestion < analysis.questions.length - 1 ? 'Next Question' : 'Generate Refined Brief'}
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Generating Step */}
        {step === 'generating' && (
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl p-12 border border-white/20 text-center">
            <div className="animate-pulse">
              <div className="relative inline-block">
                <FileText className="w-20 h-20 text-orange-500 mx-auto mb-6" />
                <div className="absolute inset-0 bg-orange-500 blur-xl opacity-50 animate-ping"></div>
              </div>
              <h2 className="text-3xl font-bold mb-3 text-white">Crafting your refined brief...</h2>
              <p className="text-xl text-slate-300">Combining your answers into a professional format</p>
            </div>
          </div>
        )}

        {/* Output Step */}
        {step === 'output' && refinedBrief && (
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl p-8 sm:p-10 border border-white/20 print:border-0 print:shadow-none print:bg-transparent">
            <div className="flex items-center justify-between mb-8 print:mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-400/20 rounded-xl print:hidden">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-3xl font-bold text-white print:text-gray-900">
                  {isEditing ? 'Editing Your Brief' : 'Your Refined Brief'}
                </h2>
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-orange-400 bg-clip-text text-transparent print:hidden">
                ~9/10
              </div>
            </div>

            {/* Brief Content */}
            {isEditing ? (
              <div
                ref={briefContentRef}
                contentEditable={true}
                suppressContentEditableWarning
                className="bg-gray-100 rounded-xl p-8 mb-8 border-2 border-orange-500 shadow-lg backdrop-blur-sm prose prose-gray max-w-none focus:outline-none"
                style={{
                  color: '#363636'
                }}
              />
            ) : (
              <div
                className="bg-gray-100 rounded-xl p-8 mb-8 border border-gray-300 backdrop-blur-sm print:bg-white print:border-0 prose prose-gray max-w-none"
                style={{
                  color: '#363636'
                }}
                dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(refinedBrief) }}
              />
            )}
            
            {/* Action Buttons */}
            <div className="print:hidden">
              {isEditing ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-400 hover:to-green-500 transition-all duration-200 shadow-lg hover:shadow-green-500/50 flex items-center justify-center gap-3"
                  >
                    <Save className="w-5 h-5" />
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 bg-slate-700/50 border-2 border-slate-600/50 text-slate-100 py-4 rounded-xl font-bold text-lg hover:bg-slate-600/50 transition-all duration-200 flex items-center justify-center gap-3"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(refinedBrief);
                      alert('Brief copied to clipboard!');
                    }}
                    className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 text-white py-4 rounded-xl font-bold text-lg hover:from-orange-500 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-orange-500/50 flex items-center justify-center gap-3"
                  >
                    Copy to Clipboard
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 bg-slate-700/50 border-2 border-slate-600/50 text-slate-100 py-4 rounded-xl font-bold text-lg hover:bg-slate-600/50 transition-all duration-200 flex items-center justify-center gap-3"
                  >
                    <Edit3 className="w-5 h-5" />
                    Edit Brief
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-400 hover:to-blue-500 transition-all duration-200 shadow-lg hover:shadow-blue-500/50 flex items-center justify-center gap-3"
                  >
                    <Download className="w-5 h-5" />
                    Download PDF
                  </button>
                </div>
              )}

              {/* Start Over Button */}
              {!isEditing && (
                <button
                  onClick={startOver}
                  className="mt-4 w-full bg-slate-700/30 border border-slate-600/30 text-slate-300 py-3 rounded-xl font-semibold text-base hover:bg-slate-600/40 transition-all duration-200"
                >
                  Analyze Another Brief
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Print/PDF Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          
          .prose h1 {
            color: #1a1a1a !important;
            page-break-after: avoid;
          }
          
          .prose h2 {
            color: #2a2a2a !important;
            page-break-after: avoid;
            margin-top: 1.5em;
          }
          
          .prose h3 {
            color: #3a3a3a !important;
            page-break-after: avoid;
          }
          
          .prose p, .prose li {
            color: #1a1a1a !important;
          }
          
          .prose strong {
            color: #000 !important;
          }
        }
        
        .prose h1 {
          color: #1a1a1a;
          font-size: 2.25em;
          font-weight: 700;
          margin-top: 0;
          margin-bottom: 0.5em;
          line-height: 1.2;
        }
        
        .prose h2 {
          color: #2a2a2a;
          font-size: 1.75em;
          font-weight: 700;
          margin-top: 1.5em;
          margin-bottom: 0.75em;
          line-height: 1.3;
        }
        
        .prose h3 {
          color: #363636;
          font-size: 1.35em;
          font-weight: 600;
          margin-top: 1.25em;
          margin-bottom: 0.5em;
        }
        
        .prose p {
          color: #363636;
          margin-bottom: 1.25em;
          line-height: 1.7;
        }
        
        .prose ul, .prose ol {
          margin-left: 1.75em;
          margin-bottom: 1.25em;
          line-height: 1.7;
        }
        
        .prose li {
          color: #363636;
          margin-bottom: 0.5em;
        }
        
        .prose strong {
          color: #1a1a1a;
          font-weight: 600;
        }

        [contenteditable="true"]:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
}
