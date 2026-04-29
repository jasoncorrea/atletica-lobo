
import { 
  Competition, Athletic, Modality, Result, Penalty, 
  DEFAULT_SCORE_RULE, AppConfig, LeaderboardEntry,
  Transaction, FinanceCategory, Product, BirthdayMember,
  ShareMember, SharePost, ShareRecord, Socio, PlannerEvent,
  Declaration
} from '../types';
import { INITIAL_SEED_MODALITIES, INITIAL_ATHLETICS, DEFAULT_FINANCE_CATEGORIES, DB_KEY, APP_CONFIG_KEY } from '../constants';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, onSnapshot, doc, setDoc, getDoc, 
  writeBatch, query, deleteDoc, getDocFromServer, getDocs, disableNetwork
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
const getFinalConfig = () => {
  const env = (import.meta as any).env || {};
  return {
    apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
    projectId: env.VITE_FIREBASE_PROJECT_ID || env.ID_DO_PROJETO_VITE_FIREBASE || firebaseConfig.projectId,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || env.BALDE_DE_ARMAZENAMENTO_VITE_FIREBASE_DE_ || firebaseConfig.storageBucket,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
    appId: env.VITE_FIREBASE_APP_ID || env.ID_DO_APLICATIVO_VITE_FIREBASE || firebaseConfig.appId,
    // Always use firebaseConfig's DB ID if available to override stale env vars
    firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || env.VITE_FIREBASE_DATABASE_ID || env.ID_DO_BANCO_DE_DADOS_VITE_FIREBASE || '(default)'
  };
};

const finalConfig = getFinalConfig();
const app = initializeApp(finalConfig);
export const auth = getAuth(app);

// State management
let currentDbId = (finalConfig as any).firestoreDatabaseId || '(default)';
const backupDatabaseIds: string[] = []; 
let quotaExceeded = false;
let isFirebaseReady = false;

export const isQuotaExceeded = () => quotaExceeded;
export const getCurrentDbId = () => currentDbId;

const getFirestoreInstance = (dbId: string) => {
  return getFirestore(app, dbId);
};

export let db = getFirestoreInstance(currentDbId);

export const switchToNextDatabase = () => {
  if (backupDatabaseIds.length > 0) {
    const nextId = backupDatabaseIds.shift();
    if (nextId) {
      currentDbId = nextId;
      db = getFirestoreInstance(currentDbId);
      console.warn(`Switched to backup database: ${currentDbId}`);
      quotaExceeded = false; // Reset temporary flag to try the new DB
      return true;
    }
  }
  return false;
};

const safeStringify = (obj: any): string => {
  try {
    return JSON.stringify(obj);
  } catch (err) {
    try {
      const cache = new Set();
      return JSON.stringify(obj, (_key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (cache.has(value)) return '[Circular]';
          cache.add(value);
        }
        return value;
      });
    } catch (innerErr) {
      return '[Unstringifiable Object]';
    }
  }
};

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection established.");
    isFirebaseReady = true;
  } catch (error: any) {
    if (error.code === 'resource-exhausted' || error.message?.includes('Quota limit exceeded')) {
      handleFirestoreError(error, 'test-connection');
    }
    if (error.code === 'permission-denied' || error.message?.includes('insufficient permissions')) {
      // Missing rule for test collection, which means connection succeeded!
      console.log("Firebase connection established (permission denied on test document).");
      isFirebaseReady = true;
    } else if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: " + error.message);
    }
  }
}
testConnection();

