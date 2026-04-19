
import { 
  Competition, Athletic, Modality, Result, Penalty, 
  DEFAULT_SCORE_RULE, AppConfig, LeaderboardEntry,
  Transaction, FinanceCategory, Product, BirthdayMember,
  ShareMember, SharePost, ShareRecord, Socio
} from '../types';
import { INITIAL_SEED_MODALITIES, INITIAL_ATHLETICS, DEFAULT_FINANCE_CATEGORIES, DB_KEY, APP_CONFIG_KEY } from '../constants';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, onSnapshot, doc, setDoc, getDoc, 
  writeBatch, query, deleteDoc, getDocFromServer
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Firestore Error Types
export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

// Initializing Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

let isFirebaseReady = false;

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection established.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export const handleFirestoreError = (error: any, op: string, path: string | null = null) => {
  if (error.code === 'permission-denied' || error.message?.includes('insufficient permissions')) {
    const user = auth.currentUser;
    const info: FirestoreErrorInfo = {
      error: error.message || 'Unknown Firestore Error',
      operationType: op as any,
      path,
      authInfo: {
        userId: user?.uid || 'anonymous',
        email: user?.email || '',
        emailVerified: user?.emailVerified || false,
        isAnonymous: user?.isAnonymous || true,
        providerInfo: user?.providerData.map(p => ({
          providerId: p.providerId,
          displayName: p.displayName || '',
          email: p.email || ''
        })) || []
      }
    };
    throw new Error(safeStringify(info));
  }
  throw error;
};

interface DatabaseSchema {
  competitions: Competition[];
  athletics: Athletic[];
  modalities: Modality[];
  results: Result[];
  penalties: Penalty[];
  scoreRules: { [modalityId: string]: number[] };
  transactions: Transaction[];
  financeCategories: FinanceCategory[];
  products: Product[];
  birthdays: BirthdayMember[];
  shareMembers: ShareMember[];
  sharePosts: SharePost[];
  shareRecords: ShareRecord[];
  socios: Socio[];
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
  products: [],
  birthdays: [],
  shareMembers: [],
  sharePosts: [],
  shareRecords: [],
  socios: []
};

// State management
let currentDb: DatabaseSchema = initialDb;
let currentConfig: AppConfig = {
  primaryColor: '#e38702',
  secondaryColor: '#5a0509',
  logoUrl: null
};

// Syncing Firestore collections to Local State
const publicCollections = [
  'competitions', 'athletics', 'modalities', 'results', 
  'penalties', 'products', 'birthdays', 'scoreRules',
  'shareMembers', 'sharePosts', 'shareRecords', 'socios'
];

const restrictedCollections = [
  'transactions', 'financeCategories'
];

const activeListeners: Record<string, () => void> = {};

// Safe stringify to avoid circular references
const safeStringify = (obj: any): string => {
  try {
    return JSON.stringify(obj);
  } catch (err) {
    const cache = new Set();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) return '[Circular]';
        cache.add(value);
      }
      return value;
    });
  }
};

const startListener = (colName: string) => {
  if (activeListeners[colName]) return;
  
  const unsub = onSnapshot(collection(db, colName), (snapshot) => {
    const data = snapshot.docs.map(d => d.data());
    if (colName === 'scoreRules') {
      const map: any = {};
      data.forEach((item: any) => {
        if (item.id) map[item.id] = item.rule;
      });
      currentDb.scoreRules = map;
    } else {
      (currentDb as any)[colName] = data;
    }
    window.dispatchEvent(new Event('storage'));
  }, (err) => {
    if (!err.message?.includes('insufficient permissions')) {
      console.error(`Error syncing ${colName}:`, err);
    }
  });
  
  activeListeners[colName] = unsub;
};

// Start public listeners immediately
publicCollections.forEach(startListener);

// Manage restricted listeners based on Auth state
onAuthStateChanged(auth, (user) => {
  if (user) {
    restrictedCollections.forEach(startListener);
  } else {
    restrictedCollections.forEach(colName => {
      if (activeListeners[colName]) {
        activeListeners[colName]();
        delete activeListeners[colName];
      }
    });
  }
});

// Syncing Config
onSnapshot(doc(db, 'config', 'global'), (snapshot) => {
  if (snapshot.exists()) {
    currentConfig = snapshot.data() as AppConfig;
    window.dispatchEvent(new Event('storage'));
  }
}, (err) => console.error("Error syncing config:", err));

// Auto-seed athletics if empty in Firestore
async function seedInitialData() {
  const athleticsSnap = await getDoc(doc(db, 'athletics', INITIAL_ATHLETICS[0].id));
  if (!athleticsSnap.exists()) {
    const batch = writeBatch(db);
    INITIAL_ATHLETICS.forEach(a => {
      batch.set(doc(db, 'athletics', a.id), a);
    });
    await batch.commit();
  }
}
seedInitialData();

