'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../lib/supabase';
import { ProfileKey } from '../lib/profiles';
import { StrideData, EMPTY_DATA, Weight, Measurement, Workout, Food, Mood } from '../lib/types';
import { todayKey, nowIso } from '../lib/data';

function toDbFood(f: Omit<Food, 'id'>) {
  return { ...f, from_photo: f.fromPhoto, fromPhoto: undefined };
}
function fromDbFood(row: unknown): Food {
  const r = row as Food & { from_photo?: boolean };
  return { ...r, fromPhoto: r.from_photo };
}

export function useStrideData() {
  const [data, setData] = useState<StrideData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const [weights, measurements, workouts, foods, waterRows, moods] = await Promise.all([
      supabase.from('weights').select('*').order('date'),
      supabase.from('measurements').select('*').order('date'),
      supabase.from('workouts').select('*').order('date'),
      supabase.from('foods').select('*').order('ts'),
      supabase.from('water').select('*'),
      supabase.from('moods').select('*').order('ts'),
    ]);

    const water: Record<string, number> = {};
    (waterRows.data || []).forEach((r: { date: string; profile: string; ml: number }) => {
      water[`${r.date}_${r.profile}`] = r.ml;
    });

    setData({
      weights: (weights.data || []) as Weight[],
      measurements: (measurements.data || []) as Measurement[],
      workouts: (workouts.data || []) as Workout[],
      foods: (foods.data || []).map(fromDbFood),
      water,
      moods: (moods.data || []) as Mood[],
    });
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const addWeight = useCallback(async (profile: ProfileKey, kg: number) => {
    const row: Omit<Weight, 'id'> = { profile, date: todayKey(), kg, ts: nowIso() };
    const { data: inserted } = await supabase.from('weights').insert(row).select().single();
    setData(d => ({ ...d, weights: [...d.weights, inserted as Weight] }));
  }, [supabase]);

  const addMeasurement = useCallback(async (profile: ProfileKey, measures: Partial<Measurement>) => {
    const row = { profile, date: todayKey(), ts: nowIso(), ...measures };
    const { data: inserted } = await supabase.from('measurements').insert(row).select().single();
    setData(d => ({ ...d, measurements: [...d.measurements, inserted as Measurement] }));
  }, [supabase]);

  const addExercise = useCallback(async (profile: ProfileKey, exercise: Workout['exercises'][0]) => {
    const existing = data.workouts.find(w => w.profile === profile && w.date === todayKey());
    if (existing) {
      const newExercises = [...existing.exercises, exercise];
      await supabase.from('workouts').update({ exercises: newExercises }).eq('id', existing.id);
      setData(d => ({
        ...d,
        workouts: d.workouts.map(w =>
          w.id === existing.id ? { ...w, exercises: newExercises } : w
        ),
      }));
    } else {
      const row = { profile, date: todayKey(), exercises: [exercise], ts: nowIso() };
      const { data: inserted } = await supabase.from('workouts').insert(row).select().single();
      setData(d => ({ ...d, workouts: [...d.workouts, inserted as Workout] }));
    }
  }, [supabase, data.workouts]);

  const addFood = useCallback(async (profile: ProfileKey, food: Omit<Food, 'id' | 'profile' | 'date' | 'ts'>) => {
    const row = toDbFood({ ...food, profile, date: todayKey(), ts: nowIso() });
    const { data: inserted } = await supabase.from('foods').insert(row).select().single();
    setData(d => ({ ...d, foods: [...d.foods, fromDbFood(inserted as Record<string, unknown>)] }));
  }, [supabase]);

  const addWater = useCallback(async (profile: ProfileKey, ml: number) => {
    const date = todayKey();
    const key = `${date}_${profile}`;
    const current = data.water[key] || 0;
    const newMl = current + ml;
    await supabase.from('water').upsert({ profile, date, ml: newMl }, { onConflict: 'profile,date' });
    setData(d => ({ ...d, water: { ...d.water, [key]: newMl } }));
  }, [supabase, data.water]);

  const addMood = useCallback(async (profile: ProfileKey, mood: Omit<Mood, 'id' | 'profile' | 'date' | 'ts' | 'hour'>) => {
    const row: Omit<Mood, 'id'> = {
      ...mood, profile, date: todayKey(), ts: nowIso(), hour: new Date().getHours()
    };
    const { data: inserted } = await supabase.from('moods').insert(row).select().single();
    setData(d => ({ ...d, moods: [...d.moods, inserted as Mood] }));
  }, [supabase]);

  return { data, loading, addWeight, addMeasurement, addExercise, addFood, addWater, addMood };
}
