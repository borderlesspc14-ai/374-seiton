import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { getUserProfile, UserProfile } from "@/lib/userProfile";
import { cn } from "@/lib/utils";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { ArrowRight, Calendar, ChefHat, TrendingUp, Trophy } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  date: Date | any;
  points: number;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: Date | any;
}

export default function Home() {
  const { user } = useAuth();
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!user) return;

    // Load user profile
    const loadProfile = async () => {
      try {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      }
    };

    loadProfile();

    if (!db) {
      if (import.meta.env.DEV) {
        console.warn("Firebase não está configurado");
      }
      return;
    }

    // Listen for user profile changes
    const profileRef = doc(db, "userProfiles", user.uid);
    const unsubscribeProfile = onSnapshot(profileRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserProfile(snapshot.data() as UserProfile);
      }
    });

    // Get upcoming tasks (not completed)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tasksQuery = query(
      collection(db, "tasks"),
      where("userId", "==", user.uid),
      where("completed", "==", false)
    );

    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasks = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          const taskDate = data.date?.toDate ? data.date.toDate() : new Date(data.date);
          return {
            id: doc.id,
            ...data,
            date: taskDate,
          } as Task;
        })
        .filter((task) => {
          // Only show tasks from today onwards
          const taskDate = task.date instanceof Date ? task.date : task.date.toDate();
          return taskDate >= today;
        })
        .sort((a, b) => {
          // Sort by date ascending
          const dateA = a.date instanceof Date ? a.date : a.date.toDate();
          const dateB = b.date instanceof Date ? b.date : b.date.toDate();
          return dateA.getTime() - dateB.getTime();
        })
        .slice(0, 5); // Limit to 5 tasks
      
      setUpcomingTasks(tasks);
    }, (error) => {
      console.error("Erro ao carregar tarefas:", error);
      // Fallback: try without orderBy if index doesn't exist
      const fallbackQuery = query(
        collection(db, "tasks"),
        where("userId", "==", user.uid)
      );
      
      onSnapshot(fallbackQuery, (snapshot) => {
        const tasks = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            if (data.completed) return null;
            const taskDate = data.date?.toDate ? data.date.toDate() : new Date(data.date);
            return {
              id: doc.id,
              ...data,
              date: taskDate,
            } as Task;
          })
          .filter((task): task is Task => {
            if (!task) return false;
            const taskDate = task.date instanceof Date ? task.date : task.date.toDate();
            return taskDate >= today;
          })
          .sort((a, b) => {
            const dateA = a.date instanceof Date ? a.date : a.date.toDate();
            const dateB = b.date instanceof Date ? b.date : b.date.toDate();
            return dateA.getTime() - dateB.getTime();
          })
          .slice(0, 5);
        
        setUpcomingTasks(tasks);
      });
    });

    // Get transactions
    const transactionsQuery = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid)
    );

    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const trans = snapshot.docs.map((doc) => {
        const data = doc.data();
        const transDate = data.date?.toDate ? data.date.toDate() : new Date(data.date);
        return {
          id: doc.id,
          ...data,
          date: transDate,
        } as Transaction;
      });
      setTransactions(trans);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeTasks();
      unsubscribeTransactions();
    };
  }, [user]);

  const pointsToNextLevel = userProfile ? (userProfile.totalPoints % 500) : 0;
  const progressPercentage = userProfile ? ((pointsToNextLevel / 500) * 100) : 0;
  const pointsNeeded = 500 - pointsToNextLevel;

  // Process transactions for chart (last 6 months)
  const chartData = useMemo(() => {
    const now = new Date();
    const months: { [key: string]: { income: number; expense: number } } = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      months[key] = { income: 0, expense: 0 };
    }

    // Process transactions
    transactions.forEach((transaction) => {
      try {
        const transDate = transaction.date instanceof Date 
          ? transaction.date 
          : (transaction.date?.toDate ? transaction.date.toDate() : new Date(transaction.date));
        
        // Only include transactions from last 6 months
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        sixMonthsAgo.setHours(0, 0, 0, 0);
        
        const transDateOnly = new Date(transDate);
        transDateOnly.setHours(0, 0, 0, 0);
        
        if (transDateOnly >= sixMonthsAgo) {
          const monthKey = transDateOnly.toLocaleDateString('pt-BR', { 
            month: 'short', 
            year: 'numeric' 
          });
          
          if (months[monthKey]) {
            const amount = Number(transaction.amount) || 0;
            if (transaction.type === 'income') {
              months[monthKey].income += amount;
            } else if (transaction.type === 'expense') {
              months[monthKey].expense += amount;
            }
          }
        }
      } catch (error) {
        console.error("Erro ao processar transação:", error, transaction);
      }
    });

    return Object.entries(months).map(([month, data]) => ({
      month,
      Receitas: data.income,
      Despesas: data.expense,
    }));
  }, [transactions]);

  const totalIncome = useMemo(() => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const balance = totalIncome - totalExpense;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-3xl bg-[#f0f2f5] shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] p-8 md:p-12">
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-4xl font-bold text-gray-700 font-display mb-4">
              Olá, <span className="text-primary">{user?.email?.split('@')[0]}</span>!
            </h1>
            <p className="text-lg text-gray-500 mb-8">
              Bem-vindo ao seu painel de controle. Hoje é um ótimo dia para organizar seu negócio e alcançar novas metas.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/planner">
                <Button className="h-12 px-6 rounded-xl bg-primary text-white shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] hover:bg-primary/90 hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)] transition-all">
                  Ver Agenda
                </Button>
              </Link>
              <Link href="/anotachef">
                <Button variant="outline" className="h-12 px-6 rounded-xl border-none bg-[#f0f2f5] text-gray-700 shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] hover:text-primary hover:shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] transition-all">
                  Registrar Finanças
                </Button>
              </Link>
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        </div>

        {/* Quick Access Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Planner Card */}
          <Link href="/planner">
            <Card className="group cursor-pointer bg-[#f0f2f5] border-none shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] hover:shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold text-gray-700">Seiton Planner</CardTitle>
                <Calendar className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">Organize sua agenda e tarefas diárias.</p>
                <div className="flex items-center text-primary text-sm font-medium">
                  Acessar <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* AnotaChef Card */}
          <Link href="/anotachef">
            <Card className="group cursor-pointer bg-[#f0f2f5] border-none shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] hover:shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold text-gray-700">AnotaChef</CardTitle>
                <ChefHat className="w-6 h-6 text-secondary group-hover:scale-110 transition-transform" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">Controle financeiro e de estoque.</p>
                <div className="flex items-center text-secondary text-sm font-medium">
                  Gerenciar <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Gamification Card */}
          <Link href="/rewards">
            <Card className="group cursor-pointer bg-[#f0f2f5] border-none shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] hover:shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold text-gray-700">Suas Conquistas</CardTitle>
                <Trophy className="w-6 h-6 text-yellow-500 group-hover:scale-110 transition-transform" />
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-3xl font-bold text-gray-700">
                    {userProfile?.totalPoints.toLocaleString() || 0}
                  </span>
                  <span className="text-sm text-gray-500 mb-1">pontos</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff]">
                  <div 
                    className="bg-yellow-500 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {pointsNeeded > 0 
                    ? `Faltam ${pointsNeeded} pts para o próximo nível!`
                    : "Nível máximo alcançado!"}
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity / Stats Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-[#f0f2f5] border-none shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-700">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="h-[200px] flex flex-col items-center justify-center text-gray-400 bg-[#f0f2f5] rounded-xl shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff]">
                  <TrendingUp className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm mb-2">Nenhuma transação registrada</p>
                  <Link href="/anotachef">
                    <Button 
                      variant="ghost" 
                      className="text-primary hover:text-primary/80"
                    >
                      Registrar primeira transação
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-xl bg-green-50 shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff]">
                      <p className="text-xs text-gray-500 mb-1">Receitas</p>
                      <p className="text-lg font-bold text-green-600">
                        R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-red-50 shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff]">
                      <p className="text-xs text-gray-500 mb-1">Despesas</p>
                      <p className="text-lg font-bold text-red-600">
                        R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className={cn(
                      "text-center p-3 rounded-xl shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff]",
                      balance >= 0 ? "bg-blue-50" : "bg-orange-50"
                    )}>
                      <p className="text-xs text-gray-500 mb-1">Saldo</p>
                      <p className={cn(
                        "text-lg font-bold",
                        balance >= 0 ? "text-blue-600" : "text-orange-600"
                      )}>
                        R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {/* Chart */}
                  {chartData.length > 0 ? (
                    <div className="h-[250px] w-full">
                      <ChartContainer
                        config={{
                          Receitas: {
                            label: "Receitas",
                            color: "hsl(142, 76%, 36%)",
                          },
                          Despesas: {
                            label: "Despesas",
                            color: "hsl(0, 84%, 60%)",
                          },
                        }}
                        className="h-full w-full"
                      >
                        <LineChart 
                          data={chartData}
                          margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="month" 
                            tick={{ fill: '#6b7280', fontSize: 11 }}
                            stroke="#d1d5db"
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            tick={{ fill: '#6b7280', fontSize: 11 }}
                            stroke="#d1d5db"
                            tickFormatter={(value) => {
                              if (value >= 1000) {
                                return `R$ ${(value / 1000).toFixed(1)}k`;
                              }
                              return `R$ ${value}`;
                            }}
                          />
                          <ChartTooltip 
                            content={<ChartTooltipContent />}
                            formatter={(value: number, name: string) => [
                              `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                              name
                            ]}
                          />
                          <Legend 
                            wrapperStyle={{ paddingTop: '10px' }}
                            iconType="line"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="Receitas" 
                            stroke="hsl(142, 76%, 36%)"
                            strokeWidth={2}
                            dot={{ fill: "hsl(142, 76%, 36%)", r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="Despesas" 
                            stroke="hsl(0, 84%, 60%)"
                            strokeWidth={2}
                            dot={{ fill: "hsl(0, 84%, 60%)", r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ChartContainer>
                    </div>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-gray-400 bg-[#f0f2f5] rounded-xl shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff]">
                      <p className="text-sm">Não há dados suficientes para exibir o gráfico</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#f0f2f5] border-none shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-5 h-5 text-primary" />
                Próximas Tarefas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhuma tarefa agendada</p>
                  <Link href="/planner">
                    <Button 
                      variant="ghost" 
                      className="mt-4 text-primary hover:text-primary/80"
                    >
                      Criar primeira tarefa
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingTasks.map((task) => {
                    const taskDate = task.date instanceof Date ? task.date : task.date.toDate();
                    const isToday = taskDate.toDateString() === new Date().toDateString();
                    const isTomorrow = taskDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
                    
                    return (
                      <Link key={task.id} href="/planner">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f0f2f5] shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] hover:shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff] transition-all cursor-pointer group">
                          <div className={cn(
                            "w-3 h-3 rounded-full transition-all",
                            isToday ? "bg-primary" : "bg-primary/50 group-hover:bg-primary"
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">
                              {task.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {isToday 
                                ? "Hoje" 
                                : isTomorrow 
                                ? "Amanhã" 
                                : taskDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                            +{task.points} pts
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                  {upcomingTasks.length >= 5 && (
                    <Link href="/planner">
                      <div className="text-center pt-2">
                        <Button variant="ghost" className="text-primary text-sm">
                          Ver todas as tarefas <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
