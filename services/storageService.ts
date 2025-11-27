import { 
  Competition, Athletic, Modality, Result, Penalty, 
  DEFAULT_SCORE_RULE, AppConfig, LeaderboardEntry 
} from '../types';
import { INITIAL_SEED_MODALITIES, INITIAL_ATHLETICS, DB_KEY, APP_CONFIG_KEY } from '../constants';

// Simulated Database Schema
interface DatabaseSchema {
  competitions: Competition[];
  athletics: Athletic[];
  modalities: Modality[];
  results: Result[];
  penalties: Penalty[];
  scoreRules: { [modalityId: string]: number[] }; // Custom rules per modality
}

const initialDb: DatabaseSchema = {
  competitions: [],
  athletics: INITIAL_ATHLETICS,
  modalities: [],
  results: [],
  penalties: [],
  scoreRules: {},
};

// Helper to generate IDs
const uuid = () => Math.random().toString(36).substring(2, 9);

// --- Core Storage Methods ---

export const getDb = (): DatabaseSchema => {
  const stored = localStorage.getItem(DB_KEY);
  return stored ? JSON.parse(stored) : initialDb;
};

export const saveDb = (db: DatabaseSchema) => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      alert('LIMITE DE ARMAZENAMENTO ATINGIDO!\n\nO navegador não permite salvar mais dados. Tente remover imagens antigas ou competições passadas.');
      throw e;
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
  } catch (e: any) {
     alert('Erro ao salvar configuração: Limite de armazenamento atingido.');
  }
};

// --- Business Logic / "Backend" Controllers ---

export const createCompetition = (name: string, year: number) => {
  const db = getDb();
  
  // Set all others to inactive
  db.competitions.forEach(c => c.isActive = false);

  const newComp: Competition = {
    id: uuid(),
    name,
    year,
    isActive: true,
    createdAt: Date.now()
  };

  db.competitions.push(newComp);

  // R4 (v2): Auto-Seed Modalities using the explicit list
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

  // Initialize map
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

  // Calculate Points from Results
  const compModalities = db.modalities.filter(m => m.competitionId === competitionId);
  const compResults = db.results.filter(r => r.competitionId === competitionId);

  compResults.forEach(result => {
    const modalityId = result.modalityId;
    // Get rule for this modality or default
    const rule = db.scoreRules[modalityId] || DEFAULT_SCORE_RULE;
    
    // Position 1 is index 0 in rule array
    Object.entries(result.ranking).forEach(([rankStr, athleticId]) => {
      const rank = parseInt(rankStr, 10);
      if (athleticsMap[athleticId]) {
        const points = rule[rank - 1] || 0;
        athleticsMap[athleticId].rawPoints += points;
        athleticsMap[athleticId].totalPoints += points;
      }
    });
  });

  // Subtract Penalties
  const compPenalties = db.penalties.filter(p => p.competitionId === competitionId);
  compPenalties.forEach(p => {
    if (athleticsMap[p.athleticId]) {
      athleticsMap[p.athleticId].penalties += p.points;
      athleticsMap[p.athleticId].totalPoints -= p.points;
    }
  });

  // Convert to array and sort
  const leaderboard = Object.values(athleticsMap).sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    // Tie-breaker: least penalties
    return a.penalties - b.penalties;
  });

  // Assign positions
  return leaderboard.map((entry, index) => ({ ...entry, position: index + 1 }));
};

/**
 * Redimensiona e comprime imagem para evitar estouro de LocalStorage
 */
export const handleImageUpload = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const MAX_WIDTH = 400; // Max dimension sufficient for logos
    const MAX_HEIGHT = 400;
    const QUALITY = 0.7;   // JPEG compression quality

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
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
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);

        // Export as compressed JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
        resolve(dataUrl);
      };

      img.onerror = (err) => reject(err);
    };
    
    reader.onerror = (error) => reject(error);
  });
};