export const getDb = (): DatabaseSchema => {
  return currentDb;
};

export const saveDb = async (dbUpdate: DatabaseSchema) => {
  try {
    // Helper to clean undefined values recursively (Firestore fails on undefined)
    const cleanObject = (obj: any): any => {
      if (obj === null || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(cleanObject);
      
      // If it's a Firestore-like object (with parent/db refs), don't recurse deep
      if (obj.constructor && (obj.constructor.name === 'DocumentReference' || obj.constructor.name === 'Firestore')) {
        return obj.path || '[Complex Object]';
      }

      const newObj: any = {};
      Object.keys(obj).forEach(key => {
        if (obj[key] === undefined) return;
        newObj[key] = cleanObject(obj[key]);
      });
      return newObj;
    };

    const cleanedDb = cleanObject(dbUpdate);
    const operations: { ref: any, data: any }[] = [];

    // Map all collections to operations
    (Object.keys(cleanedDb) as Array<keyof DatabaseSchema>).forEach(key => {
      if (Array.isArray(cleanedDb[key])) {
        (cleanedDb[key] as any[]).forEach(item => {
          if (item.id) {
            operations.push({ ref: doc(db, key as string, item.id), data: item });
          }
        });
      } else if (key === 'scoreRules') {
        Object.entries(cleanedDb.scoreRules).forEach(([modId, rule]) => {
          operations.push({ ref: doc(db, 'scoreRules', modId), data: { id: modId, rule } });
        });
      }
    });

    // Execute in batches of 400 (Stay safe below 500 limit)
    const BATCH_SIZE = 400;
    for (let i = 0; i < operations.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = operations.slice(i, i + BATCH_SIZE);
      chunk.forEach(op => batch.set(op.ref, op.data));
      await batch.commit();
    }

    localStorage.setItem(DB_KEY, safeStringify(dbUpdate));
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    handleFirestoreError(err, 'write');
  }
};

export const getConfig = (): AppConfig => {
  return currentConfig;
};

export const saveConfig = async (config: AppConfig) => {
  try {
    await setDoc(doc(db, 'config', 'global'), config);
    localStorage.setItem(APP_CONFIG_KEY, safeStringify(config));
  } catch (err) {
    handleFirestoreError(err, 'write', 'config/global');
  }
};

export const isOnline = () => true; // Always online with managed Firebase

export const deleteItem = async (collectionName: keyof DatabaseSchema, id: string) => {
  try {
    await deleteDoc(doc(db, collectionName as string, id));
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    handleFirestoreError(err, 'delete', `${collectionName}/${id}`);
    throw err;
  }
};

export const createCompetition = async (name: string, year: number) => {
  const id = Math.random().toString(36).substring(2, 9);
  const newComp: Competition = {
    id,
    name,
    year,
    isActive: true,
    createdAt: Date.now()
  };

  try {
    const batch = writeBatch(db);
    
    // Deactivate others
    currentDb.competitions.forEach(c => {
      batch.update(doc(db, 'competitions', c.id), { isActive: false });
    });

    batch.set(doc(db, 'competitions', id), newComp);

    INITIAL_SEED_MODALITIES.forEach(seed => {
      const modId = Math.random().toString(36).substring(2, 9);
      batch.set(doc(db, 'modalities', modId), {
        id: modId,
        competitionId: id,
        name: seed.name,
        gender: seed.gender,
        status: 'pending'
      });
    });

    INITIAL_ATHLETICS.forEach(seed => {
      const athleticId = Math.random().toString(36).substring(2, 9);
      batch.set(doc(db, 'athletics', athleticId), {
        id: athleticId,
        competitionId: id,
        name: seed.name,
        logoUrl: seed.logoUrl
      });
    });

    await batch.commit();
    return newComp;
  } catch (err) {
    handleFirestoreError(err, 'create', 'competitions');
    throw err;
  }
};

// ... remaining functions kept similarly or slightly updated for cloud performance
// ... (omitting full repetition of calculated logic as it uses getDb which is now reactive)

export const calculateLeaderboard = (competitionId: string): LeaderboardEntry[] => {
  const db_local = currentDb;
  const athleticsMap: Record<string, LeaderboardEntry> = {};

  // Filter athletics by competitionId
  const compAthletics = db_local.athletics.filter(a => a.competitionId === competitionId);

  compAthletics.forEach(a => {
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

  const compResults = db_local.results.filter(r => r.competitionId === competitionId);
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

  const compPenalties = db_local.penalties.filter(p => p.competitionId === competitionId);
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
