import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { addDoc, collection, doc, onSnapshot, query, updateDoc, where, Timestamp } from "firebase/firestore";
import { Calendar as CalendarIcon, Plus, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getUserProfile, 
  addPointsToProfile, 
  removePointsFromProfile,
  incrementCompletedTasks,
  decrementCompletedTasks,
  updateStreak,
  checkAndUnlockAchievements,
  hasFeatureAccess
} from "@/lib/userProfile";
import { canCreateTask } from "@/lib/subscription";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  date: Date | any;
  points: number;
}

export default function Planner() {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [userPoints, setUserPoints] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Listen for tasks
    const q = query(
      collection(db, "tasks"), 
      where("userId", "==", user.uid)
    );
    
    const unsubscribeTasks = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date)
        } as Task;
      });
      setTasks(tasksData);
    });

    // Load user profile
    const loadProfile = async () => {
      try {
        const profile = await getUserProfile(user.uid);
        setUserPoints(profile.totalPoints);
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      }
    };

    loadProfile();

    // Listen for user profile changes
    const profileRef = doc(db, "userProfiles", user.uid);
    const unsubscribeProfile = onSnapshot(profileRef, (snapshot) => {
      if (snapshot.exists()) {
        const profile = snapshot.data();
        setUserPoints(profile.totalPoints || 0);
      }
    });

    return () => {
      unsubscribeTasks();
      unsubscribeProfile();
    };
  }, [user]);

  const handleAddTask = async () => {
    if (!newTask.trim() || !user || !date) return;

    try {
      // Verifica se o usuário pode criar mais tarefas
      const canCreate = await canCreateTask(user.uid);
      if (!canCreate.canCreate) {
        toast.error(canCreate.reason || "Limite de tarefas atingido");
        return;
      }

      await addDoc(collection(db, "tasks"), {
        title: newTask,
        completed: false,
        date: Timestamp.fromDate(date),
        userId: user.uid,
        points: 10,
        createdAt: Timestamp.now(),
      });

      setNewTask("");
      toast.success("Tarefa adicionada com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar tarefa:", error);
      toast.error("Erro ao adicionar tarefa. Tente novamente.");
    }
  };

  const toggleTask = async (task: Task) => {
    if (!user) return;

    try {
      const taskRef = doc(db, "tasks", task.id);
      const newCompleted = !task.completed;
      
      await updateDoc(taskRef, {
        completed: newCompleted,
        completedAt: newCompleted ? Timestamp.now() : null,
      });

      if (newCompleted) {
        // Tarefa completada - adiciona pontos e atualiza streak
        await addPointsToProfile(user.uid, task.points);
        await incrementCompletedTasks(user.uid);
        
        // Atualiza streak primeiro
        await updateStreak(user.uid, task.date);
        
        // Busca o perfil atualizado para verificar conquistas
        const profile = await getUserProfile(user.uid);
        
        // Verifica conquistas com dados atualizados
        await checkAndUnlockAchievements(
          user.uid,
          profile.completedTasks,
          profile.currentStreak
        );
      } else {
        // Tarefa desmarcada - remove pontos
        await removePointsFromProfile(user.uid, task.points);
        await decrementCompletedTasks(user.uid);
      }
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (!date) return false;
    const taskDate = task.date instanceof Date ? task.date : task.date.toDate();
    return taskDate.toDateString() === date.toDateString();
  });

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Section */}
        <div className="lg:col-span-1">
          <div className="bg-[#f0f2f5] rounded-2xl p-6 shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]">
            <h2 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Agenda
            </h2>
            <div className="w-full">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="w-full bg-transparent"
                classNames={{
                  root: "w-full",
                  months: "flex flex-col gap-4 w-full",
                  month: "flex flex-col gap-4 w-full",
                  month_caption: "flex justify-center pt-1 relative items-center mb-4",
                  caption_label: "text-base font-semibold text-gray-700",
                  nav: "flex items-center justify-between absolute top-0 left-0 right-0",
                  button_previous: "absolute left-0 h-8 w-8 p-0 hover:bg-gray-200 rounded-md flex items-center justify-center",
                  button_next: "absolute right-0 h-8 w-8 p-0 hover:bg-gray-200 rounded-md flex items-center justify-center",
                  table: "w-full border-collapse mt-4",
                  weekdays: "flex mb-2",
                  weekday: "text-gray-600 rounded-md flex-1 font-medium text-xs text-center",
                  week: "flex w-full mt-1",
                  day: "h-10 flex-1 p-0 font-normal text-center relative",
                  day_button: cn(
                    "h-10 w-full p-0 font-normal text-gray-700 rounded-md",
                    "hover:bg-gray-200 hover:text-gray-900",
                    "focus:bg-gray-200 focus:text-gray-900",
                    "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-white",
                    "data-[selected-single=true]:hover:bg-primary data-[selected-single=true]:hover:text-white"
                  ),
                  selected: "bg-primary text-white hover:bg-primary hover:text-white",
                  today: "bg-gray-200 text-gray-900 font-semibold",
                  outside: "text-gray-400 opacity-50",
                  disabled: "text-gray-300 opacity-30",
                }}
              />
            </div>
          </div>

          <div className="mt-8 bg-[#f0f2f5] rounded-2xl p-6 shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-700">Seus Pontos</h3>
              <Trophy className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="text-4xl font-bold text-primary mb-2">{userPoints}</div>
            <p className="text-sm text-gray-500">Continue completando tarefas para ganhar recompensas!</p>
            <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-500 transition-all duration-500"
                style={{ width: `${(userPoints % 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="lg:col-span-2">
          <div className="bg-[#f0f2f5] rounded-2xl p-8 shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] min-h-[600px]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-700">Tarefas do Dia</h2>
                <p className="text-gray-500">
                  {date?.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-white rounded-xl shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)] transition-all">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Tarefa
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#f0f2f5] border-none shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]">
                  <DialogHeader>
                    <DialogTitle>Adicionar Nova Tarefa</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <Input
                      placeholder="O que você precisa fazer?"
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      className="bg-[#f0f2f5] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] border-none"
                    />
                    <Button onClick={handleAddTask} className="w-full">Salvar Tarefa</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p>Nenhuma tarefa para este dia.</p>
                  <p className="text-sm">Aproveite para descansar ou planejar o futuro!</p>
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl transition-all duration-300",
                      task.completed 
                        ? "bg-[#f0f2f5] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] opacity-60"
                        : "bg-[#f0f2f5] shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff]"
                    )}
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => toggleTask(task)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span className={cn(
                      "flex-1 font-medium text-gray-700",
                      task.completed && "line-through text-gray-400"
                    )}>
                      {task.title}
                    </span>
                    <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                      +{task.points} pts
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
