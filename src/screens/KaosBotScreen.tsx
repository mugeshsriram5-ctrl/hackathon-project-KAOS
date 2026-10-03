import React, { useState, useRef, useEffect } from 'react';
import { MasterSpot } from '../types';
import { KaosAppContext } from '../services/kaosContext';
import { motion } from 'framer-motion';
import { KaosAppIcon } from '../components/KaosAppIcon';

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Message {
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  actionableItem?: {
    type: 'spot' | 'quest' | 'screen';
    title: string;
    id?: string;
  };
  sources?: GroundingSource[];
  searchQueries?: string[];
}

interface KaosBotScreenProps {
  messages: Message[];
  onSendMessage: (text: string, context?: KaosAppContext) => void;
  loading: boolean;
  activeSpot: MasterSpot | null;
  activeQuest: any | null;
  appContext: KaosAppContext;
  onSpotSelected?: (spot: MasterSpot) => void;
  onShowToast: (msg: string) => void;
  onNavigateTab?: (tab: any) => void;
  onOpenNavRd?: () => void;
}

export const KaosBotScreen: React.FC<KaosBotScreenProps> = ({
  messages,
  onSendMessage,
  loading,
  activeSpot,
  activeQuest,
  appContext,
  onSpotSelected,
  onShowToast,
  onNavigateTab,
  onOpenNavRd,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onShowToast('Speech Recognition is not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsRecording(true);
        onShowToast('Listening... Speak your message now.');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition failed to start:', err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsRecording(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText, appContext);
    setInputText('');
  };

  // Context-aware suggestion chips based on what the user is currently looking at
  const suggestionChips = activeSpot
    ? [
        `Explain the architectural significance of ${activeSpot.title} 🏛️`,
        `What is the historical chronicle of ${activeSpot.title}? 📜`,
        `Suggest a walking trail starting from ${activeSpot.title} 🚶‍♂️`,
      ]
    : activeQuest
    ? [
        `How do I complete the quest "${activeQuest.title}"? 🎯`,
        `Give me historical hints for this active quest 💡`,
        `What nearby places relate to this quest? 📍`,
      ]
    : [
        "Live Metro navigation to Kapaleeshwarar Temple 🚇",
        "Latest archaeological R&D & excavations in Tamil Nadu 🔬",
        "Suggest a filter coffee walking trail in Triplicane ☕",
        "Opening hours, aarti timings, & monument entry fees today 🎫",
      ];

  const handleExportChat = () => {
    const timestamp = new Date().toLocaleString();
    let content = `=====================================================\n`;
    content += `   KAOS COMPANION AI LORE & TRANSCRIPT DOSSIER\n`;
    content += `=====================================================\n\n`;
    content += `Export Date: ${timestamp}\n`;
    content += `Focused Landmark: ${activeSpot ? activeSpot.title : 'General Expedition'}\n`;
    content += `Active Quest: ${activeQuest ? activeQuest.title : 'None'}\n`;
    content += `Total Messages: ${messages.length}\n\n`;
    content += `-----------------------------------------------------\n`;
    content += `   EXPEDITION CHAT TRANSCRIPT\n`;
    content += `-----------------------------------------------------\n\n`;

    if (messages.length === 0) {
      content += `[No message logs found]\n`;
    } else {
      messages.forEach((m) => {
        content += `[${m.timestamp}] ${m.sender === 'user' ? 'Explorer' : 'KAOS AI Core'}:\n`;
        content += `  ${m.text}\n`;
        if (m.actionableItem) {
          content += `  [ACTION: ${m.actionableItem.title} (${m.actionableItem.type.toUpperCase()})]\n`;
        }
        if (m.sources && m.sources.length > 0) {
          content += `  [GROUNDED SOURCES: ${m.sources.map((s) => s.title).join(', ')}]\n`;
        }
        content += `\n`;
      });
    }

    content += `-----------------------------------------------------\n`;
    content += `   FIELD LORE & ARCHAEOLOGICAL INSIGHTS\n`;
    content += `-----------------------------------------------------\n`;
    const botNotes = messages.filter((m) => m.sender === 'bot');
    if (botNotes.length > 0) {
      botNotes.forEach((m) => {
        const firstLine = m.text.split('\n')[0];
        if (firstLine) content += `• ${firstLine}\n`;
      });
    } else {
      content += `• Chennai Heritage Intel: Madras archives cataloged.\n`;
    }

    content += `\n=====================================================\n`;
    content += `Generated by KAOS Heritage Protocol · Chennai Explorer\n`;
    content += `=====================================================\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `KAOS_Bot_Transcript_${new Date().toISOString().slice(0, 10)}.txt`;
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onShowToast(`Exported "${filename}" successfully!`);
  };

  return (
    <div className="pb-24 p-3 md:p-8 max-w-6xl mx-auto h-[calc(100vh-120px)] flex flex-col font-sans select-none">
      {/* Upper Title banner with Active Context HUD */}
      <div className="bg-[#1C1A1F] border border-[#26242C] rounded-3xl p-5 md:p-6 shadow-2xl mb-4 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <KaosAppIcon size={32} />
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">KAOS AI Companion</h2>

            {/* Context-Aware Gemini AI Badge with Search Grounding */}
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
              <span>Gemini 3.5 • Search Grounded</span>
            </span>
          </div>

          <p className="text-xs text-zinc-400 mt-1">
            Real-time transit navigation, live metro routes, opening timings, and archaeological R&D with Google Search
          </p>
        </div>

        {/* Action Buttons: Navigation & R&D Radar & Export */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportChat}
            className="px-3.5 py-2 rounded-xl bg-surface-secondary hover:bg-kaos-teal/20 text-kaos-offwhite hover:text-kaos-teal border border-progress-track hover:border-kaos-teal/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Export conversation and lore summary to text file"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export Chat</span>
          </button>

          {onOpenNavRd && (
            <button
              onClick={onOpenNavRd}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-kaos-pink/20 to-kaos-purple/20 hover:from-kaos-pink/30 hover:to-kaos-purple/30 border border-kaos-pink/40 text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm text-kaos-pink">travel_explore</span>
              <span>Navigation & R&D Radar</span>
            </button>
          )}
          {activeSpot ? (
            <div className="flex items-center gap-2 bg-[#121114] border border-[#F05423]/50 px-3 py-1.5 rounded-xl text-xs shadow-md">
              <span className="text-[#F05423] font-mono text-[10px] uppercase font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">location_on</span>
                Focused Landmark:
              </span>
              <span className="text-white font-bold truncate max-w-[180px]">{activeSpot.title}</span>
            </div>
          ) : activeQuest ? (
            <div className="flex items-center gap-2 bg-[#121114] border border-cyan-500/50 px-3 py-1.5 rounded-xl text-xs shadow-md">
              <span className="text-cyan-400 font-mono text-[10px] uppercase font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">auto_awesome</span>
                Active Quest:
              </span>
              <span className="text-white font-bold truncate max-w-[180px]">{activeQuest.title}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-[#121114] border border-[#26242C] px-3 py-1.5 rounded-xl text-xs">
              <span className="text-emerald-400 font-mono text-[10px] uppercase font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">explore</span>
                Active Screen:
              </span>
              <span className="text-zinc-300 capitalize">{appContext.currentScreen || 'Explore'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area Container */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex flex-col bg-[#1C1A1F] border border-[#26242C] rounded-3xl overflow-hidden h-full shadow-2xl">
          
          {/* Scrollable messages box */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin">
            {messages.map((msg, index) => {
              const isBot = msg.sender === 'bot';
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} space-y-1 group`}
                >
                  <div className="flex items-center gap-1.5 px-1">
                    {isBot && (
                      <span className="text-[10px] font-mono font-bold text-kaos-pink uppercase tracking-wider flex items-center gap-1.5">
                        <KaosAppIcon size={16} withGlow={false} />
                        KAOS Bot · Gemini AI
                      </span>
                    )}
                  </div>

                  <div
                    className={`max-w-[88%] md:max-w-[80%] rounded-2xl px-4 py-3.5 text-xs leading-relaxed ${
                      isBot
                        ? 'bg-[#121114] border border-purple-500/20 text-zinc-200 rounded-tl-sm shadow-sm'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-sm shadow-md'
                    }`}
                  >
                    {/* Render Formatted Markdown Body */}
                    {msg.text.split('\n').map((line, lIdx) => (
                      <p key={lIdx} className={lIdx > 0 ? 'mt-1.5' : ''}>
                        {line.split('**').map((chunk, cIdx) =>
                          cIdx % 2 === 1 ? (
                            <strong key={cIdx} className="font-bold text-white">
                              {chunk}
                            </strong>
                          ) : (
                            chunk
                          )
                        )}
                      </p>
                    ))}

                    {/* Google Search Grounding Sources */}
                    {isBot && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">verified</span>
                            <span>Google Search Sources ({msg.sources.length})</span>
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.map((src, sIdx) => (
                            <a
                              key={sIdx}
                              href={src.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-[10px] text-blue-300 hover:text-white transition-colors max-w-[200px]"
                            >
                              <span className="material-symbols-outlined text-[11px] shrink-0">link</span>
                              <span className="truncate">{src.title || src.uri}</span>
                              <span className="material-symbols-outlined text-[9px] shrink-0">open_in_new</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <span className="text-[9px] text-zinc-500 px-1 font-mono">{msg.timestamp}</span>
                </motion.div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2.5 text-xs text-purple-400 font-mono p-3 bg-[#121114] border border-purple-500/30 rounded-2xl w-fit animate-pulse">
                <span className="material-symbols-outlined text-base animate-spin">smart_toy</span>
                <span>KAOS AI Companion is evaluating application context & historical vault...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Context Suggestion Chips */}
          <div className="p-3 bg-[#121114]/80 border-t border-[#26242C] flex items-center gap-2 overflow-x-auto scrollbar-none">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => onSendMessage(chip, appContext)}
                className="px-3.5 py-1.5 rounded-full bg-[#1C1A1F] hover:bg-[#26242C] border border-[#26242C] hover:border-[#F05423]/60 text-[11px] text-zinc-300 hover:text-white transition-all whitespace-nowrap cursor-pointer shrink-0 font-medium"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Chat Input Form */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-[#121114] border-t border-[#26242C] flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                activeSpot
                  ? `Ask KAOS Bot about ${activeSpot.title}...`
                  : 'Ask KAOS Bot about landmarks, walking routes, architectural styles, or coffee lore...'
              }
              className="flex-1 bg-[#1C1A1F] border border-[#26242C] rounded-2xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#F05423] transition-colors"
            />
            <button
              type="button"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              title="Hold to Record Voice Message"
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border select-none shrink-0 ${
                isRecording
                  ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                  : 'bg-[#1C1A1F] border-[#26242C] text-zinc-300 hover:text-white hover:border-[#F05423]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {isRecording ? 'mic' : 'mic_none'}
              </span>
              <span className="hidden md:inline">{isRecording ? 'Recording...' : 'Hold to Record'}</span>
            </button>
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-[#F05423] to-[#FF8A00] hover:opacity-95 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              <span>Ask</span>
              <span className="material-symbols-outlined text-sm">send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
