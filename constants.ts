import { Modality } from './types';

// R4 (v2): Lista explícita de 22 modalidades para o Seed inicial
// Remove Futebol (F) e Xadrez (M/F), Adiciona Xadrez (Misto)
export const INITIAL_SEED_MODALITIES: { name: string; gender: Modality['gender'] }[] = [
  { name: "Atletismo", gender: "M" },
  { name: "Atletismo", gender: "F" },
  { name: "Basquetebol", gender: "M" },
  { name: "Basquetebol", gender: "F" },
  { name: "Futebol de Campo", gender: "M" }, // Apenas Masculino
  { name: "Futsal", gender: "M" },
  { name: "Futsal", gender: "F" },
  { name: "Handebol", gender: "M" },
  { name: "Handebol", gender: "F" },
  { name: "Judô", gender: "M" },
  { name: "Judô", gender: "F" },
  { name: "Natação", gender: "M" },
  { name: "Natação", gender: "F" },
  { name: "Tênis", gender: "M" },
  { name: "Tênis", gender: "F" },
  { name: "Tênis de Mesa", gender: "M" },
  { name: "Tênis de Mesa", gender: "F" },
  { name: "Vôlei de Praia", gender: "M" },
  { name: "Vôlei de Praia", gender: "F" },
  { name: "Voleibol", gender: "M" },
  { name: "Voleibol", gender: "F" },
  { name: "Xadrez", gender: "Misto" } // Apenas Misto
];

export const GENDERS = ['M', 'F', 'Misto'] as const;

export const INITIAL_ATHLETICS = [
  { id: 'lobo-id', name: 'Atlética Lobo', logoUrl: null }, // R2: Already registered
  { id: 'urso-id', name: 'Atlética Urso', logoUrl: null },
  { id: 'aguia-id', name: 'Atlética Águia', logoUrl: null },
];

export const APP_CONFIG_KEY = 'lobo_app_config';
export const DB_KEY = 'lobo_db_v1';