export const handleFirestoreError = (error: any, op: string, path: string | null = null) => {
  if (error.code === 'resource-exhausted' || error.message?.includes('Quota limit exceeded')) {
    console.warn(`Quota limit exceeded for DB ${currentDbId} during ${op} at ${path}.`);
    
    // Attempt failover to another DB instance
    const switched = switchToNextDatabase();
    if (!switched) {
      quotaExceeded = true;
      console.warn("No more cloud databases available. Local Mode active.");
    }
    return true; 
  }

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
        providerInfo: user?.providerData.map((p: any) => ({
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
  plannerEvents: PlannerEvent[];
  declaracoes: Declaration[];
}

const initialDb: DatabaseSchema = {
  competitions: [
    {
      id: 'default-comp',
      name: 'JOIA PG 2026',
      year: 2026,
      isActive: true,
      createdAt: Date.now(),
    }
  ],
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
  plannerEvents: [],
  declaracoes: []
};

// State management
const loadInitialDb = (): DatabaseSchema => {
  const saved = localStorage.getItem(DB_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Merge with initialDb to ensure new collections exist
      return { ...initialDb, ...parsed };
    } catch (e) {
      console.error("Error parsing saved DB:", e);
    }
  }
  
  // Inject some fake initial data if totally blank as the user requested "launching directly to the site"
  return {
    ...initialDb,
    plannerEvents: [
      { id: 'ev1', title: 'REUNIÃO DE DIRETORIA GERAL', date: Date.now() + 86400000, category: 'REUNIÃO' },
      { id: 'ev2', title: 'ENTREGA DE DOCUMENTOS JOIA', date: Date.now() + 86400000 * 3, category: 'PRAZO/ENTREGA' },
      { id: 'ev3', title: 'AMISTOSO COM A DIREITO UEPG', date: Date.now() + 86400000 * 5, category: 'AMISTOSO/ESPORTES' }
    ],
    products: [], // Just to be safe with UI
  };
};

const loadInitialConfig = (): AppConfig => {
  const saved = localStorage.getItem(APP_CONFIG_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Error parsing saved config:", e);
    }
  }
  return {
    primaryColor: '#5a0509',
    secondaryColor: '#000000',
    logoUrl: null,
    publicEventCategories: ['EVENTO', 'COMPETIÇÃO']
  };
};

let currentDb: DatabaseSchema = loadInitialDb();
let currentConfig: AppConfig = loadInitialConfig();

// Syncing Firestore collections to Local State
const activeListeners: Record<string, { unsub: () => void, count: number }> = {};

export const startListener = (colName: string) => {
  if (activeListeners[colName]) {
    activeListeners[colName].count++;
    return;
  }
  
  const unsub = onSnapshot(collection(db, colName), (snapshot) => {
    const cloudData = snapshot.docs.map(d => ({ ...(d.data() as any), id: d.id }));
    const localData = (currentDb as any)[colName];
    
    // Protect local data: If cloud is completely empty but local has data, upload local data!
    if (cloudData.length === 0 && Array.isArray(localData) && localData.length > 0) {
      if (!quotaExceeded) {
        const batch = writeBatch(db);
        localData.forEach(item => {
          if (item && item.id) batch.set(doc(db, colName, item.id.toString()), item);
        });
        batch.commit().catch(e => console.error("Auto-sync empty cloud failed", e));
      }
      return; // Keep local data intact!
    }
    
    // Always trust cloud over local to keep multiple devices in sync
    if (colName === 'scoreRules') {
      const map: any = {};
      cloudData.forEach((item: any) => {
        if (item.id) map[item.id] = item.rule;
      });
      currentDb.scoreRules = map;
    } else {
      (currentDb as any)[colName] = cloudData;
    }
    
    localStorage.setItem(DB_KEY, safeStringify(currentDb));
    window.dispatchEvent(new Event('storage'));
  }, (err) => {
    delete activeListeners[colName];
    console.error(`Error syncing ${colName}:`, err);
  });

  activeListeners[colName] = { unsub, count: 1 };
};

export const stopListener = (colName: string) => {
  if (activeListeners[colName]) {
    activeListeners[colName].count--;
    if (activeListeners[colName].count <= 0) {
      activeListeners[colName].unsub();
      delete activeListeners[colName];
    }
  }
};

// Manage restricted listeners based on Auth state
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // Cleanup any active listeners on logout
    Object.keys(activeListeners).forEach(colName => {
      activeListeners[colName].unsub();
      delete activeListeners[colName];
    });
  }
});

// Syncing Config
onSnapshot(doc(db, 'config', 'global'), (snapshot) => {
  if (snapshot.exists()) {
    currentConfig = snapshot.data() as AppConfig;
    localStorage.setItem(APP_CONFIG_KEY, safeStringify(currentConfig));
    window.dispatchEvent(new Event('storage'));
  }
}, (err) => {
  if (err.message?.includes('Quota limit exceeded')) {
    console.warn("Quota exceeded for config. Using local cache.");
  } else {
    console.error("Error syncing config:", err);
  }
});

// Auto-seed athletics if empty in Firestore and No data in local
async function seedInitialData() {
  // If we already have data in local, don't seed (it might overwrite or create duplicates if we are not careful)
  // But wait, if local has data and cloud doesn't, we SHOULD seed the cloud eventually.
  // However, for quota safety, we only seed if BOTH are empty.
  if (currentDb.athletics.length > 0 && currentDb.competitions.length > 0) return;
  if (quotaExceeded) return;

  try {
    // Check if cloud is truly empty
    const athleticsSnap = await getDoc(doc(db, 'athletics', INITIAL_ATHLETICS[0].id));
    if (!athleticsSnap.exists()) {
      const batch = writeBatch(db);
      INITIAL_ATHLETICS.forEach(a => {
        batch.set(doc(db, 'athletics', a.id), a);
      });
      await batch.commit();
      console.log("Seeded initial athletics to Firestore.");
    }
  } catch (err) {
    handleFirestoreError(err, 'write', 'seed/athletics');
  }
}
seedInitialData();

