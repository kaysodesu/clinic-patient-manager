import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BRAND } from '../config/brand';
import {
  HelpCircle, Compass, PlayCircle, Film, BookOpen, X, ChevronLeft, ChevronRight, Pause, Play,
  RotateCcw, SkipForward, Captions,
} from 'lucide-react';
import {
  AppSection, TourStep, SECTION_GUIDES, FULL_TOUR, WHO_IT_IS_FOR, GETTING_STARTED, ROLE_LABELS, ROLE_DESCRIPTIONS, STAFF_ROLES,
} from '../data/tutorialContent';

type Mode = 'closed' | 'welcome' | 'guided' | 'auto' | 'videos' | 'video' | 'manual';
type ManualTab = 'who' | 'start' | 'navigation' | 'codes';

interface TutorialCenterProps {
  onNavigate: (section: AppSection) => void;
  demoMode?: boolean;
}

const SEEN_KEY = 'clinic_onboarding_seen_v1';

function readSeen(): boolean {
  try { return localStorage.getItem(SEEN_KEY) === 'yes'; } catch { return false; }
}
function markSeen() {
  try { localStorage.setItem(SEEN_KEY, 'yes'); } catch { /* storage unavailable */ }
}

// Reading time for auto-play: ~4s plus time for the text, capped at 11s
const stepDuration = (step: TourStep) => Math.min(11000, 4000 + step.body.length * 40);

/** Finds the element to highlight; falls back to the main panel when the target is hidden. */
function findTarget(selector?: string): DOMRect | null {
  const candidates = [selector, 'main'].filter(Boolean) as string[];
  for (const sel of candidates) {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      if (sel !== 'main' && sel !== 'aside') el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return rect;
    }
  }
  return null;
}

