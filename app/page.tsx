'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Home, Dumbbell, Apple, User, Brain, TrendingUp, Plus, X,
  Camera, Check, Flame, ChevronRight, Droplet, Ruler, Hand, Users, Bell,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { createClient } from '../lib/supabase';
import { useStrideData } from '../hooks/useStrideData';
import { PROFILES, ProfileKey, MUSCLE_GROUPS, MOOD_EMOJIS } from '../lib/profiles';
import { dataHelpers, todayKey, nowIso } from '../lib/data';
import {
  ACCENT, RED, AMBER, PINK, BG, SURFACE, SURFACE_2, BORDER,
  TEXT, TEXT_DIM, TEXT_DIMMER, MONO,
} from '../lib/theme';
import { Exercise, Measurement } from '../lib/types';

// ── UI Primitives ────────────────────────────────────────────
const Card = ({ children, className = '', onClick, style }: { children: React.ReactNode; className?: string; onClick?: () => void; style?: React.CSSProperties }) => (
  <div onClick={onClick} className={`rounded-2xl border ${className}`} style={{ background: SURFACE, borderColor: BORDER, ...style }}>{children}</div>
);

const Stat = ({ label, value, unit, accent }: { label: string; value: string | number; unit?: string; accent?: string }) => (
  <div>
    <div className="text-[10px] uppercase tracking-[0.15em]" style={{ color: TEXT_DIM, fontFamily: MONO }}>{label}</div>
    <div className="flex items-baseline gap-1 mt-1">
      <span className="text-3xl font-light tabular-nums" style={{ color: accent || TEXT, fontFamily: MONO }}>{value}</span>
      {unit && <span className="text-xs" style={{ color: TEXT_DIM }}>{unit}</span>}
    </div>
  </div>
);

