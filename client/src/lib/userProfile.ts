import { db } from "./firebase";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";

export interface UserProfile {
  userId: string;
  // Dados pessoais
  displayName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  // Dados de gamificação
  totalPoints: number;
  level: number;
  completedTasks: number;
  currentStreak: number;
  longestStreak: number;
  lastTaskDate: Timestamp | null;
  unlockedAchievements: string[];
  // Dados de assinatura
  subscriptionPlan: 'basic' | 'premium';
  subscriptionStartDate: Timestamp | null;
  subscriptionEndDate: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Inicializa ou obtém o perfil do usuário
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  const dbInstance = ensureDb();
  const profileRef = doc(dbInstance, "userProfiles", userId);
  const profileSnap = await getDoc(profileRef);

  if (profileSnap.exists()) {
    return profileSnap.data() as UserProfile;
  }

  // Cria um novo perfil se não existir
  const newProfile: Omit<UserProfile, "createdAt" | "updatedAt"> = {
    userId,
    displayName: undefined,
    phone: undefined,
    address: undefined,
    city: undefined,
    state: undefined,
    zipCode: undefined,
    totalPoints: 0,
    level: 1,
    completedTasks: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastTaskDate: null,
    unlockedAchievements: [],
    subscriptionPlan: 'basic',
    subscriptionStartDate: null,
    subscriptionEndDate: null,
  };