export default function TutorialCenter({ onNavigate, demoMode }: TutorialCenterProps) {
  const [mode, setMode] = useState<Mode>(() => (readSeen() ? 'closed' : 'welcome'));
  const [menuOpen, setMenuOpen] = useState(false);
  const [steps, setSteps] = useState<TourStep[]>(FULL_TOUR);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [videoSection, setVideoSection] = useState<AppSection | null>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [manualTab, setManualTab] = useState<ManualTab>('who');
  const menuTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const touring = mode === 'guided' || mode === 'auto' || mode === 'video';
  const step = steps[index];

  const close = useCallback(() => {
    markSeen();
    setMode('closed');
    setMenuOpen(false);
    setPaused(false);
    setVideoEnded(false);
  }, []);

  const startTour = (kind: 'guided' | 'auto', tourSteps: TourStep[] = FULL_TOUR) => {
    markSeen();
    setMenuOpen(false);
    setSteps(tourSteps);
    setIndex(0);
    setPaused(false);
    setMode(kind);
  };

  const playVideo = (section: AppSection) => {
    const guide = SECTION_GUIDES.find(g => g.section === section);
    if (!guide) return;
    markSeen();
    setMenuOpen(false);
    setVideoSection(section);
    setSteps(guide.steps);
    setIndex(0);
    setPaused(false);
    setVideoEnded(false);
    setMode('video');
  };

  const openManual = (tab: ManualTab = 'who') => {
    markSeen();
    setMenuOpen(false);
    setManualTab(tab);
    setMode('manual');
  };

  // Open the screen each step belongs to
  useEffect(() => {
    if (touring && step?.section) onNavigate(step.section);
  }, [touring, step?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the spotlight on its target while the layout settles, scrolls or resizes
  useEffect(() => {
    if (!touring || !step) { setRect(null); return; }
    let frame = 0;
    const update = () => setRect(findTarget(step.target));
    const timer = setTimeout(update, 120);
    const interval = setInterval(update, 400);
    window.addEventListener('resize', update);
    return () => { clearTimeout(timer); clearInterval(interval); cancelAnimationFrame(frame); window.removeEventListener('resize', update); };
  }, [touring, step?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-advance for the automatic tour and the video walkthroughs
  useEffect(() => {
    if ((mode !== 'auto' && mode !== 'video') || paused || videoEnded || !step) return;
    const t = setTimeout(() => {
      if (index < steps.length - 1) setIndex(i => i + 1);
      else if (mode === 'video') setVideoEnded(true);
      else close();
    }, stepDuration(step));
    return () => clearTimeout(t);
  }, [mode, paused, index, steps, videoEnded, step, close]);

  // Keyboard: Esc closes, arrows step through
  useEffect(() => {
    if (mode === 'closed') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (!touring) return;
      if (e.key === 'ArrowRight' && index < steps.length - 1) setIndex(i => i + 1);
      if (e.key === 'ArrowLeft' && index > 0) setIndex(i => i - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, touring, index, steps.length, close]);

  const videoGuide = useMemo(() => SECTION_GUIDES.find(g => g.section === videoSection), [videoSection]);
  const nextVideo = useMemo(() => {
    const i = SECTION_GUIDES.findIndex(g => g.section === videoSection);
    return i >= 0 && i < SECTION_GUIDES.length - 1 ? SECTION_GUIDES[i + 1] : null;
  }, [videoSection]);

  const openMenuSoon = () => { if (menuTimer.current) clearTimeout(menuTimer.current); setMenuOpen(true); };
  const closeMenuSoon = () => { menuTimer.current = setTimeout(() => setMenuOpen(false), 350); };

  // ---------------- RENDER PIECES ----------------

  const spotlight = touring && rect && (
    <div
      aria-hidden="true"
      className="fixed z-[90] pointer-events-none rounded-xl ring-4 ring-teal-400 transition-all duration-300 motion-reduce:transition-none"
      style={{
        top: Math.max(4, rect.top - 6),
        left: Math.max(4, rect.left - 6),
        width: Math.min(window.innerWidth - 8, rect.width + 12),
        height: Math.min(window.innerHeight - 8, rect.height + 12),
        boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.55)',
      }}
    />
  );

  const progress = steps.length ? ((index + 1) / steps.length) * 100 : 0;

  const tourCard = (mode === 'guided' || mode === 'auto') && step && (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="tour-title"
      className="fixed z-[95] bg-white text-slate-800 shadow-2xl border border-slate-200 rounded-2xl p-5 space-y-3
                 left-3 right-3 bottom-3 md:left-auto md:right-6 md:bottom-24 md:w-[380px]"
      style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
          {mode === 'auto' ? 'Automatic tour' : 'Guided tour'} · Step {index + 1} of {steps.length}
        </span>
        <button type="button" onClick={close} aria-label="Close tour" className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>
      <h3 id="tour-title" className="text-base font-extrabold text-slate-900 leading-snug">{step.title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{step.body}</p>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIndex(i => Math.max(0, i - 1))}
          disabled={index === 0}
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </button>
        {mode === 'auto' && (
          <button
            type="button"
            onClick={() => setPaused(p => !p)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
          >
            {paused ? <><Play className="w-3.5 h-3.5" /> Resume</> : <><Pause className="w-3.5 h-3.5" /> Pause</>}
          </button>
        )}
        <button
          type="button"
          onClick={() => (index < steps.length - 1 ? setIndex(i => i + 1) : close())}
          className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 flex items-center gap-1 cursor-pointer"
        >
          {index < steps.length - 1 ? <>Next <ChevronRight className="w-3.5 h-3.5" /></> : 'Finish'}
        </button>
      </div>
    </div>
  );

  const videoPlayer = mode === 'video' && step && videoGuide && (
    <div
      role="dialog"
      aria-label={`How-to video: ${videoGuide.label}`}
      className="fixed z-[95] left-3 right-3 bottom-3 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[620px] bg-slate-950 text-white rounded-2xl shadow-2xl border border-slate-800 overflow-hidden"
      style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
          <Film className="w-3.5 h-3.5" /> How-to · {videoGuide.label}
        </span>
        <button type="button" onClick={close} aria-label="Close video" className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>
      {videoEnded ? (
        <div className="px-4 py-5 space-y-3 text-center">
          <p className="text-sm font-bold">That’s the {videoGuide.label} walkthrough.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => playVideo(videoGuide.section)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 flex items-center gap-1 cursor-pointer">
              <RotateCcw className="w-3.5 h-3.5" /> Replay
            </button>
            {nextVideo && (
              <button type="button" onClick={() => playVideo(nextVideo.section)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-500 flex items-center gap-1 cursor-pointer">
                <SkipForward className="w-3.5 h-3.5" /> Next: {nextVideo.label}
              </button>
            )}
            <button type="button" onClick={() => setMode('videos')} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 cursor-pointer">
              All videos
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="px-4 py-3 min-h-[76px]">
            <p className="text-[10px] text-slate-400 flex items-center gap-1 mb-1"><Captions className="w-3 h-3" /> {step.title}</p>
            <p className="text-sm leading-relaxed text-slate-100">{step.body}</p>
          </div>
          <div className="flex items-center gap-3 px-4 pb-3">
            <button
              type="button"
              onClick={() => setPaused(p => !p)}
              aria-label={paused ? 'Play' : 'Pause'}
              className="w-9 h-9 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center justify-center shrink-0 cursor-pointer"
            >
              {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            <div className="flex-1 flex gap-1" aria-label={`Part ${index + 1} of ${steps.length}`}>
              {steps.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Jump to part ${i + 1}: ${s.title}`}
                  className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden cursor-pointer"
                >
                  <span
                    key={`${s.id}-${i === index ? 'now' : 'other'}`}
                    className="block h-full bg-teal-400"
                    style={
                      i === index
                        ? { width: 0, animation: `tour-fill ${stepDuration(s)}ms linear forwards`, animationPlayState: paused ? 'paused' : 'running' }
                        : { width: i < index ? '100%' : '0%' }
                    }
                  />
                </button>
              ))}
            </div>
            <span className="text-[11px] tabular-nums text-slate-400 shrink-0">{videoGuide.videoLength}</span>
          </div>
        </>
      )}
    </div>
  );

  const welcome = mode === 'welcome' && (
    <div className="fixed inset-0 z-[100] bg-slate-950/60 flex items-end sm:items-center justify-center p-3" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700">{BRAND.facilityName}</p>
          <h2 id="welcome-title" className="text-xl font-extrabold text-slate-900">Welcome! How would you like to get started?</h2>
          <p className="text-sm text-slate-600">
            Take a quick tour of the dashboard, or jump straight in. You can reopen any of these later from the Help button.
            {demoMode && ' This demo keeps everything in your own browser and already has five fictional practice patients loaded.'}
          </p>
        </div>
        <div className="grid gap-2">
          <WelcomeOption icon={<Compass className="w-5 h-5" />} title="Guided tutorial" detail="Step through each screen at your own pace with Next and Back." onClick={() => startTour('guided')} primary />
          <WelcomeOption icon={<PlayCircle className="w-5 h-5" />} title="Automatic tutorial" detail="Sit back: the tour opens each screen and moves on by itself. Pause any time." onClick={() => startTour('auto')} />
          <WelcomeOption icon={<Film className="w-5 h-5" />} title="Watch how-to videos" detail="Short walkthroughs for each section, one topic at a time." onClick={() => setMode('videos')} />
          <WelcomeOption icon={<BookOpen className="w-5 h-5" />} title="Read the user manual" detail="Who it's for, getting started, navigation, and roles and access." onClick={() => openManual('who')} />
        </div>
        <button type="button" onClick={close} className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 py-1 cursor-pointer">
          Skip for now
        </button>
      </div>
    </div>
  );

  const videoLibrary = mode === 'videos' && (
    <Modal title="How-to videos" subtitle="Each walkthrough plays live in the dashboard with captions. Pick a topic." onClose={close}>
      <div className="grid sm:grid-cols-2 gap-2">
        {SECTION_GUIDES.map(g => (
          <button
            key={g.section}
            type="button"
            onClick={() => playVideo(g.section)}
            className="text-left p-3 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 flex gap-3 items-start cursor-pointer"
          >
            <span className="w-10 h-10 rounded-lg bg-slate-900 text-teal-300 flex items-center justify-center shrink-0">
              <Play className="w-4 h-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-slate-900">{g.label}</span>
              <span className="block text-xs text-slate-500 leading-snug">{g.summary}</span>
              <span className="block text-[11px] text-slate-400 mt-0.5 tabular-nums">{g.videoLength}</span>
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );

  const manual = mode === 'manual' && (
    <Modal title="User manual" subtitle={`${BRAND.facilityName} · ${BRAND.productName}`} onClose={close}>
      <div className="flex flex-wrap gap-1 mb-4" role="tablist">
        {([['who', "Who it's for"], ['start', 'Getting started'], ['navigation', 'Navigation'], ['codes', 'Roles & access']] as [ManualTab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={manualTab === tab}
            onClick={() => setManualTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${manualTab === tab ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {manualTab === 'who' && (
        <div className="space-y-3 text-sm text-slate-700 leading-relaxed max-w-prose">
          {WHO_IT_IS_FOR.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
        </div>
      )}

      {manualTab === 'start' && (
        <ol className="space-y-2 text-sm text-slate-700 list-decimal pl-5 max-w-prose">
          {GETTING_STARTED.map((item, i) => <li key={i} className="leading-relaxed">{item}</li>)}
        </ol>
      )}

      {manualTab === 'navigation' && (
        <div className="space-y-2">
          <p className="text-sm text-slate-600">Use the sidebar on a computer or tablet, or tap ☰ at the top on a phone. Choose “Show me” to jump to a screen with a short guided tour.</p>
          <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl">
            {SECTION_GUIDES.map(g => (
              <li key={g.section} className="flex items-start justify-between gap-3 p-3">
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-900">{g.label}</span>
                  <span className="block text-xs text-slate-500 leading-snug">{g.summary}</span>
                </span>
                <button
                  type="button"
                  onClick={() => startTour('guided', g.steps)}
                  className="shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 cursor-pointer"
                >
                  Show me
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {manualTab === 'codes' && (
        <div className="space-y-3 text-sm text-slate-700">
          <p>Every staff member signs in with their own account. Their role decides what they can open; administrators set roles in Staff &amp; access.</p>
          <table className="w-full text-sm border border-slate-100 rounded-xl overflow-hidden">
            <tbody className="divide-y divide-slate-100">
              {STAFF_ROLES.map(r => (
                <tr key={r}>
                  <td className="p-2.5 font-semibold whitespace-nowrap">{ROLE_LABELS[r]}</td>
                  <td className="p-2.5 text-slate-600">{ROLE_DESCRIPTIONS[r]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );

  const helpButton = mode !== 'welcome' && (
    <div
      className={`fixed z-[80] ${touring ? 'hidden md:block' : ''}`}
      style={{ right: 'calc(16px + env(safe-area-inset-right, 0px))', bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
      onMouseEnter={openMenuSoon}
      onMouseLeave={closeMenuSoon}
    >
      {menuOpen && (
        <div role="menu" aria-label="Help options" className="absolute bottom-14 right-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 space-y-0.5">
          <p className="px-2.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Need a hand?</p>
          <MenuItem icon={<Compass className="w-4 h-4" />} label="Guided tutorial" onClick={() => startTour('guided')} />
          <MenuItem icon={<PlayCircle className="w-4 h-4" />} label="Automatic tutorial" onClick={() => startTour('auto')} />
          <MenuItem icon={<Film className="w-4 h-4" />} label="How-to videos" onClick={() => { setMenuOpen(false); setMode('videos'); }} />
          <MenuItem icon={<BookOpen className="w-4 h-4" />} label="User manual" onClick={() => openManual('who')} />
        </div>
      )}
      <button
        id="help-center-button"
        type="button"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(o => !o)}
        className="h-12 pl-3.5 pr-4 rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-xl flex items-center gap-2 text-sm font-bold cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-300"
      >
        <HelpCircle className="w-5 h-5" />
        <span>Help</span>
      </button>
    </div>
  );

  return (
    <>
      {spotlight}
      {tourCard}
      {videoPlayer}
      {welcome}
      {videoLibrary}
      {manual}
      {helpButton}
    </>
  );
}

function WelcomeOption({ icon, title, detail, onClick, primary }: { icon: React.ReactNode; title: string; detail: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-3 rounded-xl border flex gap-3 items-start cursor-pointer transition-colors ${
        primary ? 'border-teal-500 bg-teal-50 hover:bg-teal-100' : 'border-slate-200 hover:border-teal-400 hover:bg-slate-50'
      }`}
    >
      <span className="text-teal-700 mt-0.5 shrink-0">{icon}</span>
      <span>
        <span className="block text-sm font-bold text-slate-900">{title}</span>
        <span className="block text-xs text-slate-500 leading-snug">{detail}</span>
      </span>
    </button>
  );
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" role="menuitem" onClick={onClick} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-800 cursor-pointer">
      <span className="text-teal-600">{icon}</span>
      {label}
    </button>
  );
}

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/60 flex items-end sm:items-center justify-center p-3" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 max-h-[88vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