export const addItem = async <K extends keyof DatabaseSchema>(collectionName: K, item: any, customId?: string) => {
  const id = customId || item.id || Math.random().toString(36).substring(2, 9);
  const data = { ...item, id };

  // Always update local state first for optimistic UI
  const list = (currentDb as any)[collectionName];
  if (Array.isArray(list)) {
    const itemExists = list.some((i: any) => i.id === id);
    if (!itemExists) {
      (currentDb as any)[collectionName] = [data, ...list];
    } else {
      (currentDb as any)[collectionName] = list.map((i: any) => i.id === id ? data : i);
    }
  }
  localStorage.setItem(DB_KEY, safeStringify(currentDb));
  window.dispatchEvent(new Event('storage'));

  // Fire and forget Firestore sync
  if (!quotaExceeded) {
    Promise.race([
      setDoc(doc(db, collectionName as string, id), data),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
    ]).catch((err: any) => {
      if (err.message !== 'timeout') {
        console.error('Firestore save error:', err);
        try { handleFirestoreError(err, 'create', collectionName as string); } catch(e) {
          console.error('Handled error thrown:', e);
        }
      } else {
        console.warn(`Firestore save timeout for ${collectionName}/${id}. Saved locally.`);
      }
    });
  }
  
  return data;
};

export const updateItem = async <K extends keyof DatabaseSchema>(collectionName: K, id: string, updates: Partial<any>) => {
  // Update local state first for optimistic UI
  const list = (currentDb as any)[collectionName];
  if (Array.isArray(list)) {
    (currentDb as any)[collectionName] = list.map((i: any) => 
      i.id === id ? { ...i, ...updates } : i
    );
  }
  localStorage.setItem(DB_KEY, safeStringify(currentDb));
  window.dispatchEvent(new Event('storage'));

  try {
    if (!quotaExceeded) {
      await Promise.race([
        setDoc(doc(db, collectionName as string, id), updates, { merge: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]);
    }
  } catch (err: any) {
    if (err.message !== 'timeout') {
      handleFirestoreError(err, 'update', `${collectionName as string}/${id}`);
    } else {
      console.warn(`Firestore update timeout for ${collectionName}/${id}. Saved locally.`);
    }
  }
};

export const saveItems = async <K extends keyof DatabaseSchema>(collectionName: K, items: any[]) => {
  try {
    if (!quotaExceeded) {
      const BATCH_SIZE = 400;
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = items.slice(i, i + BATCH_SIZE);
        chunk.forEach(item => {
          if (item.id) {
            batch.set(doc(db, collectionName as string, item.id), item);
          }
        });
        await batch.commit();
      }
    }
  } catch (err) {
    handleFirestoreError(err, 'write', collectionName as string);
  }
  
  // Update local state
  (currentDb as any)[collectionName] = items;
  localStorage.setItem(DB_KEY, safeStringify(currentDb));
  window.dispatchEvent(new Event('storage'));
};

export const clearCollection = async <K extends keyof DatabaseSchema>(collectionName: K) => {
  try {
    if (!quotaExceeded) {
      const dbRef = collection(db, collectionName as string);
      const snapshot = await getDocs(dbRef);
      
      const BATCH_SIZE = 400;
      const docs = snapshot.docs;
      
      for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + BATCH_SIZE);
        chunk.forEach((d: any) => {
          batch.delete(d.ref);
        });
        await batch.commit();
      }
    }
  } catch (err) {
    handleFirestoreError(err, 'delete', collectionName as string);
  }

  // Update local state
  (currentDb as any)[collectionName] = [];
  localStorage.setItem(DB_KEY, safeStringify(currentDb));
  window.dispatchEvent(new Event('storage'));
};

export const getDb = (): DatabaseSchema => {
  return currentDb;
};

export const saveDb = async (dbUpdate: DatabaseSchema) => {
  try {
    if (!quotaExceeded) {
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
    }
  } catch (err) {
    handleFirestoreError(err, 'write');
  }

  localStorage.setItem(DB_KEY, safeStringify(dbUpdate));
  window.dispatchEvent(new Event('storage'));
};

export const getConfig = (): AppConfig => {
  return currentConfig;
};

