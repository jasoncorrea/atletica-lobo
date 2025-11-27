import { 
  Competition, Athletic, Modality, Result, Penalty, 
  DEFAULT_SCORE_RULE, AppConfig, LeaderboardEntry 
} from '../types';
import { INITIAL_SEED_MODALITIES, INITIAL_ATHLETICS, DB_KEY, APP_CONFIG_KEY, FIREBASE_CONFIG } from '../constants';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';

// --- FIREBASE INITIALIZATION ---
let dbRef: any = null;
let isFirebaseInitialized = false;

try {
  // Check if config is filled (simple check on apiKey)
  if (FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== "COLE_SUA_API_KEY_AQUI") {
    const app = initializeApp(FIREBASE_CONFIG);
    const database = getDatabase(app);
    dbRef = ref(database, 'lobo_data');
    isFirebaseInitialized = true;
    
    // SETUP LISTENER: When cloud data changes, update local storage and refresh UI
    onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Save cloud data to local storage to keep them in sync
        localStorage.setItem(DB_KEY, JSON.stringify(data));
        // Trigger UI update
        window.dispatchEvent(new Event('storage'));
        console.log('☁️ Dados sincronizados da nuvem!');
      }
    });
  } else {
    console.warn("Firebase não configurado corretamente em constants.ts. Usando apenas modo Offline.");
  }
} catch (e) {
  console.error("Erro ao conectar no Firebase:", e);
}

// --- TYPES ---
interface DatabaseSchema {
  competitions: Competition[];
  athletics: Athletic[];
  modalities: Modality[];
  results: Result[];
  penalties: Penalty[];
  scoreRules: { [modalityId: string]: number[] };
}

const initialDb: DatabaseSchema = {
  competitions: [],
  athletics: INITIAL_ATHLETICS,
  modalities: [],
  results: [],
  penalties: [],
  scoreRules: {},
};

const uuid = () => Math.random().toString(36).substring(2, 9);

// --- CORE STORAGE ---

export const getDb = (): DatabaseSchema => {
  const stored = localStorage.getItem(DB_KEY);
  return stored ? JSON.parse(stored) : initialDb;
};

export const saveDb = (db: DatabaseSchema) => {
  try {
    // 1. Save Local (Instant)
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    
    // 2. Save Cloud (Async)
    if (isFirebaseInitialized && dbRef) {
      set(dbRef, db).catch(err => console.error("Erro ao salvar na nuvem:", err));
    }
  } catch (e: any) {
    if (e.name === 'QuotaExceededError') {
      alert('LIMITE DE ARMAZENAMENTO LOCA ATINGIDO! Remova imagens antigas.');
    }
    throw e;
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
  localStorage.setItem(APP_CONFIG_KEY, JSON.stringify(config));
};

export const isOnline = () => isFirebaseInitialized;

// --- BUSINESS LOGIC ---

export const createCompetition = (name: string, year: number) => {
  const db = getDb();
  db.competitions.forEach(c => c.isActive = false);

  const newComp: Competition = {
    id: uuid(),
    name,
    year,
    isActive: true,
    createdAt: Date.now()
  };

  db.competitions.push(newComp);

  INITIAL_SEED_MODALITIES.forEach(seed => {
    db.modalities.push({
      id: uuid(),
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
    const modalityId = result.modalityId;
    const rule = db.scoreRules[modalityId] || DEFAULT_SCORE_RULE;
    
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

  const leaderboard = Object.values(athleticsMap).sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return a.penalties - b.penalties;
  });

  return leaderboard.map((entry, index) => ({ ...entry, position: index + 1 }));
};

export const handleImageUpload = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const MAX_WIDTH = 400; 
    const MAX_HEIGHT = 400;
    const QUALITY = 0.7;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error('Canvas context failure'));
            return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (error) => reject(error);
  });
};