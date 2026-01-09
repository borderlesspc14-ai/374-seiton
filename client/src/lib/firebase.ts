// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, type Analytics } from "firebase/analytics";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// Configuração carregada das variáveis de ambiente (.env.local)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Valida se as variáveis obrigatórias estão definidas
const isFirebaseConfigured = 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey && 
  firebaseConfig.projectId !== undefined &&
  firebaseConfig.apiKey !== undefined;

if (!isFirebaseConfigured) {
  console.warn(
    "⚠️ Firebase não está configurado. Configure as variáveis de ambiente VITE_FIREBASE_PROJECT_ID e VITE_FIREBASE_API_KEY no arquivo .env"
  );
}

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
  // Cria objetos mock para evitar erros em desenvolvimento
  console.warn("Firebase não inicializado. Funcionalidades de autenticação e banco de dados não estarão disponíveis.");
}

// Exporta auth e db (podem ser undefined se Firebase não estiver configurado)
export { auth, db };