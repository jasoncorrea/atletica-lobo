
import { Modality } from './types';

// --- CONFIGURAÇÃO DO FIREBASE (Coloque seus dados abaixo) ---
// Pegue esses dados em: Console Firebase -> Configurações do Projeto -> Geral -> Seus Apps -> SDK Setup
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB_ZxzVidBTuz7pve59vY6e8TmJu-ZATFY",
  authDomain: "atletica-lobo.firebaseapp.com",
  databaseURL: "https://atletica-lobo-default-rtdb.firebaseio.com",
  projectId: "atletica-lobo",
  storageBucket: "atletica-lobo.firebasestorage.app",
  messagingSenderId: "209377214468",
  appId: "1:209377214468:web:f24e9dd3f0ecfce4e83551"
};

// R4 (v2): Lista explícita de 22 modalidades para o Seed inicial
export const INITIAL_SEED_MODALITIES: { name: string; gender: Modality['gender'] }[] = [
  { name: "Atletismo", gender: "M" },
  { name: "Atletismo", gender: "F" },
  { name: "Basquetebol", gender: "M" },
  { name: "Basquetebol", gender: "F" },
  { name: "Futebol de Campo", gender: "M" },
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
  { name: "Xadrez", gender: "Misto" }
];

export const GENDERS = ['M', 'F', 'Misto'] as const;

export const INITIAL_ATHLETICS = [
  { id: 'lobo-id', name: 'Atlética Lobo', logoUrl: null },
  { id: 'urso-id', name: 'Atlética Urso', logoUrl: null },
  { id: 'aguia-id', name: 'Atlética Águia', logoUrl: null },
];

export const APP_CONFIG_KEY = 'lobo_app_config';
export const DB_KEY = 'lobo_db_v1';
