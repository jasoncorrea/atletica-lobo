
import { 
  Competition, Athletic, Modality, Result, Penalty, 
  DEFAULT_SCORE_RULE, AppConfig, LeaderboardEntry,
  Transaction, FinanceCategory, Product 
} from '../types';
import { INITIAL_SEED_MODALITIES, INITIAL_ATHLETICS, DEFAULT_FINANCE_CATEGORIES, DB_KEY, APP_CONFIG_KEY, FIREBASE_CONFIG } from '../constants';
// @ts-ignore
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';

// Firebase Init
let dbRef: any = null;
let configRef: any = null; // Referência para configurações
let isFirebaseInitialized = false;
let database: any = null;

try {
  if (FIREBASE_CONFIG.apiKey) {
    const app = initializeApp(FIREBASE_CONFIG);
    database = getDatabase(app);
    
    // Referências do Banco
    dbRef = ref(database, 'lobo_data');
    configRef = ref(database, 'lobo_config');
    
    isFirebaseInitialized = true;
    
    // 1. Sincroniza Banco de Dados Principal
    onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        localStorage.setItem(DB_KEY, JSON.stringify(data));
        window.dispatchEvent(new Event('storage'));
      }
    });

    // 2. Sincroniza Configurações (Logo/Cores)
    onValue(configRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        localStorage.setItem(APP_CONFIG_KEY, JSON.stringify(data));
        window.dispatchEvent(new Event('storage'));
      }
    });
  }
} catch (e) {
  console.error("Firebase Error:", e);
}

interface DatabaseSchema {
  competitions: Competition[];
  athletics: Athletic[];
  modalities: Modality[];
  results: Result[];
  penalties: Penalty[];
  scoreRules: { [modalityId: string]: number[] };
  transactions: Transaction[];
  financeCategories: FinanceCategory[];
  // Nova tabela de produtos
  products: Product[];
}

const initialDb: DatabaseSchema = {
  competitions: [],
  athletics: INITIAL_ATHLETICS,
  modalities: [],
  results: [],
  penalties: [],
  scoreRules: {},
  transactions: [],
  financeCategories: [],
  products: []
};

export const getDb = (): DatabaseSchema => {
  const stored = localStorage.getItem(DB_KEY);
  let db: DatabaseSchema = initialDb;
  
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      db = {
        competitions: parsed.competitions || [],
        athletics: parsed.athletics || [],
        modalities: parsed.modalities || [],
        results: parsed.results || [],
        penalties: parsed.penalties || [],
        scoreRules: parsed.scoreRules || {},
        transactions: parsed.transactions || [],
        financeCategories: parsed.financeCategories || [],
        products: parsed.products || []
      };
    } catch {
      db = initialDb;
    }
  }

  // Auto-Seed de Categorias Financeiras se estiver vazio
  if (db.financeCategories.length === 0) {
    db.financeCategories = DEFAULT_FINANCE_CATEGORIES.map(name => ({
      id: Math.random().toString(36).substr(2, 9),
      name,
      isDefault: true
    }));
  }

  return db;
};

export const saveDb = (db: DatabaseSchema) => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    if (isFirebaseInitialized && dbRef) {
      set(dbRef, db).catch(console.error);
    }
  } catch (e: any) {
    if (e.name === 'QuotaExceededError') {
      alert('Limite de armazenamento local atingido!');
    }
  }
};

export const getConfig = (): AppConfig => {
  const stored = localStorage.getItem(APP_CONFIG_KEY);
  return stored ? JSON.parse(stored) : {
    primaryColor: '#e38702',
    secondaryColor: '#5a0509',
    logoUrl: null
  };
};

export const saveConfig = (config: AppConfig) => {
  try {
    localStorage.setItem(APP_CONFIG_KEY, JSON.stringify(config));
    if (isFirebaseInitialized && configRef) {
      set(configRef, config).catch(console.error);
    }
  } catch (e) {
    console.error("Erro ao salvar config", e);
  }
};

export const isOnline = () => isFirebaseInitialized;

export const createCompetition = (name: string, year: number) => {
  const db = getDb();
  db.competitions.forEach(c => c.isActive = false);

  const newComp: Competition = {
    id: Math.random().toString(36).substring(2, 9),
    name,
    year,
    isActive: true,
    createdAt: Date.now()
  };

  db.competitions.push(newComp);

  INITIAL_SEED_MODALITIES.forEach(seed => {
    db.modalities.push({
      id: Math.random().toString(36).substring(2, 9),
      competitionId: newComp.id,
      name: seed.name,
      gender: seed.gender,
      status: 'pending'
    });
  });

  saveDb(db);
  return newComp;
};

export const calculateLeaderboard = (competitionId: string): LeaderboardEntry[] => {
  const db = getDb();
  const athleticsMap: Record<string, LeaderboardEntry> = {};

  db.athletics.forEach(a => {
    athleticsMap[a.id] = {
      athleticId: a.id,
      name: a.name,
      logoUrl: a.logoUrl,
      totalPoints: 0,
      rawPoints: 0,
      penalties: 0,
      position: 0
    };
  });

  const compResults = db.results.filter(r => r.competitionId === competitionId);
  compResults.forEach(result => {
    const rule = DEFAULT_SCORE_RULE;
    Object.entries(result.ranking).forEach(([rankStr, athleticId]) => {
      const rank = parseInt(rankStr, 10);
      if (athleticsMap[athleticId]) {
        const points = rule[rank - 1] || 0;
        athleticsMap[athleticId].rawPoints += points;
        athleticsMap[athleticId].totalPoints += points;
      }
    });
  });

  const compPenalties = db.penalties.filter(p => p.competitionId === competitionId);
  compPenalties.forEach(p => {
    if (athleticsMap[p.athleticId]) {
      athleticsMap[p.athleticId].penalties += p.points;
      athleticsMap[p.athleticId].totalPoints -= p.points;
    }
  });

  return Object.values(athleticsMap)
    .sort((a, b) => b.totalPoints - a.totalPoints || a.penalties - b.penalties)
    .map((entry, index) => ({ ...entry, position: index + 1 }));
};

export const handleImageUpload = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 400;
        let w = img.width;
        let h = img.height;
        
        if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
        else { if (h > MAX) { w *= MAX / h; h = MAX; } }
        
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else reject(new Error('Canvas error'));
      };
    };
    reader.onerror = reject;
  });
};
