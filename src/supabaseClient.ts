import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  username: string | null;
  created_at: string;
  updated_at: string;
}

export interface GameSave {
  id: string;
  user_id: string;
  health: number;
  coins: number;
  wave: number;
  towers: any[]; // TowerData[]
  is_wave_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GrimoireEntry {
  id: string;
  user_id: string;
  word: string;
  definition: string | null;
  part_of_speech: string | null;
  example: string | null;
  etymology: string | null;
  defeat_count: number;
  reward_claimed: boolean;
  attack_power: number;
  created_at: string;
  updated_at: string;
}
