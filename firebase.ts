// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, type Analytics } from "firebase/analytics";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
// Configuração carregada das variáveis de ambiente (.env.local)
// NOTA: Este arquivo está na raiz do projeto. O arquivo principal do Firebase está em client/src/lib/firebase.ts
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Valida se as variáveis obrigatórias estão definidas
const isFirebaseConfigured = 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey && 
  firebaseConfig.projectId !== undefined &&
  firebaseConfig.apiKey !== undefined &&
  firebaseConfig.projectId !== "" &&
  firebaseConfig.apiKey !== "";

// Initialize Firebase apenas se estiver configurado
let app: ReturnType<typeof initializeApp> | undefined;
let analytics: Analytics | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    
    // Inicializa Analytics apenas se measurementId estiver definido
    if (firebaseConfig.measurementId) {
      try {
        analytics = getAnalytics(app);
      } catch (error) {
        console.warn("Firebase Analytics não pôde ser inicializado:", error);
      }
    }
    
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Erro ao inicializar Firebase:", error);
  }
} else {
  console.warn("Firebase não inicializado. Configure as variáveis de ambiente VITE_FIREBASE_* no arquivo .env");
}

// Exporta auth e db (podem ser undefined se Firebase não estiver configurado)
export { auth, db, app, analytics };