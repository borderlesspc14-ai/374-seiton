import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { Award, Flame, Star, Target, Trophy, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { getUserProfile, UserProfile } from "@/lib/userProfile";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

export default function Rewards() {
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [level, setLevel] = useState(1);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);

  const achievements: Achievement[] = [
    {
      id: "first-task",
      title: "Primeiro Passo",
      description: "Complete sua primeira tarefa",
      icon: "star",
      points: 50,
      unlocked: unlockedAchievements.includes("first-task") || completedTasks >= 1,
    },
    {
      id: "task-master",
      title: "Mestre das Tarefas",
      description: "Complete 10 tarefas",
      icon: "target",
      points: 200,
      unlocked: unlockedAchievements.includes("task-master") || completedTasks >= 10,
    },
    {
      id: "dedication",
      title: "Dedicação",
      description: "Complete 25 tarefas",
      icon: "flame",
      points: 500,
      unlocked: unlockedAchievements.includes("dedication") || completedTasks >= 25,
    },
    {
      id: "perfectionist",
      title: "Perfeccionista",
      description: "Complete 50 tarefas",
      icon: "trophy",
      points: 1000,
      unlocked: unlockedAchievements.includes("perfectionist") || completedTasks >= 50,
    },
    {
      id: "legend",
      title: "Lenda",
      description: "Complete 100 tarefas",
      icon: "award",
      points: 2500,
      unlocked: unlockedAchievements.includes("legend") || completedTasks >= 100,
    },
    {
      id: "streak",
      title: "Sequência",
      description: "Complete tarefas por 7 dias seguidos",
      icon: "zap",
      points: 300,
      unlocked: unlockedAchievements.includes("streak") || currentStreak >= 7,
    },
  ];

  useEffect(() => {
    if (!user) return;

    // Load initial profile
    const loadProfile = async () => {
      try {
        const profile = await getUserProfile(user.uid);
        setUserPoints(profile.totalPoints);
        setCompletedTasks(profile.completedTasks);
        setLevel(profile.level);
        setCurrentStreak(profile.currentStreak);
        setLongestStreak(profile.longestStreak);
        setUnlockedAchievements(profile.unlockedAchievements);
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      }
    };

    loadProfile();

    // Listen for user profile changes
    const profileRef = doc(db, "userProfiles", user.uid);
    const unsubscribeProfile = onSnapshot(profileRef, (snapshot) => {
      if (snapshot.exists()) {
        const profile = snapshot.data() as UserProfile;
        setUserPoints(profile.totalPoints || 0);
        setCompletedTasks(profile.completedTasks || 0);
        setLevel(profile.level || 1);
        setCurrentStreak(profile.currentStreak || 0);
        setLongestStreak(profile.longestStreak || 0);
        setUnlockedAchievements(profile.unlockedAchievements || []);
      }
    });

    return () => unsubscribeProfile();
  }, [user]);

  const pointsToNextLevel = (userPoints % 500);
  const progressToNextLevel = (pointsToNextLevel / 500) * 100;

  const getIcon = (iconName: string) => {
    const iconMap: Record<string, typeof Star> = {
      star: Star,
      target: Target,
      flame: Flame,
      trophy: Trophy,
      award: Award,
      zap: Zap,
    };
    return iconMap[iconName] || Star;
  };

  const unlockedAchievementsCount = achievements.filter((a) => a.unlocked).length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-700 font-display mb-2">Recompensas</h1>
          <p className="text-gray-500">Acompanhe seu progresso e desbloqueie conquistas</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-[#f0f2f5] border-none shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Pontos Totais</CardTitle>
              <Trophy className="w-5 h-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-700">{userPoints.toLocaleString()}</div>
              <p className="text-xs text-gray-400 mt-1">Continue completando tarefas!</p>
            </CardContent>
          </Card>

          <Card className="bg-[#f0f2f5] border-none shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Nível Atual</CardTitle>
              <Star className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-700">Nível {level}</div>
              <p className="text-xs text-gray-400 mt-1">
                {pointsToNextLevel > 0 ? `${500 - pointsToNextLevel} pontos para o próximo nível` : "Nível máximo alcançado!"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#f0f2f5] border-none shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Conquistas</CardTitle>
              <Award className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-700">
                {unlockedAchievementsCount}/{achievements.length}
              </div>
              <p className="text-xs text-gray-400 mt-1">Conquistas desbloqueadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Level Progress */}
        <Card className="bg-[#f0f2f5] border-none shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-700">Progresso para o Próximo Nível</CardTitle>
            <CardDescription>Nível {level} → Nível {level + 1}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{pointsToNextLevel} / 500 pontos</span>
                <span>{Math.round(progressToNextLevel)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff]">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 rounded-full"
                  style={{ width: `${progressToNextLevel}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-700 mb-6">Conquistas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => {
              const IconComponent = getIcon(achievement.icon);
              return (
                <Card
                  key={achievement.id}
                  className={cn(
                    "bg-[#f0f2f5] border-none transition-all duration-300",
                    achievement.unlocked
                      ? "shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] scale-100"
                      : "shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] opacity-60 scale-95"
                  )}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          achievement.unlocked
                            ? "bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff]"
                            : "bg-gray-300 shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff]"
                        )}
                      >
                        <IconComponent
                          className={cn(
                            "w-6 h-6",
                            achievement.unlocked ? "text-white" : "text-gray-500"
                          )}
                        />
                      </div>
                      {achievement.unlocked && (
                        <Badge className="bg-green-500 text-white">Desbloqueada</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-700 mt-4">
                      {achievement.title}
                    </CardTitle>
                    <CardDescription>{achievement.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Recompensa:</span>
                      <span className="text-lg font-bold text-yellow-600">
                        +{achievement.points} pts
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Rewards Info */}
        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Zap className="w-5 h-5" />
              Como Ganhar Pontos?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-gray-600">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="font-medium">Complete tarefas no Planner</p>
                  <p className="text-sm text-gray-500">Cada tarefa completa vale 10 pontos</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="font-medium">Desbloqueie conquistas</p>
                  <p className="text-sm text-gray-500">
                    Complete objetivos para ganhar pontos extras
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="font-medium">Suba de nível</p>
                  <p className="text-sm text-gray-500">
                    A cada 500 pontos você sobe um nível
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

