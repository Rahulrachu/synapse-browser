import React, { useEffect } from 'react';
import { X, Globe, ExternalLink, ShieldCheck } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutDialog({ isOpen, onClose }: AboutDialogProps) {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`relative w-full max-w-md rounded-xl shadow-2xl border ${
          isDarkMode ? 'bg-synapse-darker border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
        } overflow-hidden`}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className={`absolute top-4 right-4 p-1 rounded-full transition ${
            isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
          }`}
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="p-8 flex flex-col items-center text-center">
          {/* Logo */}
          <div className="w-20 h-20 rounded-2xl bg-synapse-accent flex items-center justify-center text-white font-bold text-4xl mb-6 shadow-lg shadow-synapse-accent/20">
            S
          </div>

          <h1 className="text-2xl font-bold mb-1">Synapse Browser</h1>
          <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            AI-First Productivity Browser
          </p>

          <div className={`w-full grid grid-cols-2 gap-4 mb-8 text-sm`}>
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>Version</div>
              <div className="font-mono font-medium">1.0.0</div>
            </div>
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>Build</div>
              <div className="font-mono font-medium">2026.07.06.01</div>
            </div>
          </div>

          <div className="space-y-4 w-full text-sm">
            <div className="flex items-center justify-between">
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Author</span>
              <span className="font-medium">Rahul S R</span>
            </div>

            <div className="flex items-center justify-between">
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>License</span>
              <div className="flex items-center gap-1 font-medium">
                <ShieldCheck size={14} className="text-green-500" />
                MIT License
              </div>
            </div>

            <a 
              href="https://github.com/Rahulrachu/synapse-browser"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg border transition ${
                isDarkMode 
                  ? 'border-gray-700 hover:bg-gray-800 text-gray-300' 
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Globe size={18} />
              View on GitHub
              <ExternalLink size={14} className="opacity-50" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-8 py-4 text-center text-[10px] uppercase tracking-widest ${
          isDarkMode ? 'bg-gray-800/50 text-gray-500' : 'bg-gray-50 text-gray-400'
        }`}>
          Made with &hearts; for the AI era
        </div>
      </div>
    </div>
  );
}
