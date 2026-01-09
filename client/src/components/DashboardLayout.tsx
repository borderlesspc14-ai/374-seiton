import { useAuth } from "@/contexts/AuthContext";
import { auth, db } from "@/lib/firebase";
import { getUserProfile, UserProfile } from "@/lib/userProfile";
import { PLANS } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { Calendar, ChefHat, LayoutDashboard, LogOut, Menu, Settings, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user || !db) return;

    const loadProfile = async () => {
      try {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      }
    };

    loadProfile();

    const profileRef = doc(db, "userProfiles", user.uid);
    const unsubscribe = onSnapshot(profileRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserProfile(snapshot.data() as UserProfile);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const currentPlanName = userProfile 
    ? PLANS.find(p => p.id === userProfile.subscriptionPlan)?.name || "Básico"
    : "Básico";

  const handleLogout = () => {
    if (auth) {
      signOut(auth);
    } else {
      console.warn("Firebase Auth não está configurado");
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Visão Geral", path: "/dashboard" },
    { icon: Calendar, label: "Seiton Planner", path: "/planner" },
    { icon: ChefHat, label: "AnotaChef", path: "/anotachef" },
    { icon: Trophy, label: "Recompensas", path: "/rewards" },
    { icon: Settings, label: "Configurações", path: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 bg-[#f0f2f5] w-64 transition-transform duration-300 ease-in-out shadow-[4px_0_16px_rgba(0,0,0,0.05)]",
          !isSidebarOpen && "-translate-x-full lg:translate-x-0 lg:w-20"
        )}
      >
        <div className="h-full flex flex-col p-4">
          <div className="flex items-center justify-center h-16 mb-8">
            {isSidebarOpen ? (
              <h1 className="text-2xl font-bold text-gray-700 font-display tracking-wider">SEITON</h1>
            ) : (
              <span className="text-2xl font-bold text-primary">S</span>
            )}
          </div>

          <nav className="flex-1 space-y-4">
            {navItems.map((item) => {
              const isActive = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200",
                      isActive 
                        ? "bg-[#f0f2f5] text-primary shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff]" 
                        : "text-gray-500 hover:text-primary hover:bg-[#f0f2f5] hover:shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff]"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-8">
            <Button
              variant="ghost"
              className={cn(
                "w-full flex items-center gap-4 text-red-500 hover:text-red-600 hover:bg-red-50",
                !isSidebarOpen && "justify-center px-0"
              )}
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              {isSidebarOpen && <span>Sair</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-[#f0f2f5] flex items-center justify-between px-8 sticky top-0 z-40">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </Button>

          <div className="flex items-center gap-4 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-700">{user?.email}</p>
              <p className="text-xs text-gray-500">Plano {currentPlanName}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#f0f2f5] shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] flex items-center justify-center text-primary font-bold">
              {user?.email?.[0].toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