const Pill = ({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) => (
  <button onClick={onClick} className="px-3 py-1.5 rounded-full text-xs uppercase tracking-wider transition-all"
    style={{ background: active ? ACCENT : 'transparent', color: active ? '#000' : TEXT_DIM, border: `1px solid ${active ? ACCENT : BORDER}`, fontFamily: MONO }}>{children}</button>
);

const Button = ({ children, onClick, variant = 'primary', className = '', disabled }: { children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost'; className?: string; disabled?: boolean }) => {
  const styles = { primary: { bg: ACCENT, color: '#000', border: ACCENT }, secondary: { bg: 'transparent', color: TEXT, border: BORDER }, ghost: { bg: 'transparent', color: TEXT_DIM, border: 'transparent' } };
  const s = styles[variant];
  return (
    <button onClick={onClick} disabled={disabled} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all uppercase tracking-wider disabled:opacity-40 ${className}`}
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontFamily: MONO }}>{children}</button>
  );
};

const Input = ({ value, onChange, placeholder, type = 'text', suffix }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; suffix?: string }) => (
  <div className="relative">
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
      style={{ background: SURFACE_2, color: TEXT, border: `1px solid ${BORDER}`, fontFamily: MONO }} />
    {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs" style={{ color: TEXT_DIM }}>{suffix}</span>}
  </div>
);

const Modal = ({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto animate-slideUp" style={{ background: SURFACE, border: `1px solid ${BORDER}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="text-lg" style={{ color: TEXT }}>{title}</div>
          <button onClick={onClose}><X size={20} style={{ color: TEXT_DIM }} /></button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ── Muscle Map ───────────────────────────────────────────────
const MuscleMap = ({ volumeByGroup = {}, view = 'front' }: { volumeByGroup?: Record<string, number>; view?: string }) => {
  const intensity = (group: string) => {
    const v = volumeByGroup[group] || 0;
    if (v === 0) return BORDER;
    if (v < 10) return '#3a1414';
    if (v < 25) return '#7a1f24';
    if (v < 50) return '#c2272f';
    return RED;
  };
  if (view === 'front') {
    return (
      <svg viewBox="0 0 200 400" className="w-full h-full">
        <ellipse cx="100" cy="35" rx="22" ry="28" fill={SURFACE_2} stroke={BORDER} strokeWidth="1" />
        <rect x="92" y="58" width="16" height="14" fill={SURFACE_2} stroke={BORDER} strokeWidth="1" />
        <ellipse cx="68" cy="82" rx="18" ry="14" fill={intensity('ombros')} stroke={BORDER} strokeWidth="1" />
        <ellipse cx="132" cy="82" rx="18" ry="14" fill={intensity('ombros')} stroke={BORDER} strokeWidth="1" />
        <path d="M 75 80 Q 100 78 125 80 L 130 120 Q 100 128 70 120 Z" fill={intensity('peito')} stroke={BORDER} strokeWidth="1" />
        <line x1="100" y1="80" x2="100" y2="125" stroke={BORDER} strokeWidth="0.5" />
        <ellipse cx="55" cy="115" rx="11" ry="22" fill={intensity('bíceps')} stroke={BORDER} strokeWidth="1" />
        <ellipse cx="145" cy="115" rx="11" ry="22" fill={intensity('bíceps')} stroke={BORDER} strokeWidth="1" />
        <ellipse cx="50" cy="160" rx="9" ry="22" fill={SURFACE_2} stroke={BORDER} strokeWidth="1" />
        <ellipse cx="150" cy="160" rx="9" ry="22" fill={SURFACE_2} stroke={BORDER} strokeWidth="1" />
        <rect x="80" y="125" width="40" height="60" rx="4" fill={intensity('core')} stroke={BORDER} strokeWidth="1" />
        <line x1="100" y1="125" x2="100" y2="185" stroke={BORDER} strokeWidth="0.5" />
        <line x1="80" y1="145" x2="120" y2="145" stroke={BORDER} strokeWidth="0.5" />
        <line x1="80" y1="165" x2="120" y2="165" stroke={BORDER} strokeWidth="0.5" />
        <path d="M 78 195 Q 80 195 90 195 L 95 275 Q 88 280 78 275 Z" fill={intensity('quadríceps')} stroke={BORDER} strokeWidth="1" />
        <path d="M 122 195 Q 120 195 110 195 L 105 275 Q 112 280 122 275 Z" fill={intensity('quadríceps')} stroke={BORDER} strokeWidth="1" />
        <ellipse cx="85" cy="320" rx="9" ry="30" fill={intensity('panturrilhas')} stroke={BORDER} strokeWidth="1" opacity="0.4" />
        <ellipse cx="115" cy="320" rx="9" ry="30" fill={intensity('panturrilhas')} stroke={BORDER} strokeWidth="1" opacity="0.4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 400" className="w-full h-full">
      <ellipse cx="100" cy="35" rx="22" ry="28" fill={SURFACE_2} stroke={BORDER} strokeWidth="1" />
      <rect x="92" y="58" width="16" height="14" fill={SURFACE_2} stroke={BORDER} strokeWidth="1" />
      <ellipse cx="68" cy="82" rx="18" ry="14" fill={intensity('ombros')} stroke={BORDER} strokeWidth="1" />
      <ellipse cx="132" cy="82" rx="18" ry="14" fill={intensity('ombros')} stroke={BORDER} strokeWidth="1" />
      <path d="M 75 78 Q 100 76 125 78 L 135 140 Q 100 148 65 140 Z" fill={intensity('costas')} stroke={BORDER} strokeWidth="1" />
      <line x1="100" y1="80" x2="100" y2="145" stroke={BORDER} strokeWidth="0.5" />
      <ellipse cx="55" cy="115" rx="11" ry="22" fill={intensity('tríceps')} stroke={BORDER} strokeWidth="1" />
      <ellipse cx="145" cy="115" rx="11" ry="22" fill={intensity('tríceps')} stroke={BORDER} strokeWidth="1" />
      <ellipse cx="50" cy="160" rx="9" ry="22" fill={SURFACE_2} stroke={BORDER} strokeWidth="1" />
      <ellipse cx="150" cy="160" rx="9" ry="22" fill={SURFACE_2} stroke={BORDER} strokeWidth="1" />
      <rect x="82" y="140" width="36" height="40" rx="4" fill={intensity('costas')} stroke={BORDER} strokeWidth="1" opacity="0.7" />
      <ellipse cx="85" cy="200" rx="15" ry="18" fill={intensity('glúteos')} stroke={BORDER} strokeWidth="1" />
      <ellipse cx="115" cy="200" rx="15" ry="18" fill={intensity('glúteos')} stroke={BORDER} strokeWidth="1" />
      <path d="M 78 225 Q 80 225 90 225 L 95 290 Q 88 295 78 290 Z" fill={intensity('posteriores')} stroke={BORDER} strokeWidth="1" />
      <path d="M 122 225 Q 120 225 110 225 L 105 290 Q 112 295 122 290 Z" fill={intensity('posteriores')} stroke={BORDER} strokeWidth="1" />
      <ellipse cx="85" cy="325" rx="11" ry="32" fill={intensity('panturrilhas')} stroke={BORDER} strokeWidth="1" />
      <ellipse cx="115" cy="325" rx="11" ry="32" fill={intensity('panturrilhas')} stroke={BORDER} strokeWidth="1" />
    </svg>
  );
};

// ── Header ───────────────────────────────────────────────────
const Header = ({ profile, setProfile, streak }: { profile: ProfileKey; setProfile: (p: ProfileKey) => void; streak: number }) => (
  <div className="sticky top-0 z-20 backdrop-blur-xl" style={{ background: `${BG}E6`, borderBottom: `1px solid ${BORDER}` }}>
    <div className="px-5 py-4 flex items-center justify-between">
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: TEXT_DIM, fontFamily: MONO }}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xl font-light tracking-tight" style={{ color: TEXT, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>STRIDE</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: ACCENT, color: '#000', fontFamily: MONO }}>v1</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: SURFACE_2, border: `1px solid ${BORDER}` }}>
          <Flame size={12} style={{ color: ACCENT }} />
          <span className="text-xs tabular-nums" style={{ color: TEXT, fontFamily: MONO }}>{streak}d</span>
        </div>
        <div className="flex rounded-full overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
          {(['you', 'gi'] as ProfileKey[]).map(p => (
            <button key={p} onClick={() => setProfile(p)} className="px-3 py-1.5 text-[10px] uppercase tracking-wider transition-all"
              style={{ background: profile === p ? PROFILES[p].color : 'transparent', color: profile === p ? '#000' : TEXT_DIM, fontFamily: MONO }}>{PROFILES[p].name}</button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ── Home Screen ──────────────────────────────────────────────
const HomeScreen = ({ profile, data, setView, onQuickMood, pushEnabled, onEnablePush }: {
  profile: ProfileKey; data: ReturnType<typeof useStrideData>['data']; setView: (v: string) => void;
  onQuickMood: (m: number) => void; pushEnabled: boolean; onEnablePush: () => void;
}) => {
  const todayMoods = dataHelpers.todayMoods(data, profile);
  const todayWorkout = dataHelpers.todayWorkout(data, profile);
  const todayFood = dataHelpers.todayFoods(data, profile);
  const totalKcal = todayFood.reduce((s, f) => s + (f.kcal || 0), 0);
  const totalWater = dataHelpers.waterFor(data, profile);
  const recentWeights = dataHelpers.weightsFor(data, profile).slice(-7);
  const [moodPulse, setMoodPulse] = useState<number | null>(null);

  const handleQuick = (m: number) => {
    onQuickMood(m);
    setMoodPulse(m);
    setTimeout(() => setMoodPulse(null), 600);
  };

  return (
    <div className="px-5 pb-32 space-y-4 animate-fadeIn">
      <Card className="p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: ACCENT }} />
        <div className="relative">
          <div className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: TEXT_DIM, fontFamily: MONO }}>Hoje</div>
          <div className="flex items-end gap-4 mb-6">
            <span className="text-6xl font-extralight tabular-nums leading-none" style={{ color: TEXT, fontFamily: MONO }}>{totalKcal}</span>
            <span className="text-sm pb-2" style={{ color: TEXT_DIM }}>kcal consumidas</span>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
            <Stat label="Água" value={totalWater} unit="ml" accent={totalWater >= 2000 ? ACCENT : TEXT} />
            <Stat label="Treino" value={todayWorkout ? '✓' : '–'} accent={todayWorkout ? ACCENT : TEXT_DIMMER} />
            <Stat label="Humor" value={`${todayMoods.length}/3`} accent={todayMoods.length === 3 ? ACCENT : TEXT} />
          </div>
        </div>
      </Card>

      {!pushEnabled && (
        <Card className="p-4 cursor-pointer transition-all hover:scale-[1.01]" onClick={onEnablePush}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: SURFACE_2 }}>
              <Bell size={16} style={{ color: ACCENT }} />
            </div>
            <div className="flex-1">
              <div className="text-sm" style={{ color: TEXT }}>Ativar lembretes</div>
              <div className="text-[10px]" style={{ color: TEXT_DIM }}>Check-ins de humor às 9h, 14h e 20h</div>
            </div>
            <ChevronRight size={14} style={{ color: TEXT_DIMMER }} />
          </div>
        </Card>
      )}

      {todayMoods.length < 3 && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs uppercase tracking-wider" style={{ color: TEXT_DIM, fontFamily: MONO }}>Check-in rápido</div>
              <div className="text-sm mt-1" style={{ color: TEXT }}>Como você tá agora?</div>
            </div>
            <span className="text-[10px]" style={{ color: TEXT_DIMMER, fontFamily: MONO }}>{todayMoods.length}/3 hoje</span>
          </div>
          <div className="flex gap-2 justify-between">
            {MOOD_EMOJIS.map((e, i) => (
              <button key={i} onClick={() => handleQuick(i + 1)}
                className="flex-1 py-3 rounded-xl text-2xl transition-all active:scale-95"
                style={{
                  background: moodPulse === i + 1 ? ACCENT : SURFACE_2,
                  border: `1px solid ${moodPulse === i + 1 ? ACCENT : BORDER}`,
                  transform: moodPulse === i + 1 ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>{e}</button>
            ))}
          </div>
          <div className="text-[10px] mt-2 text-center" style={{ color: TEXT_DIMMER, fontFamily: MONO }}>
            Para detalhes (atividade, alertas) → aba Humor
          </div>
        </Card>
      )}

      {recentWeights.length > 1 && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-wider" style={{ color: TEXT_DIM, fontFamily: MONO }}>Peso · últimos 7</div>
            <span className="text-lg tabular-nums" style={{ color: ACCENT, fontFamily: MONO }}>{recentWeights[recentWeights.length - 1].kg}kg</span>
          </div>
          <div style={{ height: 80 }}>
            <ResponsiveContainer>
              <AreaChart data={recentWeights}>
                <defs>
                  <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="kg" stroke={ACCENT} strokeWidth={2} fill="url(#wg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Dumbbell, label: 'Treinar', view: 'workout' },
          { icon: Apple, label: 'Comer', view: 'nutrition' },
          { icon: User, label: 'Corpo', view: 'body' },
          { icon: TrendingUp, label: 'Insights', view: 'insights' },
        ].map(s => (
          <Card key={s.view} className="p-4 cursor-pointer transition-all hover:scale-[1.02]" onClick={() => setView(s.view)}>
            <s.icon size={18} style={{ color: ACCENT }} />
            <div className="text-sm mt-3" style={{ color: TEXT }}>{s.label}</div>
            <ChevronRight size={14} style={{ color: TEXT_DIMMER }} className="mt-1" />
          </Card>
        ))}
      </div>
    </div>
  );
};

// ── Workout Screen ───────────────────────────────────────────
const WorkoutScreen = ({ profile, data, addExercise }: {
  profile: ProfileKey; data: ReturnType<typeof useStrideData>['data'];
  addExercise: (profile: ProfileKey, ex: Exercise) => Promise<void>;
}) => {
  const [view3d, setView3d] = useState('front');
  const [logging, setLogging] = useState(false);
  const [exName, setExName] = useState('');
  const [exMuscle, setExMuscle] = useState('peito');
  const [sets, setSets] = useState([{ reps: '', weight: '' }]);

  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7);
  const weekWorkouts = dataHelpers.workoutsFor(data, profile).filter(w => new Date(w.date) >= weekStart);
  const volumeByGroup: Record<string, number> = {};
  weekWorkouts.forEach(w => (w.exercises || []).forEach(ex => {
    const v = (ex.sets || []).reduce((s, set) => s + (parseFloat(set.reps) || 0), 0);
    volumeByGroup[ex.muscle] = (volumeByGroup[ex.muscle] || 0) + v;
  }));

  const todayWorkout = dataHelpers.todayWorkout(data, profile);
  const allWorkouts = dataHelpers.workoutsFor(data, profile);

  const saveExercise = async () => {
    if (!exName.trim()) return;
    const validSets = sets.filter(s => s.reps && s.weight);
    if (!validSets.length) return;
    await addExercise(profile, { name: exName, muscle: exMuscle, sets: validSets, ts: nowIso() });
    setExName(''); setSets([{ reps: '', weight: '' }]); setLogging(false);
  };

  return (
    <div className="px-5 pb-32 space-y-4 animate-fadeIn">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs uppercase tracking-wider" style={{ color: TEXT_DIM, fontFamily: MONO }}>Volume Semanal</div>
            <div className="text-sm mt-1" style={{ color: TEXT }}>Mapa muscular · 7 dias</div>
          </div>
          <div className="flex gap-1.5">
            <Pill active={view3d === 'front'} onClick={() => setView3d('front')}>Frente</Pill>
            <Pill active={view3d === 'back'} onClick={() => setView3d('back')}>Costas</Pill>
          </div>
        </div>
        <div className="flex justify-center" style={{ height: 320 }}>
          <MuscleMap volumeByGroup={volumeByGroup} view={view3d} />
        </div>
        <div className="flex items-center justify-center gap-3 mt-2 text-[10px]" style={{ color: TEXT_DIM, fontFamily: MONO }}>
          <span>BAIXO</span>
          <div className="flex gap-1">
            {[BORDER, '#3a1414', '#7a1f24', '#c2272f', RED].map((c, i) => <div key={i} className="w-4 h-2 rounded-sm" style={{ background: c }} />)}
          </div>
          <span>ALTO</span>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs uppercase tracking-wider" style={{ color: TEXT_DIM, fontFamily: MONO }}>Treino de Hoje</div>
          <Button onClick={() => setLogging(true)}><Plus size={14} className="inline mr-1" />Exercício</Button>
        </div>
        {todayWorkout?.exercises?.length ? (
          <div className="space-y-3">
            {todayWorkout.exercises.map((ex, i) => (
              <div key={i} className="p-3 rounded-xl" style={{ background: SURFACE_2 }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm" style={{ color: TEXT }}>{ex.name}</div>
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded-full" style={{ background: BORDER, color: TEXT_DIM, fontFamily: MONO }}>{ex.muscle}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ex.sets.map((s, j) => <span key={j} className="text-xs px-2 py-1 rounded tabular-nums" style={{ background: BG, color: TEXT_DIM, fontFamily: MONO }}>{s.weight}×{s.reps}</span>)}
                </div>
              </div>
            ))}
          </div>
        ) : <div className="text-center py-6 text-sm" style={{ color: TEXT_DIMMER }}>Nenhum exercício registrado hoje.</div>}
      </Card>

      {allWorkouts.length > 1 && (
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wider mb-3" style={{ color: TEXT_DIM, fontFamily: MONO }}>Histórico</div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {[...allWorkouts].reverse().slice(0, 10).map((w, i) => (
              <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <div>
                  <div className="text-sm" style={{ color: TEXT }}>{new Date(w.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}</div>
                  <div className="text-[10px]" style={{ color: TEXT_DIM, fontFamily: MONO }}>{(w.exercises || []).length} exercícios</div>
                </div>
                <ChevronRight size={14} style={{ color: TEXT_DIMMER }} />
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={logging} onClose={() => setLogging(false)} title="Novo exercício">
        <div className="space-y-3">
          <Input value={exName} onChange={setExName} placeholder="Ex: Supino reto" />
          <div className="flex flex-wrap gap-1.5">
            {MUSCLE_GROUPS.map(m => <Pill key={m} active={exMuscle === m} onClick={() => setExMuscle(m)}>{m}</Pill>)}
          </div>
          <div className="space-y-2 pt-2">
            <div className="text-[10px] uppercase tracking-wider" style={{ color: TEXT_DIM, fontFamily: MONO }}>Sets</div>
            {sets.map((s, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="w-6 text-xs" style={{ color: TEXT_DIM, fontFamily: MONO }}>{i + 1}</span>
                <Input value={s.weight} onChange={(v) => { const ns = [...sets]; ns[i] = { ...ns[i], weight: v }; setSets(ns); }} placeholder="kg" type="number" suffix="kg" />
                <Input value={s.reps} onChange={(v) => { const ns = [...sets]; ns[i] = { ...ns[i], reps: v }; setSets(ns); }} placeholder="reps" type="number" suffix="reps" />
                {sets.length > 1 && <button onClick={() => setSets(sets.filter((_, j) => j !== i))}><X size={16} style={{ color: TEXT_DIMMER }} /></button>}
              </div>
            ))}
            <button onClick={() => setSets([...sets, { reps: '', weight: '' }])} className="text-xs flex items-center gap-1" style={{ color: ACCENT, fontFamily: MONO }}>
              <Plus size={12} /> Adicionar set
            </button>
          </div>
          <div className="flex gap-2 pt-3">
            <Button variant="secondary" onClick={() => setLogging(false)} className="flex-1">Cancelar</Button>
            <Button onClick={saveExercise} className="flex-1">Salvar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ── Nutrition Screen ─────────────────────────────────────────
const FOOD_DB = [
  { name: 'Frango grelhado', kcal: 165, p: 31, c: 0, f: 3.6, per: '100g' },
  { name: 'Arroz branco cozido', kcal: 130, p: 2.7, c: 28, f: 0.3, per: '100g' },
  { name: 'Arroz integral', kcal: 112, p: 2.6, c: 23, f: 0.9, per: '100g' },
  { name: 'Feijão preto', kcal: 132, p: 8.9, c: 23, f: 0.5, per: '100g' },
  { name: 'Ovo inteiro', kcal: 78, p: 6, c: 0.6, f: 5, per: '1un' },
  { name: 'Batata doce', kcal: 86, p: 1.6, c: 20, f: 0.1, per: '100g' },
  { name: 'Aveia em flocos', kcal: 389, p: 16.9, c: 66, f: 6.9, per: '100g' },
  { name: 'Banana', kcal: 89, p: 1.1, c: 23, f: 0.3, per: '1un' },
  { name: 'Whey protein', kcal: 120, p: 24, c: 3, f: 1.5, per: '1 scoop' },
  { name: 'Patinho moído', kcal: 137, p: 26, c: 0, f: 3.5, per: '100g' },
  { name: 'Salmão grelhado', kcal: 208, p: 22, c: 0, f: 13, per: '100g' },
  { name: 'Brócolis cozido', kcal: 35, p: 2.4, c: 7, f: 0.4, per: '100g' },
  { name: 'Abacate', kcal: 160, p: 2, c: 9, f: 15, per: '100g' },
  { name: 'Pão integral', kcal: 247, p: 13, c: 41, f: 3.4, per: '100g' },
  { name: 'Queijo cottage', kcal: 98, p: 11, c: 3.4, f: 4.3, per: '100g' },
];

interface PhotoAnalysis {
  items?: Array<{ name: string; grams: number; kcal: number; p: number; c: number; f: number }>;
  total_kcal?: number;
  confidence?: string;
  note?: string;
  error?: string;
}

const NutritionScreen = ({ profile, data, addFood, addWater }: {
  profile: ProfileKey; data: ReturnType<typeof useStrideData>['data'];
  addFood: (profile: ProfileKey, food: Parameters<ReturnType<typeof useStrideData>['addFood']>[1]) => Promise<void>;
  addWater: (profile: ProfileKey, ml: number) => Promise<void>;
}) => {
  const [logging, setLogging] = useState(false);
  const [search, setSearch] = useState('');
  const [photoMode, setPhotoMode] = useState(false);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [photoAnalysis, setPhotoAnalysis] = useState<PhotoAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [customAmount, setCustomAmount] = useState<Record<number, number>>({});

  const todayFood = dataHelpers.todayFoods(data, profile);
  const totals = todayFood.reduce((acc, f) => ({ kcal: acc.kcal + (f.kcal || 0), p: acc.p + (f.p || 0), c: acc.c + (f.c || 0), f: acc.f + (f.f || 0) }), { kcal: 0, p: 0, c: 0, f: 0 });
  const water = dataHelpers.waterFor(data, profile);
  const filteredFoods = FOOD_DB.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  const handleAddFood = async (food: typeof FOOD_DB[0], qty = 1) => {
    await addFood(profile, {
      name: food.name,
      kcal: Math.round(food.kcal * qty), p: +(food.p * qty).toFixed(1),
      c: +(food.c * qty).toFixed(1), f: +(food.f * qty).toFixed(1),
      qty, per: food.per,
    });
    setLogging(false); setSearch(''); setPhotoMode(false); setPhotoData(null); setPhotoAnalysis(null);
  };

  const handleAddWater = (ml: number) => addWater(profile, ml);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      setPhotoData(reader.result as string);
      setAnalyzing(true);
      try {
        const res = await fetch('/api/analyze-food', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: (reader.result as string).split(',')[1], handProfile: PROFILES[profile] }),
        });
        setPhotoAnalysis(await res.json());
      } catch {
        setPhotoAnalysis({ error: 'Não consegui analisar. Adicione manualmente.' });
      }
      setAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  const confirmPhotoItems = async () => {
    if (!photoAnalysis?.items) return;
    for (const item of photoAnalysis.items) {
      await addFood(profile, {
        name: item.name, kcal: Math.round(item.kcal), p: item.p, c: item.c, f: item.f,
        qty: 1, per: `${item.grams}g`, fromPhoto: true,
      });
    }
    setLogging(false); setPhotoMode(false); setPhotoData(null); setPhotoAnalysis(null);
  };

  return (
    <div className="px-5 pb-32 space-y-4 animate-fadeIn">
      <Card className="p-6">
        <div className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: TEXT_DIM, fontFamily: MONO }}>Hoje</div>
        <div className="flex items-end gap-2 mb-4">
          <span className="text-5xl font-extralight tabular-nums" style={{ color: TEXT, fontFamily: MONO }}>{totals.kcal}</span>
          <span className="text-sm pb-2" style={{ color: TEXT_DIM }}>kcal</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[['Prot', totals.p.toFixed(0), ACCENT], ['Carb', totals.c.toFixed(0), AMBER], ['Gord', totals.f.toFixed(0), PINK]].map(([l, v, c]) => (
            <div key={l as string}>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: TEXT_DIM, fontFamily: MONO }}>{l}</div>
              <div className="text-lg tabular-nums" style={{ color: c as string, fontFamily: MONO }}>{v}g</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs uppercase tracking-wider" style={{ color: TEXT_DIM, fontFamily: MONO }}>Água</div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl tabular-nums" style={{ color: TEXT, fontFamily: MONO }}>{water}</span>
              <span className="text-xs" style={{ color: TEXT_DIM }}>/ 2500 ml</span>
            </div>
          </div>
          <Droplet size={24} style={{ color: water >= 2500 ? ACCENT : TEXT_DIM }} />
        </div>
        <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: SURFACE_2 }}>
          <div className="h-full transition-all duration-500" style={{ width: `${Math.min(100, water / 25)}%`, background: ACCENT }} />
        </div>
        <div className="flex gap-2">
          {[250, 500, 750].map(ml => <Button key={ml} variant="secondary" onClick={() => handleAddWater(ml)} className="flex-1">+{ml}ml</Button>)}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs uppercase tracking-wider" style={{ color: TEXT_DIM, fontFamily: MONO }}>Refeições</div>
          <Button onClick={() => setLogging(true)}><Plus size={14} className="inline mr-1" />Adicionar</Button>
        </div>
        {todayFood.length ? (
          <div className="space-y-2">
            {todayFood.map((f, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-xl" style={{ background: SURFACE_2 }}>
                <div className="flex items-center gap-2">
                  {f.fromPhoto && <Camera size={12} style={{ color: ACCENT }} />}
                  <div>
                    <div className="text-sm" style={{ color: TEXT }}>{f.name}</div>
                    <div className="text-[10px]" style={{ color: TEXT_DIM, fontFamily: MONO }}>{f.per}</div>
                  </div>
                </div>
                <div className="text-sm tabular-nums" style={{ color: ACCENT, fontFamily: MONO }}>{f.kcal} kcal</div>
              </div>
            ))}
          </div>
        ) : <div className="text-center py-6 text-sm" style={{ color: TEXT_DIMMER }}>Nenhuma refeição registrada hoje.</div>}
      </Card>

      <Modal open={logging} onClose={() => { setLogging(false); setPhotoMode(false); setPhotoData(null); setPhotoAnalysis(null); }} title={photoMode ? 'Foto da refeição' : 'Adicionar comida'}>
        {!photoMode ? (
          <>
            <div className="flex gap-2 mb-4">
              <Button variant="secondary" onClick={() => { setPhotoMode(true); fileRef.current?.click(); }} className="flex-1">
                <Camera size={14} className="inline mr-1" /> Foto
              </Button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </div>
            <Input value={search} onChange={setSearch} placeholder="Buscar alimento..." />
            <div className="space-y-2 mt-3 max-h-96 overflow-y-auto">
              {filteredFoods.map((f, i) => {
                const qty = customAmount[i] || 1;
                return (
                  <div key={i} className="p-3 rounded-xl" style={{ background: SURFACE_2 }}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-sm" style={{ color: TEXT }}>{f.name}</div>
                        <div className="text-[10px]" style={{ color: TEXT_DIM, fontFamily: MONO }}>{f.kcal} kcal · {f.per}</div>
                      </div>
                      <button onClick={() => handleAddFood(f, qty)} className="text-xs px-3 py-1.5 rounded-full" style={{ background: ACCENT, color: '#000', fontFamily: MONO }}>+ {Math.round(f.kcal * qty)}</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px]" style={{ color: TEXT_DIM, fontFamily: MONO }}>QTD</span>
                      {[0.5, 1, 1.5, 2].map(q => (
                        <button key={q} onClick={() => setCustomAmount({ ...customAmount, [i]: q })} className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: qty === q ? ACCENT : BG, color: qty === q ? '#000' : TEXT_DIM, fontFamily: MONO }}>{q}×</button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {photoData && <img src={photoData} className="w-full rounded-xl" style={{ maxHeight: 240, objectFit: 'cover' }} alt="Foto da refeição" />}
            {analyzing && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2" style={{ borderColor: BORDER, borderTopColor: ACCENT }} />
                <div className="text-xs mt-2" style={{ color: TEXT_DIM, fontFamily: MONO }}>Analisando com referência da sua mão...</div>
              </div>
            )}
            {photoAnalysis?.error && <div className="text-sm text-center py-4" style={{ color: RED }}>{photoAnalysis.error}</div>}
            {photoAnalysis?.items && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl tabular-nums" style={{ color: ACCENT, fontFamily: MONO }}>{photoAnalysis.total_kcal} kcal</div>
                    <div className="text-[10px]" style={{ color: TEXT_DIM, fontFamily: MONO }}>confiança: {photoAnalysis.confidence}</div>
                  </div>
                  <Hand size={20} style={{ color: TEXT_DIM }} />
                </div>
                {photoAnalysis.note && <div className="text-xs italic" style={{ color: TEXT_DIM }}>{photoAnalysis.note}</div>}
                <div className="space-y-2">
                  {photoAnalysis.items.map((item, i) => (
                    <div key={i} className="p-3 rounded-xl" style={{ background: SURFACE_2 }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm" style={{ color: TEXT }}>{item.name}</div>
                        <span className="text-xs tabular-nums" style={{ color: ACCENT, fontFamily: MONO }}>{item.kcal}kcal</span>
                      </div>
                      <div className="flex gap-2">
                        <input type="number" value={item.grams} onChange={(e) => {
                          const items = [...photoAnalysis.items!];
                          const newGrams = parseFloat(e.target.value) || 0;
                          const ratio = item.grams > 0 ? newGrams / item.grams : 1;
                          items[i] = { ...item, grams: newGrams, kcal: Math.round(item.kcal * ratio), p: +(item.p * ratio).toFixed(1), c: +(item.c * ratio).toFixed(1), f: +(item.f * ratio).toFixed(1) };
                          setPhotoAnalysis({ ...photoAnalysis, items, total_kcal: items.reduce((s, it) => s + it.kcal, 0) });
                        }} className="w-20 px-2 py-1 rounded text-xs tabular-nums" style={{ background: BG, color: TEXT, border: `1px solid ${BORDER}`, fontFamily: MONO }} />
                        <span className="text-xs self-center" style={{ color: TEXT_DIM }}>g · {item.p}p {item.c}c {item.f}f</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={confirmPhotoItems} className="w-full"><Check size={14} className="inline mr-1" /> Confirmar refeição</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

// ── Body Screen ──────────────────────────────────────────────
const BodyScreen = ({ profile, data, addWeight, addMeasurement }: {
  profile: ProfileKey; data: ReturnType<typeof useStrideData>['data'];
  addWeight: (profile: ProfileKey, kg: number) => Promise<void>;
  addMeasurement: (profile: ProfileKey, m: Parameters<ReturnType<typeof useStrideData>['addMeasurement']>[1]) => Promise<void>;
}) => {
  const [logging, setLogging] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [measures, setMeasures] = useState({ chest: '', waist: '', hip: '', arm: '', thigh: '', calf: '' });

  const weights = dataHelpers.weightsFor(data, profile);
  const measurements = dataHelpers.measurementsFor(data, profile);

  const saveWeight = async () => {
    if (!weight) return;
    await addWeight(profile, parseFloat(weight));
    setWeight(''); setLogging(null);
  };

  const saveMeasures = async () => {
    const filled = Object.entries(measures).filter(([, v]) => v !== '').reduce((a, [k, v]) => ({ ...a, [k]: parseFloat(v) }), {});
    if (!Object.keys(filled).length) return;
    await addMeasurement(profile, filled);
    setMeasures({ chest: '', waist: '', hip: '', arm: '', thigh: '', calf: '' }); setLogging(null);
  };

  const lastWeight = weights[weights.length - 1];
  const firstWeight = weights[0];
  const delta = lastWeight && firstWeight && weights.length > 1 ? (lastWeight.kg - firstWeight.kg).toFixed(1) : null;
  const lastMeasure = measurements[measurements.length - 1];

  return (
    <div className="px-5 pb-32 space-y-4 animate-fadeIn">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-wider" style={{ color: TEXT_DIM, fontFamily: MONO }}>Peso atual</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-extralight tabular-nums" style={{ color: TEXT, fontFamily: MONO }}>{lastWeight?.kg || '–'}</span>
              <span className="text-sm" style={{ color: TEXT_DIM }}>kg</span>
              {delta && <span className="text-xs tabular-nums ml-2" style={{ color: parseFloat(delta) > 0 ? AMBER : ACCENT, fontFamily: MONO }}>{parseFloat(delta) > 0 ? '+' : ''}{delta}kg</span>}
            </div>
          </div>
          <Button onClick={() => setLogging('weight')}><Plus size={14} className="inline mr-1" />Pesar</Button>
        </div>
        {weights.length > 1 && (
          <div style={{ height: 140 }}>
            <ResponsiveContainer>
              <AreaChart data={weights}>
                <defs>
                  <linearGradient id="wbg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke={BORDER} />
                <XAxis dataKey="date" stroke={TEXT_DIMMER} fontSize={9} tickFormatter={(d: string) => d.slice(5)} />
                <YAxis stroke={TEXT_DIMMER} fontSize={9} domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip contentStyle={{ background: SURFACE_2, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="kg" stroke={ACCENT} strokeWidth={2} fill="url(#wbg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs uppercase tracking-wider" style={{ color: TEXT_DIM, fontFamily: MONO }}>Medidas (fita)</div>
          <Button onClick={() => setLogging('measure')}><Ruler size={14} className="inline mr-1" />Medir</Button>
        </div>
        {lastMeasure ? (
          <div className="grid grid-cols-2 gap-3">
            {([['chest', 'Peito'], ['waist', 'Cintura'], ['hip', 'Quadril'], ['arm', 'Braço'], ['thigh', 'Coxa'], ['calf', 'Panturrilha']] as [keyof Measurement, string][]).map(([key, label]) => lastMeasure[key] != null && (
              <div key={key} className="p-3 rounded-xl" style={{ background: SURFACE_2 }}>
                <div className="text-[10px] uppercase" style={{ color: TEXT_DIM, fontFamily: MONO }}>{label}</div>
                <div className="text-xl tabular-nums" style={{ color: TEXT, fontFamily: MONO }}>{lastMeasure[key] as number}<span className="text-xs" style={{ color: TEXT_DIM }}>cm</span></div>
              </div>
            ))}
          </div>
        ) : <div className="text-center py-6 text-sm" style={{ color: TEXT_DIMMER }}>Nenhuma medida registrada.</div>}
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Hand size={14} style={{ color: ACCENT }} />
          <div className="text-xs uppercase tracking-wider" style={{ color: TEXT_DIM, fontFamily: MONO }}>Referência de porção</div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[['Palma', PROFILES[profile].palmCm], ['Punho', PROFILES[profile].fistCm], ['Polegar', PROFILES[profile].thumbCm]].map(([l, v]) => (
            <div key={l as string}>
              <div className="text-[10px] uppercase" style={{ color: TEXT_DIM, fontFamily: MONO }}>{l}</div>
              <div className="text-lg tabular-nums" style={{ color: TEXT, fontFamily: MONO }}>{v}cm</div>
            </div>
          ))}
        </div>
        <div className="text-[10px] mt-3" style={{ color: TEXT_DIMMER }}>Usado pra escalar porções nas fotos de comida.</div>
      </Card>

      <Modal open={logging === 'weight'} onClose={() => setLogging(null)} title="Registrar peso">
        <Input value={weight} onChange={setWeight} placeholder="0.0" type="number" suffix="kg" />
        <Button onClick={saveWeight} className="w-full mt-3">Salvar</Button>
      </Modal>

      <Modal open={logging === 'measure'} onClose={() => setLogging(null)} title="Medidas com fita">
        <div className="space-y-3">
          {([['chest', 'Peito'], ['waist', 'Cintura'], ['hip', 'Quadril'], ['arm', 'Braço'], ['thigh', 'Coxa'], ['calf', 'Panturrilha']] as [keyof typeof measures, string][]).map(([k, l]) => (
            <div key={k}>
              <div className="text-[10px] uppercase mb-1" style={{ color: TEXT_DIM, fontFamily: MONO }}>{l}</div>
              <Input value={measures[k]} onChange={(v) => setMeasures({ ...measures, [k]: v })} placeholder="0.0" type="number" suffix="cm" />
            </div>
          ))}
          <Button onClick={saveMeasures} className="w-full mt-3">Salvar medidas</Button>
        </div>
      </Modal>
    </div>
  );
};

// ── Mood Screen ──────────────────────────────────────────────
const MoodScreen = ({ profile, data, addMood }: {
  profile: ProfileKey; data: ReturnType<typeof useStrideData>['data'];
  addMood: (profile: ProfileKey, mood: Parameters<ReturnType<typeof useStrideData>['addMood']>[1]) => Promise<void>;
}) => {
  const [logging, setLogging] = useState(false);
  const [mood, setMood] = useState(3);
  const [activity, setActivity] = useState('');
  const [physical, setPhysical] = useState(3);
  const [mental, setMental] = useState(3);

  const moods = dataHelpers.moodsFor(data, profile);
  const todayMoods = dataHelpers.todayMoods(data, profile);

  const saveMood = async () => {
    await addMood(profile, { mood, activity, physical, mental });
    setActivity(''); setMood(3); setPhysical(3); setMental(3); setLogging(false);
  };

  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const dk = d.toISOString().split('T')[0];
    const dayMoods = moods.filter(m => m.date === dk);
    return {
      day: d.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3),
      morning: dayMoods.find(m => m.hour < 12)?.mood || null,
      afternoon: dayMoods.find(m => m.hour >= 12 && m.hour < 18)?.mood || null,
      evening: dayMoods.find(m => m.hour >= 18)?.mood || null,
    };
  });

  return (
    <div className="px-5 pb-32 space-y-4 animate-fadeIn">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs uppercase tracking-wider" style={{ color: TEXT_DIM, fontFamily: MONO }}>Check-ins hoje</div>
            <div className="text-2xl tabular-nums mt-1" style={{ color: TEXT, fontFamily: MONO }}>{todayMoods.length}<span className="text-sm" style={{ color: TEXT_DIM }}> / 3</span></div>
          </div>
          <Button onClick={() => setLogging(true)}><Brain size={14} className="inline mr-1" />Check-in</Button>
        </div>
        <div className="text-[10px] italic" style={{ color: TEXT_DIMMER }}>Estilo "When" do Daniel Pink: pico, vale, recuperação</div>
      </Card>

      {todayMoods.length > 0 && (
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wider mb-3" style={{ color: TEXT_DIM, fontFamily: MONO }}>Hoje</div>
          <div className="space-y-2">
            {todayMoods.map((m, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: SURFACE_2 }}>
                <span className="text-3xl">{MOOD_EMOJIS[m.mood - 1]}</span>
                <div className="flex-1">
                  <div className="text-sm" style={{ color: TEXT }}>{m.activity || '—'}</div>
                  <div className="flex gap-3 mt-1 text-[10px]" style={{ color: TEXT_DIM, fontFamily: MONO }}>
                    <span>FÍS {m.physical}/5</span><span>MENT {m.mental}/5</span>
                    <span>{new Date(m.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <div className="text-xs uppercase tracking-wider mb-3" style={{ color: TEXT_DIM, fontFamily: MONO }}>Padrão · 7 dias</div>
        <div className="grid grid-cols-7 gap-1">
          {last7Days.map((d, i) => (
            <div key={i} className="text-center">
              <div className="text-[10px] mb-1" style={{ color: TEXT_DIM, fontFamily: MONO }}>{d.day}</div>
              <div className="space-y-0.5">
                {(['morning', 'afternoon', 'evening'] as const).map(p => {
                  const v = d[p];
                  const bg = v ? (v <= 2 ? RED : v <= 3 ? AMBER : ACCENT) : SURFACE_2;
                  return <div key={p} className="h-6 rounded transition-all" style={{ background: bg, opacity: v ? (v / 5) : 0.3 }} />;
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px]" style={{ color: TEXT_DIMMER, fontFamily: MONO }}>
          <span>↑ MANHÃ</span><span>TARDE</span><span>NOITE ↓</span>
        </div>
      </Card>

      <Modal open={logging} onClose={() => setLogging(false)} title="Como você tá?">
        <div className="space-y-4">
          <div>
            <div className="text-[10px] uppercase mb-2" style={{ color: TEXT_DIM, fontFamily: MONO }}>Humor</div>
            <div className="flex gap-2 justify-between">
              {MOOD_EMOJIS.map((e, i) => (
                <button key={i} onClick={() => setMood(i + 1)} className="flex-1 py-3 rounded-xl text-2xl transition-all"
                  style={{ background: mood === i + 1 ? ACCENT : SURFACE_2, transform: mood === i + 1 ? 'scale(1.05)' : 'scale(1)' }}>{e}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase mb-2" style={{ color: TEXT_DIM, fontFamily: MONO }}>O que você tá fazendo?</div>
            <Input value={activity} onChange={setActivity} placeholder="Ex: trabalhando, almoçando..." />
          </div>
          <div>
            <div className="flex justify-between mb-2 text-[10px] uppercase" style={{ color: TEXT_DIM, fontFamily: MONO }}>
              <span>Alerta físico</span><span style={{ color: ACCENT }}>{physical}/5</span>
            </div>
            <input type="range" min="1" max="5" value={physical} onChange={(e) => setPhysical(+e.target.value)} className="w-full" style={{ accentColor: ACCENT }} />
          </div>
          <div>
            <div className="flex justify-between mb-2 text-[10px] uppercase" style={{ color: TEXT_DIM, fontFamily: MONO }}>
              <span>Alerta mental</span><span style={{ color: ACCENT }}>{mental}/5</span>
            </div>
            <input type="range" min="1" max="5" value={mental} onChange={(e) => setMental(+e.target.value)} className="w-full" style={{ accentColor: ACCENT }} />
          </div>
          <Button onClick={saveMood} className="w-full">Salvar check-in</Button>
        </div>
      </Modal>
    </div>
  );
};

// ── Insights Screen ──────────────────────────────────────────
const InsightsScreen = ({ data, profile }: { data: ReturnType<typeof useStrideData>['data']; profile: ProfileKey }) => {
  const [compareMode, setCompareMode] = useState(false);

  const myWeights = dataHelpers.weightsFor(data, profile);
  const myWorkouts = dataHelpers.workoutsFor(data, profile);
  const myMoods = dataHelpers.moodsFor(data, profile);
  const otherProfile: ProfileKey = profile === 'you' ? 'gi' : 'you';
  const otherWeights = dataHelpers.weightsFor(data, otherProfile);
  const otherWorkouts = dataHelpers.workoutsFor(data, otherProfile);

  const last4WeeksMine = [...Array(4)].map((_, i) => {
    const end = new Date(); end.setDate(end.getDate() - i * 7);
    const start = new Date(end); start.setDate(start.getDate() - 7);
    return { week: `S-${i}`, treinos: myWorkouts.filter(w => new Date(w.date) >= start && new Date(w.date) < end).length };
  }).reverse();

  const trainDays = myWorkouts.map(w => w.date);
  const moodsOnTrain = myMoods.filter(m => trainDays.includes(m.date));
  const moodsOffTrain = myMoods.filter(m => !trainDays.includes(m.date));
  const avgTrain = moodsOnTrain.length ? (moodsOnTrain.reduce((s, m) => s + m.mood, 0) / moodsOnTrain.length).toFixed(1) : '–';
  const avgOff = moodsOffTrain.length ? (moodsOffTrain.reduce((s, m) => s + m.mood, 0) / moodsOffTrain.length).toFixed(1) : '–';

  const allDates = [...new Set([...myWeights.map(w => w.date), ...otherWeights.map(w => w.date)])].sort();
  const compareWeightData = allDates.map(d => ({
    date: d.slice(5),
    [PROFILES[profile].name]: myWeights.find(w => w.date === d)?.kg,
    [PROFILES[otherProfile].name]: otherWeights.find(w => w.date === d)?.kg,
  }));

  const combinedLast4Weeks = [...Array(4)].map((_, i) => {
    const end = new Date(); end.setDate(end.getDate() - i * 7);
    const start = new Date(end); start.setDate(start.getDate() - 7);
    const mine = myWorkouts.filter(w => new Date(w.date) >= start && new Date(w.date) < end).length;
    const other = otherWorkouts.filter(w => new Date(w.date) >= start && new Date(w.date) < end).length;
    return { week: `S-${i}`, treinos: mine + other };
  }).reverse();

  return (
    <div className="px-5 pb-32 space-y-4 animate-fadeIn">
      <Card className="p-4">
        <button onClick={() => setCompareMode(!compareMode)} className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users size={16} style={{ color: compareMode ? ACCENT : TEXT_DIM }} />
            <div className="text-left">
              <div className="text-sm" style={{ color: TEXT }}>Ver dados juntos</div>
              <div className="text-[10px]" style={{ color: TEXT_DIMMER }}>Mostra você e {PROFILES[otherProfile].name} no mesmo gráfico</div>
            </div>
          </div>
          <div className="w-11 h-6 rounded-full relative transition-colors" style={{ background: compareMode ? ACCENT : BORDER }}>
            <div className="absolute top-0.5 w-5 h-5 rounded-full bg-black transition-all" style={{ left: compareMode ? '22px' : '2px' }} />
          </div>
        </button>
      </Card>

      <Card className="p-5">
        <div className="text-xs uppercase tracking-wider mb-4" style={{ color: TEXT_DIM, fontFamily: MONO }}>
          {compareMode ? 'Peso · juntos' : 'Seu peso'}
        </div>
        {(compareMode ? compareWeightData : myWeights).length > 1 ? (
          <div style={{ height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={compareMode ? compareWeightData : myWeights.map(w => ({ ...w, date: w.date.slice(5) }))}>
                <CartesianGrid strokeDasharray="2 4" stroke={BORDER} />
                <XAxis dataKey="date" stroke={TEXT_DIMMER} fontSize={9} />
                <YAxis stroke={TEXT_DIMMER} fontSize={9} />
                <Tooltip contentStyle={{ background: SURFACE_2, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 11 }} />
                {compareMode ? (
                  <>
                    <Line type="monotone" dataKey={PROFILES[profile].name} stroke={PROFILES[profile].color} strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey={PROFILES[otherProfile].name} stroke={PROFILES[otherProfile].color} strokeWidth={2} dot={{ r: 3 }} />
                  </>
                ) : (
                  <Line type="monotone" dataKey="kg" stroke={PROFILES[profile].color} strokeWidth={2} dot={{ r: 3 }} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <div className="text-center py-6 text-sm" style={{ color: TEXT_DIMMER }}>Registre pesos pra ver o gráfico.</div>}
        {compareMode && (
          <div className="text-[10px] mt-3 italic text-center" style={{ color: TEXT_DIMMER }}>
            Visões individuais — não é ranking, é só pra acompanharem juntos.
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="text-xs uppercase tracking-wider mb-4" style={{ color: TEXT_DIM, fontFamily: MONO }}>
          {compareMode ? 'Treinos somados · 4 semanas' : 'Seus treinos · 4 semanas'}
        </div>
        <div style={{ height: 180 }}>
          <ResponsiveContainer>
            <BarChart data={compareMode ? combinedLast4Weeks : last4WeeksMine}>
              <CartesianGrid strokeDasharray="2 4" stroke={BORDER} />
              <XAxis dataKey="week" stroke={TEXT_DIMMER} fontSize={9} />
              <YAxis stroke={TEXT_DIMMER} fontSize={9} />
              <Tooltip contentStyle={{ background: SURFACE_2, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="treinos" fill={ACCENT} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {compareMode && (
          <div className="text-[10px] mt-2 italic text-center" style={{ color: TEXT_DIMMER }}>
            Total combinado dos dois — o time treinou {combinedLast4Weeks[3]?.treinos || 0} vezes essa semana.
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="text-xs uppercase tracking-wider mb-3" style={{ color: TEXT_DIM, fontFamily: MONO }}>Seu humor × dias de treino</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl" style={{ background: SURFACE_2 }}>
            <div className="text-[10px] uppercase" style={{ color: TEXT_DIM, fontFamily: MONO }}>Com treino</div>
            <div className="text-3xl tabular-nums mt-1" style={{ color: ACCENT, fontFamily: MONO }}>{avgTrain}</div>
            <div className="text-[10px]" style={{ color: TEXT_DIM }}>humor médio</div>
          </div>
          <div className="p-4 rounded-xl" style={{ background: SURFACE_2 }}>
            <div className="text-[10px] uppercase" style={{ color: TEXT_DIM, fontFamily: MONO }}>Sem treino</div>
            <div className="text-3xl tabular-nums mt-1" style={{ color: TEXT, fontFamily: MONO }}>{avgOff}</div>
            <div className="text-[10px]" style={{ color: TEXT_DIM }}>humor médio</div>
          </div>
        </div>
        {avgTrain !== '–' && avgOff !== '–' && (
          <div className="text-xs mt-3 italic" style={{ color: TEXT_DIM }}>
            {parseFloat(avgTrain) > parseFloat(avgOff) ? 'Seu humor é melhor em dias de treino.' : 'Humor parecido em dias com/sem treino.'}
          </div>
        )}
      </Card>
    </div>
  );
};

// ── Bottom Nav ───────────────────────────────────────────────
const BottomNav = ({ view, setView }: { view: string; setView: (v: string) => void }) => {
  const items = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'workout', icon: Dumbbell, label: 'Treino' },
    { id: 'nutrition', icon: Apple, label: 'Comida' },
    { id: 'body', icon: User, label: 'Corpo' },
    { id: 'mood', icon: Brain, label: 'Humor' },
    { id: 'insights', icon: TrendingUp, label: 'Insights' },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-xl" style={{ background: `${BG}E6`, borderTop: `1px solid ${BORDER}` }}>
      <div className="flex justify-around items-center px-2 py-3">
        {items.map(it => {
          const active = view === it.id;
          const Icon = it.icon;
          return (
            <button key={it.id} onClick={() => setView(it.id)} className="flex flex-col items-center gap-1 px-2 py-1 transition-all">
              <Icon size={18} style={{ color: active ? ACCENT : TEXT_DIMMER, transition: 'color 0.2s' }} />
              <span className="text-[9px] uppercase tracking-wider" style={{ color: active ? ACCENT : TEXT_DIMMER, fontFamily: MONO }}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── Auth Gate ────────────────────────────────────────────────
const USER_MAP: Record<string, string> = {
  luis: 'luis@stride.local',
  gi: 'gi@stride.local',
};

const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const t = {
    bg: '#F2F2F0', bgCard: '#FFFFFF',
    text: '#0A0A0A', text3: '#6B6B6B',
    accent: ACCENT, accentBg: '#1a1a0a',
    border: 'rgba(10, 10, 10, 0.09)',
    shadow: '0 4px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)',
    font: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const email = USER_MAP[username.toLowerCase().trim()];
    if (!email) { setError('Usuário inválido. Use "Luis" ou "Gi".'); setLoading(false); return; }
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError('Senha incorreta.');
    else onLogin();
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: t.font, padding: 24 }}>
      <div style={{ background: t.bgCard, borderRadius: 18, padding: '40px 36px', width: '100%', maxWidth: 360, boxShadow: t.shadow, border: `1px solid ${t.border}` }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 22 }}>
            💪
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: t.text }}>STRIDE</div>
          <div style={{ fontSize: 13, color: t.text3, marginTop: 4 }}>Tracker de treino Luis & Gi</div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {['Luis', 'Gi'].map(name => (
              <button key={name} type="button" onClick={() => setUsername(name)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  border: `1.5px solid ${username.toLowerCase() === name.toLowerCase() ? '#000' : t.border}`,
                  background: username.toLowerCase() === name.toLowerCase() ? '#000' : 'transparent',
                  color: username.toLowerCase() === name.toLowerCase() ? ACCENT : t.text3,
                  fontSize: 14, fontWeight: 600, fontFamily: t.font, cursor: 'pointer', transition: 'all 150ms',
                }}>{name}</button>
            ))}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.text3, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${t.border}`, fontSize: 14, fontFamily: t.font, outline: 'none', boxSizing: 'border-box', background: '#FAFAFA' }} />
          </div>

          {error && (
            <div style={{ background: '#FCEDEB', color: '#C7382D', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{error}</div>
          )}

          <button type="submit" disabled={loading || !username || !password}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 12,
              background: loading || !username || !password ? '#E0E0E0' : '#000',
              color: loading || !username || !password ? '#999' : ACCENT,
              border: 'none', fontSize: 15, fontWeight: 600, fontFamily: t.font,
              cursor: loading || !username || !password ? 'not-allowed' : 'pointer', transition: 'background 150ms',
            }}>{loading ? 'Entrando...' : 'Entrar'}</button>
        </form>
      </div>
    </div>
  );
};

// ── Root App ─────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState('home');
  const [profile, setProfile] = useState<ProfileKey>('you');
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const supabase = createClient();

  const { data, loading, addWeight, addMeasurement, addExercise, addFood, addWater, addMood } = useStrideData();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setAuthed(!!session);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (authed && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, [authed]);

  const handleEnablePush = useCallback(async () => {
    if (!('Notification' in window)) {
      alert('Push não suportado neste dispositivo.');
      return;
    }
    const result = await Notification.requestPermission();
    if (result !== 'granted') {
      if (result === 'denied') alert('Permissão negada. Habilite em ajustes do navegador.');
      return;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY,
      });
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON(), profile }),
      });
      setPushEnabled(true);
    } catch (err) {
      console.error('Push subscription failed:', err);
    }
  }, [profile]);

  const handleQuickMood = useCallback((m: number) => {
    addMood(profile, { mood: m, activity: '', physical: 3, mental: 3 });
  }, [addMood, profile]);

  if (authed === null) {
    return (
      <div style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-2" style={{ borderColor: BORDER, borderTopColor: ACCENT }} />
      </div>
    );
  }

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  if (loading) {
    return (
      <div style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-2" style={{ borderColor: BORDER, borderTopColor: ACCENT }} />
      </div>
    );
  }

  return (
    <div style={{ background: BG, minHeight: '100vh', color: TEXT }}>
      <Header profile={profile} setProfile={setProfile} streak={dataHelpers.streak(data, profile)} />
      <div className="pt-4">
        {view === 'home' && <HomeScreen profile={profile} data={data} setView={setView} onQuickMood={handleQuickMood} pushEnabled={pushEnabled} onEnablePush={handleEnablePush} />}
        {view === 'workout' && <WorkoutScreen profile={profile} data={data} addExercise={addExercise} />}
        {view === 'nutrition' && <NutritionScreen profile={profile} data={data} addFood={addFood} addWater={addWater} />}
        {view === 'body' && <BodyScreen profile={profile} data={data} addWeight={addWeight} addMeasurement={addMeasurement} />}
        {view === 'mood' && <MoodScreen profile={profile} data={data} addMood={addMood} />}
        {view === 'insights' && <InsightsScreen data={data} profile={profile} />}
      </div>
      <BottomNav view={view} setView={setView} />
    </div>
  );
}