  await setDoc(profileRef, {
    ...newProfile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    ...newProfile,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  } as UserProfile;
}

/**
 * Verifica se o Firebase está configurado
 */
function ensureDb() {
  if (!db) {
    throw new Error("Firebase não está configurado. Configure as variáveis de ambiente.");
  }
  return db;
}

/**
 * Adiciona pontos ao perfil do usuário
 */
export async function addPointsToProfile(
  userId: string,
  points: number
): Promise<void> {
  const dbInstance = ensureDb();
  const profileRef = doc(dbInstance, "userProfiles", userId);
  
  // Garante que o perfil existe e busca o estado mais atualizado
  let profileSnap = await getDoc(profileRef);
  if (!profileSnap.exists()) {
    await getUserProfile(userId);
    profileSnap = await getDoc(profileRef);
  }
  
  // Busca novamente para garantir que temos o estado mais atualizado
  profileSnap = await getDoc(profileRef);
  const profile = profileSnap.data() as UserProfile;
  const currentPoints = profile.totalPoints || 0;
  const newTotalPoints = currentPoints + points;
  const newLevel = Math.max(1, Math.floor(newTotalPoints / 500) + 1);

  await updateDoc(profileRef, {
    totalPoints: increment(points),
    level: newLevel,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Remove pontos do perfil do usuário
 */
export async function removePointsFromProfile(
  userId: string,
  points: number
): Promise<void> {
  const dbInstance = ensureDb();
  const profileRef = doc(dbInstance, "userProfiles", userId);
  
  const profile = await getDoc(profileRef);
  const currentPoints = profile.data()!.totalPoints;
  const newTotalPoints = Math.max(0, currentPoints - points);
  const newLevel = Math.max(1, Math.floor(newTotalPoints / 500) + 1);

  await updateDoc(profileRef, {
    totalPoints: increment(-points),
    level: newLevel,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Incrementa o contador de tarefas completadas
 */
export async function incrementCompletedTasks(userId: string): Promise<void> {
  const dbInstance = ensureDb();
  const profileRef = doc(dbInstance, "userProfiles", userId);
  
  await getUserProfile(userId);
  
  await updateDoc(profileRef, {
    completedTasks: increment(1),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Decrementa o contador de tarefas completadas
 */
export async function decrementCompletedTasks(userId: string): Promise<void> {
  const dbInstance = ensureDb();
  const profileRef = doc(dbInstance, "userProfiles", userId);
  
  await updateDoc(profileRef, {
    completedTasks: increment(-1),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Atualiza o streak do usuário
 */
export async function updateStreak(userId: string, taskDate: Date): Promise<void> {
  const dbInstance = ensureDb();
  const profileRef = doc(dbInstance, "userProfiles", userId);
  const profileSnap = await getDoc(profileRef);
  
  if (!profileSnap.exists()) {
    await getUserProfile(userId);
    return;
  }

  const profile = profileSnap.data() as UserProfile;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const taskDateOnly = new Date(taskDate);
  taskDateOnly.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let newStreak = profile.currentStreak;
  let newLongestStreak = profile.longestStreak;

  if (!profile.lastTaskDate) {
    // Primeira tarefa
    newStreak = 1;
  } else {
    const lastTaskDate = profile.lastTaskDate.toDate();
    lastTaskDate.setHours(0, 0, 0, 0);
    
    if (taskDateOnly.getTime() === today.getTime()) {
      // Tarefa de hoje
      if (lastTaskDate.getTime() === yesterday.getTime()) {
        // Continua o streak
        newStreak = profile.currentStreak + 1;
      } else if (lastTaskDate.getTime() === today.getTime()) {
        // Já completou hoje, mantém o streak
        newStreak = profile.currentStreak;
      } else {
        // Quebrou o streak, começa novo
        newStreak = 1;
      }
    } else {
      // Tarefa de outro dia (não atualiza streak)
      newStreak = profile.currentStreak;
    }
  }

  if (newStreak > profile.longestStreak) {
    newLongestStreak = newStreak;
  }

  await updateDoc(profileRef, {
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    lastTaskDate: Timestamp.fromDate(taskDateOnly),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Desbloqueia uma conquista
 */
export async function unlockAchievement(
  userId: string,
  achievementId: string
): Promise<void> {
  const dbInstance = ensureDb();
  const profileRef = doc(dbInstance, "userProfiles", userId);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    await getUserProfile(userId);
  }

  const profile = profileSnap.data() as UserProfile;
  
  if (!profile.unlockedAchievements.includes(achievementId)) {
    await updateDoc(profileRef, {
      unlockedAchievements: [...profile.unlockedAchievements, achievementId],
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * Verifica e desbloqueia conquistas baseado no progresso
 */
export async function checkAndUnlockAchievements(
  userId: string,
  completedTasks: number,
  currentStreak: number
): Promise<string[]> {
  const achievements = [
    { id: "first-task", required: 1, points: 50 },
    { id: "task-master", required: 10, points: 200 },
    { id: "dedication", required: 25, points: 500 },
    { id: "perfectionist", required: 50, points: 1000 },
    { id: "legend", required: 100, points: 2500 },
    { id: "streak", required: 7, points: 300, type: "streak" },
  ];

  const newlyUnlocked: string[] = [];
  const dbInstance = ensureDb();
  const profileRef = doc(dbInstance, "userProfiles", userId);
  const profileSnap = await getDoc(profileRef);
  
  if (!profileSnap.exists()) {
    await getUserProfile(userId);
    return [];
  }

  const profile = profileSnap.data() as UserProfile;

  for (const achievement of achievements) {
    const condition = achievement.type === "streak" 
      ? currentStreak >= achievement.required
      : completedTasks >= achievement.required;

    // Verifica se a conquista já foi desbloqueada
    const alreadyUnlocked = profile.unlockedAchievements.includes(achievement.id);

    if (condition && !alreadyUnlocked) {
      try {
        // Desbloqueia a conquista primeiro
        await unlockAchievement(userId, achievement.id);
        
        // Busca o perfil atualizado antes de adicionar pontos
        const updatedProfileSnap = await getDoc(profileRef);
        const updatedProfile = updatedProfileSnap.exists() 
          ? (updatedProfileSnap.data() as UserProfile)
          : profile;
        
        // Adiciona os pontos da conquista (isso também atualizará o nível)
        await addPointsToProfile(userId, achievement.points);
        
        // Atualiza o perfil local para a próxima iteração
        const finalProfileSnap = await getDoc(profileRef);
        if (finalProfileSnap.exists()) {
          Object.assign(profile, finalProfileSnap.data());
        }
        
        newlyUnlocked.push(achievement.id);
      } catch (error) {
        console.error(`Erro ao desbloquear conquista ${achievement.id}:`, error);
      }
    }
  }

  return newlyUnlocked;
}

/**
 * Atualiza o plano de assinatura do usuário
 */
export async function updateSubscriptionPlan(
  userId: string,
  plan: 'basic' | 'premium',
  months: number = 1
): Promise<void> {
  const dbInstance = ensureDb();
  const profileRef = doc(dbInstance, "userProfiles", userId);
  
  await getUserProfile(userId);
  
  const startDate = Timestamp.now();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + months);
  
  await updateDoc(profileRef, {
    subscriptionPlan: plan,
    subscriptionStartDate: startDate,
    subscriptionEndDate: Timestamp.fromDate(endDate),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Verifica se o plano de assinatura está ativo
 */
export async function isSubscriptionActive(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId);
  
  if (profile.subscriptionPlan === 'basic') {
    return true; // Plano básico sempre ativo
  }
  
  if (!profile.subscriptionEndDate) {
    return false;
  }
  
  const endDate = profile.subscriptionEndDate.toDate();
  return endDate > new Date();
}

/**
 * Verifica se o usuário tem acesso a uma feature específica
 */
export async function hasFeatureAccess(
  userId: string,
  feature: 'planner' | 'anotachef' | 'rewards' | 'advanced_gamification'
): Promise<boolean> {
  const profile = await getUserProfile(userId);
  const isActive = await isSubscriptionActive(userId);
  
  if (!isActive && profile.subscriptionPlan === 'premium') {
    return false; // Assinatura premium expirada
  }
  
  // Plano básico tem acesso limitado
  if (profile.subscriptionPlan === 'basic') {
    return feature === 'planner' || feature === 'rewards';
  }
  
  // Plano premium tem acesso a tudo
  return true;
}

/**
 * Atualiza dados pessoais do perfil do usuário
 */
export async function updateUserProfileData(
  userId: string,
  data: {
    displayName?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  }
): Promise<void> {
  const dbInstance = ensureDb();
  const profileRef = doc(dbInstance, "userProfiles", userId);
  
  await getUserProfile(userId);
  
  const updateData: any = {
    updatedAt: serverTimestamp(),
  };
  
  if (data.displayName !== undefined) updateData.displayName = data.displayName || null;
  if (data.phone !== undefined) updateData.phone = data.phone || null;
  if (data.address !== undefined) updateData.address = data.address || null;
  if (data.city !== undefined) updateData.city = data.city || null;
  if (data.state !== undefined) updateData.state = data.state || null;
  if (data.zipCode !== undefined) updateData.zipCode = data.zipCode || null;
  
  await updateDoc(profileRef, updateData);
}

/**
 * Atualiza o email do usuário (Firebase Auth)
 */
export async function updateUserEmail(
  newEmail: string
): Promise<void> {
  const { updateEmail } = await import("firebase/auth");
  const { auth } = await import("./firebase");
  
  if (!auth) {
    throw new Error("Firebase não está configurado");
  }
  
  if (!auth.currentUser) {
    throw new Error("Usuário não autenticado");
  }
  
  await updateEmail(auth.currentUser, newEmail);
}

