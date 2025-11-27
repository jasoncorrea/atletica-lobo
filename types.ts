export interface Competition {
  id: string;
  name: string;
  year: number;
  isActive: boolean;
  createdAt: number;
}

export interface Athletic {
  id: string;
  name: string;
  logoUrl: string | null;
}

export interface Modality {
  id: string;
  competitionId: string;
  name: string;
  gender: 'M' | 'F' | 'Misto';
  status: 'pending' | 'finished';
}

export const DEFAULT_SCORE_RULE: number[] = [12, 9, 7, 5, 4, 3, 2, 1];

export interface Result {
  id: string;
  modalityId: string;
  competitionId: string;
  ranking: { [rank: number]: string };
}

export interface Penalty {
  id: string;
  competitionId: string;
  athleticId: string;
  points: number;
  reason: string;
  date: number;
}

export interface LeaderboardEntry {
  athleticId: string;
  name: string;
  logoUrl: string | null;
  totalPoints: number;
  penalties: number;
  rawPoints: number;
  position: number;
}

export interface AppConfig {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
}

// --- NOVOS TIPOS FINANCEIROS E RBAC ---

export type Role = 'DIRETORIA' | 'SUPER_ADMIN';

export type TransactionType = 'income' | 'expense';
export type PaymentAccount = 'Mercado Pago' | 'PagBank';

export interface FinanceCategory {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: number; // timestamp
  description: string;
  categoryId: string; // ID da categoria
  account: PaymentAccount;
  createdAt: number;
}