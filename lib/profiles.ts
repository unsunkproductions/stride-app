import { ACCENT, PINK } from './theme';

export type ProfileKey = 'you' | 'gi';

export const PROFILES: Record<ProfileKey, { name: string; palmCm: number; fistCm: number; thumbCm: number; color: string }> = {
  you: { name: 'Você', palmCm: 11, fistCm: 9, thumbCm: 5, color: ACCENT },
  gi: { name: 'Gi', palmCm: 9, fistCm: 7.5, thumbCm: 4, color: PINK },
};

export const MUSCLE_GROUPS = ['peito', 'costas', 'ombros', 'bíceps', 'tríceps', 'quadríceps', 'posteriores', 'glúteos', 'panturrilhas', 'core'];
export const MOOD_EMOJIS = ['😴', '😐', '🙂', '😊', '🔥'];
