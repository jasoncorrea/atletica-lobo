import { 
  Competition, Athletic, Modality, Result, Penalty, 
  DEFAULT_SCORE_RULE, AppConfig, LeaderboardEntry,
  Transaction, FinanceCategory, Product, BirthdayMember,
  ShareMember, SharePost, ShareRecord, Socio, ManagementEvent
} from '../types';
import { INITIAL_SEED_MODALITIES, INITIAL_ATHLETICS, DEFAULT_FINANCE_CATEGORIES, DB_KEY, APP_CONFIG_KEY } from '../constants';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, onSnapshot, doc, setDoc, getDoc, 
  writeBatch, query, deleteDoc, getDocFromServer,
  enableIndexedDbPersistence, collectionGroup
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

// Enable Offline Persistence
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Múltiplas abas abertas. Persistência desativada nesta aba.");
    } else if (err.code === 'unimplemented') {
      console.warn("Navegador não suporta persistência offline.");
    }
  });
}

let isFirebaseReady = false;
let quotaErrorInterval: any = null;

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection established.");
    
    if (quotaErrorInterval) {
      clearInterval(quotaErrorInterval);
      quotaErrorInterval = null;
    }
    
    window.dispatchEvent(new CustomEvent('lobo-quota-resolved'));
    
    // Restart listeners if they were in error state
    Object.keys(activeListeners).forEach(col => {
      const unsub = activeListeners[col];
      unsub();
      delete activeListeners[col];
      startListener(col);
    });
    
  } catch (error: any) {
    if (error.code === 'resource-exhausted' || error.message?.includes('quota')) {
      if (!quotaErrorInterval) {
        quotaErrorInterval = setInterval(testConnection, 30000); // Check every 30s
      }
      return;
    }
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

// Manual Sync Trigger
if (typeof window !== 'undefined') {
  window.addEventListener('lobo-force-sync', () => {
    console.log("Forcing cloud sync recheck...");
    testConnection();
  });
}

export const handleFirestoreError = (error: any, op: string, path: string | null = null) => {
  const isQuotaError = error.code === 'resource-exhausted' || error.message?.includes('quota');
  
  if (isQuotaError) {
    const info: FirestoreErrorInfo = {
      error: 'Limite de cota do Firebase atingido. O sistema está operando em modo offline limitado com dados locais. Como você fez o upgrade para o Blaze, este aviso desaparecerá assim que o Firebase processar a alteração (pode levar alguns minutos).',
      operationType: op as any,
      path,
      authInfo: getAuthInfo()
    };
    console.error("Cota do Firebase excedida:", info.error);
    // Disparar evento para o UI alertar o usuário
    window.dispatchEvent(new CustomEvent('lobo-quota-exceeded', { detail: info }));
    return;
  }

  if (error.code === 'permission-denied' || error.message?.includes('insufficient permissions')) {
    const info: FirestoreErrorInfo = {
      error: error.message || 'Sem permissão para esta operação.',
      operationType: op as any,
      path,
      authInfo: getAuthInfo()
    };
    throw new Error(safeStringify(info));
  }
  throw error;
};

const getAuthInfo = () => {
  const user = auth.currentUser;
  return {
    userId: user?.uid || 'anonymous',
    email: user?.email || '',
    emailVerified: user?.emailVerified || false,
    isAnonymous: user?.isAnonymous || true,
    providerInfo: user?.providerData.map(p => ({
      providerId: p.providerId,
      displayName: p.displayName || '',
      email: p.email || ''
    })) || []
  };
};

export interface DatabaseSchema {
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
  managementEvents: ManagementEvent[];
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
  socios: [],
  managementEvents: []
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
  'penalties', 'products', 'birthdays', 'scoreRules'
];

const restrictedCollections = [
  'transactions', 'financeCategories', 'managementEvents',
  'socios', 'shareMembers', 'sharePosts', 'shareRecords'
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
    
    // Save to local cache as fallback for quota
    localStorage.setItem(`${DB_KEY}_cache_${colName}`, safeStringify(data));

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
    window.dispatchEvent(new Event('lobo-db-sync'));
  }, (err) => {
    if (err.message?.includes('quota') || err.code === 'resource-exhausted') {
      console.warn(`Cota excedida ao sincronizar ${colName}. Usando cache local.`);
      const cached = localStorage.getItem(`${DB_KEY}_cache_${colName}`);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          if (colName === 'scoreRules') {
            const map: any = {};
            data.forEach((item: any) => { if (item.id) map[item.id] = item.rule; });
            currentDb.scoreRules = map;
          } else {
            (currentDb as any)[colName] = data;
          }
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new Event('lobo-db-sync'));
        } catch (e) {
          console.error(`Erro ao carregar cache de ${colName}:`, e);
        }
      }
      handleFirestoreError(err, 'list', colName);
    } else if (!err.message?.includes('insufficient permissions')) {
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
    localStorage.setItem(APP_CONFIG_KEY, safeStringify(currentConfig));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('lobo-db-sync'));
  }
}, (err) => {
  if (err.message?.includes('quota') || err.code === 'resource-exhausted') {
    console.warn("Cota excedida ao sincronizar config. Usando cache local.");
    const cached = localStorage.getItem(APP_CONFIG_KEY);
    if (cached) {
      try {
        currentConfig = JSON.parse(cached);
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('lobo-db-sync'));
      } catch (e) {
        console.error("Erro ao carregar cache de config:", e);
      }
    }
  } else {
    console.error("Error syncing config:", err);
  }
});

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

