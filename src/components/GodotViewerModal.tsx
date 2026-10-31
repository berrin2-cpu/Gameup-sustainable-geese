import React, { useState } from 'react';
import { GODOT_FILES, GodotFile } from '../godot/scriptsData.ts';
import { sounds } from '../audio/soundEffects.ts';
import { FileCode, Download, Copy, Check, Info, X, FolderTree } from 'lucide-react';

interface GodotViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GodotViewerModal: React.FC<GodotViewerModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<GodotFile>(GODOT_FILES[0]);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    sounds.playClick();
    navigator.clipboard.writeText(selectedFile.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadFile = (file: GodotFile) => {
    sounds.playClick();
    const blob = new Blob([file.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    sounds.playClick();
    // Download each file sequentially
    GODOT_FILES.forEach((file, index) => {
      setTimeout(() => {
        handleDownloadFile(file);
      }, index * 200);
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Godot Project Scripts & Architecture Hub"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-none"
    >
      <div className="relative w-full max-w-5xl h-[88vh] bg-[#1e232a] border border-emerald-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#161a20] border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-wide text-white">ClimateKaz Godot 4 Architecture Hub</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-950 text-emerald-300 border border-emerald-600/40">
                  GDScript 4.x
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Populated scripts, asset slots for textures/audio, and game loop initialization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm cursor-pointer"
              title="Download all Godot files"
            >
              <Download className="w-3.5 h-3.5" />
              Download All Files
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              aria-label="Close Godot modal"
              className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-64 bg-[#14181e] border-r border-slate-800 p-3 flex flex-col gap-1 overflow-y-auto">
            <div className="px-3 py-2 text-xs font-bold text-slate-400 tracking-wider uppercase">
              Project Structure
            </div>
            {GODOT_FILES.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedFile(file);
                  }}
                  className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left text-xs transition cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 font-medium'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <FileCode className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <div className="overflow-hidden">
                    <div className="truncate font-mono">{file.filename}</div>
                    <div className="text-[10px] text-slate-400 truncate">{file.path}</div>
                  </div>
                </button>
              );
            })}

            {/* Asset Gap Callout Box */}
            <div className="mt-auto p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-300 mb-1">
                <Info className="w-3.5 h-3.5" />
                Asset Slots Ready
              </div>
              <p className="leading-relaxed text-slate-400">
                Textures (<code className="text-amber-300">duck_idle.png</code>, <code className="text-amber-300">plastic.png</code>) and audio (<code className="text-sky-300">water_splash.wav</code>, <code className="text-sky-300">plastic_crunch.wav</code>) have open <code className="text-emerald-300">@export</code> slots in <code className="text-emerald-300">GameManager.gd</code> with procedural fallbacks.
              </p>
            </div>
          </div>

          {/* Code Viewer Panel */}
          <div className="flex-1 flex flex-col bg-[#181d24] overflow-hidden">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-5 py-2.5 bg-[#14181e] border-b border-slate-800">
              <div>
                <span className="font-mono text-xs text-emerald-400 font-semibold">{selectedFile.path}</span>
                <p className="text-[11px] text-slate-400">{selectedFile.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDownloadFile(selectedFile)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="flex-1 p-4 overflow-auto font-mono text-xs leading-relaxed text-slate-200 select-text bg-[#0d1117]">
              <pre className="whitespace-pre">{selectedFile.code}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
