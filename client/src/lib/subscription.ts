import { getUserProfile, updateSubscriptionPlan, isSubscriptionActive, UserProfile } from "./userProfile";

export type PlanType = 'basic' | 'premium';

export interface Plan {
  id: PlanType;
  name: string;
  price: string;
  priceValue: number;
  features: string[];
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: 'basic',
    name: "Básico",
    price: "Grátis",
    priceValue: 0,
    features: [
      "Acesso ao Seiton Planner",
      "Agenda básica",
      "Até 50 tarefas/mês",
      "Sistema de pontos e conquistas",
      "Suporte por email"
    ],
  },
  {
    id: 'premium',
    name: "Premium",
    price: "R$ 29,90/mês",
    priceValue: 29.90,
    features: [
      "Tudo do Básico",
      "Acesso ao AnotaChef",
      "Gestão Financeira Completa",
      "Controle de Estoque",
      "Tarefas ilimitadas",
      "Gamificação Avançada",
      "Suporte Prioritário",
      "Análises e Relatórios"
    ],
    highlight: true,
  },
];

/**
 * Obtém o plano atual do usuário
 */
export async function getCurrentPlan(userId: string): Promise<PlanType> {
  const profile = await getUserProfile(userId);
  return profile.subscriptionPlan || 'basic';
}

/**
 * Verifica se o usuário pode criar mais tarefas
 */
export async function canCreateTask(userId: string): Promise<{ canCreate: boolean; reason?: string }> {
  const profile = await getUserProfile(userId);
  const isActive = await isSubscriptionActive(userId);
  
  if (profile.subscriptionPlan === 'premium' && isActive) {
    return { canCreate: true }; // Premium tem tarefas ilimitadas
  }
  
  // Plano básico: limite de 50 tarefas por mês
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Contar tarefas do mês atual (isso seria feito com uma query, mas por simplicidade vamos usar o completedTasks)
  // Em produção, você deveria fazer uma query para contar tarefas do mês atual
  const monthlyTaskLimit = 50;
  
  // Por enquanto, vamos permitir se não exceder o limite geral
  if (profile.completedTasks < monthlyTaskLimit) {
    return { canCreate: true };
  }
  
  return {
    canCreate: false,
    reason: `Limite de ${monthlyTaskLimit} tarefas/mês atingido. Faça upgrade para Premium para tarefas ilimitadas.`
  };
}

/**
 * Formata a data de renovação
 */
export function formatRenewalDate(endDate: Date | null): string {
  if (!endDate) return "N/A";
  
  return endDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Calcula dias restantes da assinatura
 */
export function getDaysRemaining(endDate: Date | null): number {
  if (!endDate) return 0;
  
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}


