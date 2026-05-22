import { ProfileKey } from './profiles';
import { StrideData } from './types';

export const todayKey = () => new Date().toISOString().split('T')[0];
export const nowIso = () => new Date().toISOString();

export const dataHelpers = {
  weightsFor: (data: StrideData, profile: ProfileKey) =>
    (data.weights || []).filter(w => w.profile === profile),
  measurementsFor: (data: StrideData, profile: ProfileKey) =>
    (data.measurements || []).filter(m => m.profile === profile),
  workoutsFor: (data: StrideData, profile: ProfileKey) =>
    (data.workouts || []).filter(w => w.profile === profile),
  foodsFor: (data: StrideData, profile: ProfileKey) =>
    (data.foods || []).filter(f => f.profile === profile),
  moodsFor: (data: StrideData, profile: ProfileKey) =>
    (data.moods || []).filter(m => m.profile === profile),
  waterFor: (data: StrideData, profile: ProfileKey) =>
    data.water?.[todayKey() + '_' + profile] || 0,
  todayWorkout: (data: StrideData, profile: ProfileKey) =>
    dataHelpers.workoutsFor(data, profile).find(w => w.date === todayKey()),
  todayFoods: (data: StrideData, profile: ProfileKey) =>
    dataHelpers.foodsFor(data, profile).filter(f => f.date === todayKey()),
  todayMoods: (data: StrideData, profile: ProfileKey) =>
    dataHelpers.moodsFor(data, profile).filter(m => m.date === todayKey()),
  streak: (data: StrideData, profile: ProfileKey) => {
    const dates = new Set<string>();
    [...dataHelpers.workoutsFor(data, profile), ...dataHelpers.foodsFor(data, profile),
     ...dataHelpers.moodsFor(data, profile), ...dataHelpers.weightsFor(data, profile)]
      .forEach(x => dates.add(x.date));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const dk = d.toISOString().split('T')[0];
      if (dates.has(dk)) streak++;
      else if (i > 0) break;
    }
    return streak;
  }
};
