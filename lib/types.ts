import { ProfileKey } from './profiles';

export interface Weight {
  id?: number;
  profile: ProfileKey;
  date: string;
  kg: number;
  ts: string;
}

export interface Measurement {
  id?: number;
  profile: ProfileKey;
  date: string;
  chest?: number;
  waist?: number;
  hip?: number;
  arm?: number;
  thigh?: number;
  calf?: number;
  ts: string;
}

export interface Exercise {
  name: string;
  muscle: string;
  sets: { weight: string; reps: string }[];
  ts: string;
}

export interface Workout {
  id?: number;
  profile: ProfileKey;
  date: string;
  exercises: Exercise[];
  ts?: string;
}

export interface Food {
  id?: number;
  profile: ProfileKey;
  date: string;
  name: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
  qty: number;
  per: string;
  fromPhoto?: boolean;
  ts: string;
}

export interface Mood {
  id?: number;
  profile: ProfileKey;
  date: string;
  mood: number;
  activity: string;
  physical: number;
  mental: number;
  hour: number;
  ts: string;
}

export interface StrideData {
  weights: Weight[];
  measurements: Measurement[];
  workouts: Workout[];
  foods: Food[];
  water: Record<string, number>;
  moods: Mood[];
}

export const EMPTY_DATA: StrideData = {
  weights: [],
  measurements: [],
  workouts: [],
  foods: [],
  water: {},
  moods: [],
};
