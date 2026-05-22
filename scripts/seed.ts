import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const profiles = [
  { id: 'you', name: 'Você', palm_cm: 11, fist_cm: 9, thumb_cm: 5, color: '#C6F432' },
  { id: 'gi',  name: 'Gi',   palm_cm: 9,  fist_cm: 7.5, thumb_cm: 4, color: '#FF6B9D' },
];

const foods = [
  { name: 'Frango grelhado',    kcal: 165, p: 31,  c: 0,  f: 3.6, per: '100g' },
  { name: 'Arroz branco cozido',kcal: 130, p: 2.7, c: 28, f: 0.3, per: '100g' },
  { name: 'Arroz integral',     kcal: 112, p: 2.6, c: 23, f: 0.9, per: '100g' },
  { name: 'Feijão preto',       kcal: 132, p: 8.9, c: 23, f: 0.5, per: '100g' },
  { name: 'Ovo inteiro',        kcal: 78,  p: 6,   c: 0.6,f: 5,   per: '1un'  },
  { name: 'Batata doce',        kcal: 86,  p: 1.6, c: 20, f: 0.1, per: '100g' },
  { name: 'Aveia em flocos',    kcal: 389, p: 16.9,c: 66, f: 6.9, per: '100g' },
  { name: 'Banana',             kcal: 89,  p: 1.1, c: 23, f: 0.3, per: '1un'  },
  { name: 'Whey protein',       kcal: 120, p: 24,  c: 3,  f: 1.5, per: '1 scoop' },
  { name: 'Patinho moído',      kcal: 137, p: 26,  c: 0,  f: 3.5, per: '100g' },
  { name: 'Salmão grelhado',    kcal: 208, p: 22,  c: 0,  f: 13,  per: '100g' },
  { name: 'Brócolis cozido',    kcal: 35,  p: 2.4, c: 7,  f: 0.4, per: '100g' },
  { name: 'Abacate',            kcal: 160, p: 2,   c: 9,  f: 15,  per: '100g' },
  { name: 'Pão integral',       kcal: 247, p: 13,  c: 41, f: 3.4, per: '100g' },
  { name: 'Queijo cottage',     kcal: 98,  p: 11,  c: 3.4,f: 4.3, per: '100g' },
];

async function main() {
  console.log('Seeding profiles...');
  const { error: pErr } = await supabase.from('profiles').upsert(profiles, { onConflict: 'id' });
  if (pErr) console.error('profiles error:', pErr.message);
  else console.log('✓ profiles');

  console.log('Seeding foods_catalog...');
  const { error: fErr } = await supabase.from('foods_catalog').upsert(foods, { onConflict: 'name' });
  if (fErr) console.error('foods_catalog error:', fErr.message);
  else console.log('✓ foods_catalog');

  console.log('Done!');
}

main().catch(console.error);
