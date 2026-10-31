import React, { useState } from 'react';
import {
  ELDER_GOOSE_CONVERSATIONS,
  ElderConversation,
  PlayerResources,
} from '../game/rules.ts';
import { sounds } from '../audio/soundEffects.ts';

interface NPCDialogModalProps {
  isOpen: boolean;
  onClose: () => void;
  resources: PlayerResources;
  onApplyEfficiencyBoost: (topicId: string) => void;
}

export function NPCDialogModal({
  isOpen,
  onClose,
  resources,
  onApplyEfficiencyBoost,
}: NPCDialogModalProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    ELDER_GOOSE_CONVERSATIONS[0].id
  );
  const [boostAppliedFlash, setBoostAppliedFlash] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentConversation: ElderConversation =
    ELDER_GOOSE_CONVERSATIONS.find((c) => c.id === selectedTopicId) ||
    ELDER_GOOSE_CONVERSATIONS[0];

  const hasReviewedCurrent = resources.consultedTopics.includes(currentConversation.id);

  const handleApplyBoost = () => {
    sounds.playLevelUp();
    onApplyEfficiencyBoost(currentConversation.id);
    setBoostAppliedFlash(true);
    setTimeout(() => setBoostAppliedFlash(false), 2400);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="npc-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sounds.playClick();
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-2xl bg-[#fffdf7] border-4 border-[#e8be66] rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-800">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#2f855a] via-[#38a169] to-[#2b6cb0] px-6 py-4 flex items-center justify-between text-white border-b-4 border-[#276749]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 border-2 border-white flex items-center justify-center text-2xl shadow-inner select-none">
              🪿
            </div>
            <div>
              <h2 id="npc-dialog-title" className="text-xl font-black tracking-wide text-white drop-shadow">
                Professor Barnaby
              </h2>
              <p className="text-xs font-semibold text-emerald-100 flex items-center gap-1.5">
                <span>Elder Climate Strategist</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                <span className="text-amber-200">Central Avenue Plaza</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border flex items-center gap-1 shadow-xs ${
                resources.efficiencyBonus > 1.0
                  ? 'bg-amber-400 text-amber-950 border-amber-300 animate-pulse'
                  : 'bg-emerald-800/60 text-emerald-100 border-emerald-600/60'
              }`}
            >
              <span>⚡</span>
              <span>{resources.efficiencyBonus > 1.0 ? `${resources.efficiencyBonus}x Boost Active` : '1.0x Base Flow'}</span>
            </span>
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 flex items-center justify-center text-white font-black text-lg transition-all"
              aria-label="Close dialogue"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col md:flex-row gap-6 max-h-[75vh] overflow-y-auto">
          {/* Left Strategy Topics List */}
          <div className="md:w-5/12 flex flex-col gap-2 border-b md:border-b-0 md:border-r border-amber-200 pb-4 md:pb-0 md:pr-4">
            <div className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center justify-between px-1">
              <span>Task Efficiency Topics</span>
              <span className="text-[10px] text-amber-700 font-semibold bg-amber-100 px-1.5 py-0.5 rounded-md">
                {resources.consultedTopics.length}/{ELDER_GOOSE_CONVERSATIONS.length} Learned
              </span>
            </div>

            <div className="flex flex-col gap-1.5 mt-1 overflow-y-auto max-h-[300px] pr-1">
              {ELDER_GOOSE_CONVERSATIONS.map((conv, idx) => {
                const isSelected = conv.id === selectedTopicId;
                const isLearned = resources.consultedTopics.includes(conv.id);

                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      sounds.playClick();
                      setSelectedTopicId(conv.id);
                    }}
                    className={`text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${
                      isSelected
                        ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs'
                        : 'bg-white hover:bg-amber-50/70 border-amber-200/60 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] flex items-center justify-center font-black shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate">{conv.topicTitle}</span>
                    </div>
                    {isLearned && (
                      <span className="text-emerald-600 font-bold text-xs shrink-0" title="Already reviewed with Professor">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Topic Details & Advice */}
          <div className="md:w-7/12 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-amber-200 text-amber-900 text-[11px] font-black tracking-wide uppercase">
                  Strategy Guide #{currentConversation.recommendedOrder}
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {currentConversation.topicTitle}
                </h3>
              </div>

              {/* Speech bubble dialogue */}
              <div className="relative bg-[#fef9c3]/70 border-2 border-[#fef08a] rounded-2xl p-4 text-xs leading-relaxed text-slate-800 shadow-xs">
                <div className="font-semibold italic mb-2 text-amber-950">
                  &ldquo;{currentConversation.elderDialogue}&rdquo;
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-800 pt-2 border-t border-amber-300/60">
                  <span>🎓 Professor Barnaby, Elder Goose</span>
                </div>
              </div>

              {/* Actionable Pro Tip */}
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-3.5 flex items-start gap-3">
                <span className="text-xl shrink-0">💡</span>
                <div className="text-xs">
                  <div className="font-black text-emerald-900 mb-0.5">High Efficiency Pro-Tip:</div>
                  <div className="font-medium text-emerald-800 leading-snug">
                    {currentConversation.efficiencyTip}
                  </div>
                </div>
              </div>

              {boostAppliedFlash && (
                <div className="bg-amber-400 text-amber-950 border-2 border-amber-500 rounded-xl px-4 py-2 text-xs font-black text-center shadow-md animate-bounce">
                  🎉 Efficiency Strategy Applied! All task completions now earn +25% bonus Eco Points!
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500 font-medium">
                {hasReviewedCurrent ? (
                  <span className="text-emerald-700 font-bold">✓ Advice absorbed into journal</span>
                ) : (
                  <span>Click below to absorb advice (+35 Eco Points)</span>
                )}
              </div>

              <button
                onClick={handleApplyBoost}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-white font-extrabold text-xs shadow-md border-b-3 border-amber-700 flex items-center gap-2 transition-all"
              >
                <span>⚡</span>
                <span>{resources.efficiencyBonus > 1.0 ? 'Refresh Strategy (+25% Boost)' : 'Absorb Strategy (+25% Boost)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Tip */}
        <div className="bg-[#f7f2e4] px-6 py-2.5 border-t border-amber-200 text-center text-[11px] text-amber-900 font-semibold flex items-center justify-center gap-2">
          <span>🦆</span>
          <span>
            Talk with Professor Barnaby anytime by pressing <b>[E]</b> or walking near the central road roundabout!
          </span>
        </div>
      </div>
    </div>
  );
}