// targeted save to avoid massive writes
export const updateItem = async (collectionName: keyof DatabaseSchema, item: any) => {
  if (!item.id) throw new Error("Item must have an ID");
  try {
    await setDoc(doc(db, collectionName as string, item.id), item);
    // Local update to trigger UI immediately if needed
    if (Array.isArray((currentDb as any)[collectionName])) {
      const idx = (currentDb as any)[collectionName].findIndex((i: any) => i.id === item.id);
      if (idx > -1) (currentDb as any)[collectionName][idx] = item;
      else (currentDb as any)[collectionName].push(item);
    }
  } catch (err) {
    handleFirestoreError(err, 'write', `${collectionName}/${item.id}`);
  }
};

export const saveDb = async (dbUpdate: DatabaseSchema) => {
  try {
    // Only save what's necessary if we have targeted updates
    // For legacy support, we still implement the batch save but with size check
    const cleanObject = (obj: any): any => {
      if (obj === null || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(cleanObject);
      
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

    // Map all collections - but compare with currentDb to only write changes
    (Object.keys(cleanedDb) as Array<keyof DatabaseSchema>).forEach(key => {
      if (Array.isArray(cleanedDb[key])) {
        (cleanedDb[key] as any[]).forEach(item => {
          if (item.id) {
            const currentItem = (currentDb[key] as any[])?.find((i: any) => i.id === item.id);
            // Simple stringify comparison to see if write is needed
            if (!currentItem || JSON.stringify(currentItem) !== JSON.stringify(item)) {
              operations.push({ ref: doc(db, key as string, item.id), data: item });
            }
          }
        });
      } else if (key === 'scoreRules') {
        Object.entries(cleanedDb.scoreRules).forEach(([modId, rule]) => {
          if (JSON.stringify(currentDb.scoreRules[modId]) !== JSON.stringify(rule)) {
            operations.push({ ref: doc(db, 'scoreRules', modId), data: { id: modId, rule } });
          }
        });
      }
    });

    if (operations.length === 0) return;

    const BATCH_SIZE = 400;
    for (let i = 0; i < operations.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = operations.slice(i, i + BATCH_SIZE);
      chunk.forEach(op => batch.set(op.ref, op.data));
      await batch.commit();
    }

    localStorage.setItem(DB_KEY, safeStringify(dbUpdate));
    currentDb = { ...dbUpdate };
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('lobo-db-sync'));
  } catch (err) {
    handleFirestoreError(err, 'write');
  }
};

export const getConfig = (): AppConfig => {
  return currentConfig;
};

export const saveConfig = async (config: AppConfig) => {
  try {
    currentConfig = { ...config };
    await setDoc(doc(db, 'config', 'global'), config);
    localStorage.setItem(APP_CONFIG_KEY, safeStringify(config));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('lobo-db-sync'));
  } catch (err) {
    handleFirestoreError(err, 'write', 'config/global');
  }
};

export const isOnline = () => true; // Always online with managed Firebase

export const refreshAuth = async () => {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (err) {
      console.error("Error refreshing auth:", err);
    }
  }
};

export const deleteItem = async (collectionName: keyof DatabaseSchema, id: string) => {
  try {
    await deleteDoc(doc(db, collectionName as string, id));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('lobo-db-sync'));
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

    // Seed Modalities (Always seed default modalities)
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

    // Smart Athletics Seeding
    const upperName = name.toUpperCase();
    let athleticsToSeed: { name: string; logoUrl: string | null }[] = [];

    if (upperName.includes('JOIA PG')) {
      athleticsToSeed = [
        'XV DE OUTUBRO', 'CAPETADA', 'LOS BRAVOS', 'DIREITO UEPG', 'MEDICINA UEPG',
        'CAÓTICOS', 'BÁRBAROS', 'JAVAS', 'SHARKS', 'VI DE NOVEMBRO', 'LOBO',
        'IMPÉRIO JURÍDICO', 'CORVOS', 'CORINGAÇO', 'HUNTERS', 'SOBERANA',
        'GORILAS', 'TROIA', 'XIX DE SETEMBRO', 'Z'
      ].map(n => ({ name: n, logoUrl: null }));
    } else if (upperName.includes('ENGENHARIADAS PARANAENSE')) {
      // Find the most recent Engenharíadas to copy athletics from
      const prevEngenharíadas = [...currentDb.competitions]
        .filter(c => c.name.toUpperCase().includes('ENGENHARIADAS PARANAENSE'))
        .sort((a, b) => b.year - a.year)[0];

      if (prevEngenharíadas) {
        athleticsToSeed = currentDb.athletics
          .filter(a => a.competitionId === prevEngenharíadas.id)
          .map(a => ({ name: a.name, logoUrl: a.logoUrl }));
      }
    }

    // Apply seeding
    if (athleticsToSeed.length > 0) {
      athleticsToSeed.forEach(seed => {
        const athleticId = Math.random().toString(36).substring(2, 9);
        batch.set(doc(db, 'athletics', athleticId), {
          id: athleticId,
          competitionId: id,
          name: seed.name,
          logoUrl: seed.logoUrl
        });
      });
    }

    await batch.commit();
    return newComp;
  } catch (err) {
    handleFirestoreError(err, 'create', 'competitions');
    throw err;
  }
};

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