export const saveConfig = async (config: AppConfig) => {
  try {
    if (!quotaExceeded) {
      await setDoc(doc(db, 'config', 'global'), config);
    }
  } catch (err) {
    handleFirestoreError(err, 'write', 'config/global');
  }
  localStorage.setItem(APP_CONFIG_KEY, safeStringify(config));
  window.dispatchEvent(new Event('storage'));
};

export const isOnline = () => true; // Always online with managed Firebase

export const deleteItem = async (collectionName: keyof DatabaseSchema, id: string) => {
  // Always update local state first
  const list = (currentDb as any)[collectionName];
  if (Array.isArray(list)) {
    (currentDb as any)[collectionName] = list.filter((i: any) => i.id !== id);
  }
  localStorage.setItem(DB_KEY, safeStringify(currentDb));
  window.dispatchEvent(new Event('storage'));

  try {
    if (!quotaExceeded) {
      await Promise.race([
        deleteDoc(doc(db, collectionName as string, id)),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]);
    }
  } catch (err: any) {
    if (err.message !== 'timeout') {
      handleFirestoreError(err, 'delete', `${collectionName}/${id}`);
    } else {
      console.warn(`Firestore delete timeout for ${collectionName}/${id}. Removed locally.`);
    }
  }
};

const JOIA_PG_ATHLETICS_NAMES = [
  'XV DE OUTUBRO', 'CAPETADA', 'LOS BRAVOS', 'DIREITO UEPG', 'MEDICINA UEPG', 
  'CAÓTICOS', 'BÁRBAROS', 'JAVAS', 'SHARKS', 'VI DE NOVEMBRO', 'LOBO', 
  'IMPÉRIO JURÍDICO', 'CORVOS', 'CORINGAÇO', 'HUNTERS', 'SOBERANA', 
  'GORILAS', 'TROIA', 'XIX DE SETEMBRO', 'Z.'
];

export const createCompetition = async (name: string, year: number) => {
  const id = Math.random().toString(36).substring(2, 9);
  const newComp: Competition = {
    id,
    name,
    year,
    isActive: true,
    createdAt: Date.now()
  };

  // Determine athletics to seed based on templates
  let athleticsToSeed: Partial<Athletic>[] = [];
  const normalizedName = name.toUpperCase();

  if (normalizedName.includes('JOIA PG')) {
    athleticsToSeed = JOIA_PG_ATHLETICS_NAMES.map(n => ({
      name: n,
      logoUrl: null
    }));
  } else if (normalizedName.includes('ENGENHARIADAS PARANAENSE')) {
    // Find most recent EP
    const previousEP = [...currentDb.competitions]
      .filter(c => c.name.toUpperCase().includes('ENGENHARIADAS PARANAENSE'))
      .sort((a, b) => b.createdAt - a.createdAt)[0];
    
    if (previousEP) {
      const oldAthletics = currentDb.athletics.filter(a => a.competitionId === previousEP.id);
      athleticsToSeed = oldAthletics.map(a => ({
        name: a.name,
        logoUrl: a.logoUrl
      }));
    }
  }

  const modalitiesToSeed = INITIAL_SEED_MODALITIES.map(seed => ({
    id: Math.random().toString(36).substring(2, 9),
    competitionId: id,
    name: seed.name,
    gender: seed.gender,
    status: 'pending' as const
  }));

  const athleticsToSeedFinal = athleticsToSeed.map(seed => ({
    id: Math.random().toString(36).substring(2, 9),
    competitionId: id,
    name: seed.name!,
    logoUrl: seed.logoUrl || null
  }));

  try {
    if (!quotaExceeded) {
      const batch = writeBatch(db);
      
      // Deactivate others
      currentDb.competitions.forEach(c => {
        batch.update(doc(db, 'competitions', c.id), { isActive: false });
      });

      batch.set(doc(db, 'competitions', id), newComp);

      modalitiesToSeed.forEach(data => {
        batch.set(doc(db, 'modalities', data.id), data);
      });

      athleticsToSeedFinal.forEach(data => {
        batch.set(doc(db, 'athletics', data.id), data);
      });

      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, 'create', 'competitions');
  }

  // Update local state
  currentDb.competitions = currentDb.competitions.map(c => ({ ...c, isActive: false }));
  if (!currentDb.competitions.some(c => c.id === id)) {
    currentDb.competitions.push(newComp);
  }

  // Seed with consistent IDs
  currentDb.modalities.push(...modalitiesToSeed);
  currentDb.athletics.push(...athleticsToSeedFinal);

  localStorage.setItem(DB_KEY, safeStringify(currentDb));
  window.dispatchEvent(new Event('storage'));
  
  return newComp;
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
