import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { getUserProfile, updateSubscriptionPlan, isSubscriptionActive, UserProfile } from "@/lib/userProfile";
import { PLANS, getCurrentPlan, formatRenewalDate, getDaysRemaining, PlanType } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import { doc, onSnapshot } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, CreditCard, Crown, Shield, Zap, AlertCircle, User, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { updateUserProfileData, updateUserEmail } from "@/lib/userProfile";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Settings() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanType>('basic');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    email: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
        setCurrentPlan(profile.subscriptionPlan || 'basic');
        
        // Carrega dados do perfil
        setProfileData({
          displayName: profile.displayName || "",
          phone: profile.phone || "",
          address: profile.address || "",
          city: profile.city || "",
          state: profile.state || "",
          zipCode: profile.zipCode || "",
          email: user.email || "",
        });
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      }
    };

    loadProfile();

    if (!db) {
      console.warn("Firebase não está configurado");
      return;
    }

    const profileRef = doc(db, "userProfiles", user.uid);
    const unsubscribe = onSnapshot(profileRef, (snapshot) => {
      if (snapshot.exists()) {
        const profile = snapshot.data() as UserProfile;
        setUserProfile(profile);
        setCurrentPlan(profile.subscriptionPlan || 'basic');
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleUpgrade = async (planId: PlanType) => {
    if (!user) return;

    setIsUpgrading(true);
    setSelectedPlan(planId);

    try {
      await updateSubscriptionPlan(user.uid, planId, 1);
      toast.success(`Plano ${PLANS.find(p => p.id === planId)?.name} ativado com sucesso!`);
      setSelectedPlan(null);
    } catch (error) {
      console.error("Erro ao atualizar plano:", error);
      toast.error("Erro ao atualizar plano. Tente novamente.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSavingProfile(true);
    try {
      await updateUserProfileData(user.uid, {
        displayName: profileData.displayName || undefined,
        phone: profileData.phone || undefined,
        address: profileData.address || undefined,
        city: profileData.city || undefined,
        state: profileData.state || undefined,
        zipCode: profileData.zipCode || undefined,
      });

      // Se o email mudou, atualiza no Firebase Auth
      if (profileData.email !== user.email) {
        await updateUserEmail(profileData.email);
      }

      toast.success("Perfil atualizado com sucesso!");
      setIsEditingProfile(false);
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error(error.message || "Erro ao atualizar perfil. Tente novamente.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user || !passwordData.currentPassword || !passwordData.newPassword) {
      toast.error("Preencha todos os campos de senha");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsChangingPassword(true);
    try {
      // Reautentica o usuário
      const credential = EmailAuthProvider.credential(
        user.email!,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Atualiza a senha
      await updatePassword(user, passwordData.newPassword);

      toast.success("Senha alterada com sucesso!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsChangingPassword(false);
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      toast.error(error.message || "Erro ao alterar senha. Verifique a senha atual.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const subscriptionEndDate = userProfile?.subscriptionEndDate?.toDate() || null;
  const daysRemaining = getDaysRemaining(subscriptionEndDate);
  const isActive = userProfile ? (userProfile.subscriptionPlan === 'basic' || daysRemaining > 0) : false;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-700 font-display">Configurações & Assinatura</h1>
          <p className="text-gray-500">Gerencie sua conta e plano de acesso</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Profile Section */}
          <Card className="bg-[#f0f2f5] border-none shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Gerenciar Perfil
                  </CardTitle>
                  <CardDescription>Suas informações pessoais</CardDescription>
                </div>
                {!isEditingProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingProfile(true)}
                    className="border-primary text-primary hover:bg-primary hover:text-white"
                  >
                    Editar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingProfile ? (
                <>
                  <div>
                    <Label htmlFor="displayName" className="text-sm font-medium text-gray-500">
                      Nome Completo
                    </Label>
                    <Input
                      id="displayName"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                      placeholder="Seu nome completo"
                      className="mt-1 bg-[#f0f2f5] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] border-none"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-500">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      placeholder="seu@email.com"
                      className="mt-1 bg-[#f0f2f5] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] border-none"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-500">
                      Telefone
                    </Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="mt-1 bg-[#f0f2f5] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] border-none"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address" className="text-sm font-medium text-gray-500">
                      Endereço
                    </Label>
                    <Input
                      id="address"
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                      placeholder="Rua, número, complemento"
                      className="mt-1 bg-[#f0f2f5] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] border-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city" className="text-sm font-medium text-gray-500">
                        Cidade
                      </Label>
                      <Input
                        id="city"
                        value={profileData.city}
                        onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                        placeholder="Cidade"
                        className="mt-1 bg-[#f0f2f5] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] border-none"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state" className="text-sm font-medium text-gray-500">
                        Estado
                      </Label>
                      <Input
                        id="state"
                        value={profileData.state}
                        onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                        placeholder="UF"
                        maxLength={2}
                        className="mt-1 bg-[#f0f2f5] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] border-none"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="zipCode" className="text-sm font-medium text-gray-500">
                      CEP
                    </Label>
                    <Input
                      id="zipCode"
                      value={profileData.zipCode}
                      onChange={(e) => setProfileData({ ...profileData, zipCode: e.target.value })}
                      placeholder="00000-000"
                      className="mt-1 bg-[#f0f2f5] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] border-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      className="flex-1 bg-primary text-white"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSavingProfile ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditingProfile(false);
                        // Recarrega dados originais
                        if (userProfile) {
                          setProfileData({
                            displayName: userProfile.displayName || "",
                            phone: userProfile.phone || "",
                            address: userProfile.address || "",
                            city: userProfile.city || "",
                            state: userProfile.state || "",
                            zipCode: userProfile.zipCode || "",
                            email: user?.email || "",
                          });
                        }
                      }}
                      disabled={isSavingProfile}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nome Completo</label>
                    <div className="p-3 rounded-xl bg-[#f0f2f5] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] text-gray-700">
                      {userProfile?.displayName || "Não informado"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <div className="p-3 rounded-xl bg-[#f0f2f5] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] text-gray-700">
                      {user?.email}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Telefone</label>
                    <div className="p-3 rounded-xl bg-[#f0f2f5] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] text-gray-700">
                      {userProfile?.phone || "Não informado"}
                    </div>
                  </div>
                  {(userProfile?.address || userProfile?.city || userProfile?.state) && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Endereço</label>
                      <div className="p-3 rounded-xl bg-[#f0f2f5] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] text-gray-700">
                        {[
                          userProfile.address,
                          userProfile.city,
                          userProfile.state,
                          userProfile.zipCode
                        ].filter(Boolean).join(", ") || "Não informado"}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">ID do Usuário</label>
                    <div className="p-3 rounded-xl bg-[#f0f2f5] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] text-gray-500 text-xs font-mono">
                      {user?.uid}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Subscription Status */}
          <Card className={cn(
            "border-none shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]",
            currentPlan === 'premium' && isActive
              ? "bg-gradient-to-br from-primary/10 to-transparent border-primary/20"
              : "bg-[#f0f2f5]"
          )}>
            <CardHeader>
              <CardTitle className={cn(
                "flex items-center gap-2",
                currentPlan === 'premium' && isActive ? "text-primary" : "text-gray-700"
              )}>
                <Crown className="w-5 h-5" />
                Status da Assinatura
              </CardTitle>
              <CardDescription>
                {currentPlan === 'premium' && isActive 
                  ? "Você é um membro Premium!" 
                  : currentPlan === 'premium' && !isActive
                  ? "Sua assinatura Premium expirou"
                  : "Plano Básico Ativo"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  currentPlan === 'premium' && isActive
                    ? "bg-primary/20 text-primary"
                    : "bg-gray-200 text-gray-500"
                )}>
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-gray-700">
                    Plano {PLANS.find(p => p.id === currentPlan)?.name} {isActive ? 'Ativo' : 'Expirado'}
                  </p>
                  {currentPlan === 'premium' && subscriptionEndDate && (
                    <p className="text-sm text-gray-500">
                      {isActive 
                        ? `Renovação: ${formatRenewalDate(subscriptionEndDate)} (${daysRemaining} dias restantes)`
                        : `Expirou em: ${formatRenewalDate(subscriptionEndDate)}`}
                    </p>
                  )}
                  {currentPlan === 'basic' && (
                    <p className="text-sm text-gray-500">Plano gratuito sempre ativo</p>
                  )}
                </div>
              </div>
              {currentPlan === 'premium' && !isActive && (
                <div className="mb-4 p-3 rounded-xl bg-orange-50 border border-orange-200 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-800">Assinatura Expirada</p>
                    <p className="text-xs text-orange-600">Renove sua assinatura para continuar usando recursos Premium.</p>
                  </div>
                </div>
              )}
              {currentPlan === 'premium' && isActive && (
                <Button 
                  variant="outline" 
                  className="w-full border-primary text-primary hover:bg-primary hover:text-white"
                  onClick={() => handleUpgrade('premium')}
                  disabled={isUpgrading}
                >
                  Renovar Assinatura
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <h2 className="text-2xl font-bold text-gray-700 mt-12 mb-6">Planos Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {PLANS.map((plan) => {
            const isCurrentPlan = currentPlan === plan.id;
            const isPremiumExpired = currentPlan === 'premium' && !isActive;
            
            return (
              <Card 
                key={plan.id} 
                className={cn(
                  "relative border-none transition-all duration-300",
                  plan.highlight 
                    ? "bg-[#f0f2f5] shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] scale-105 z-10 border-2 border-primary/10" 
                    : "bg-[#f0f2f5] shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] opacity-80 hover:opacity-100"
                )}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                    Recomendado
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-primary mt-2">{plan.price}</div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-gray-600">
                        <Check className="w-4 h-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {isCurrentPlan && isActive ? (
                    <Button 
                      className="w-full rounded-xl h-12 font-bold bg-[#f0f2f5] text-gray-400 cursor-default shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff]"
                      disabled
                    >
                      Plano Atual
                    </Button>
                  ) : (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          className={cn(
                            "w-full rounded-xl h-12 font-bold shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] transition-all active:scale-[0.98]",
                            plan.id === 'premium'
                              ? "bg-primary text-white hover:bg-primary/90"
                              : "bg-gray-600 text-white hover:bg-gray-700"
                          )}
                          disabled={isUpgrading}
                        >
                          {plan.id === 'premium' ? "Fazer Upgrade" : "Voltar para Básico"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#f0f2f5] border-none shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]">
                        <DialogHeader>
                          <DialogTitle>Confirmar Mudança de Plano</DialogTitle>
                          <DialogDescription>
                            {plan.id === 'premium' 
                              ? "Você está prestes a fazer upgrade para o plano Premium. Esta ação ativará sua assinatura por 1 mês."
                              : "Você está prestes a voltar para o plano Básico. Seus recursos Premium serão desativados ao final do período atual."}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <div className="p-4 rounded-xl bg-white/50 mb-4">
                            <p className="font-semibold text-gray-700 mb-2">{plan.name}</p>
                            <p className="text-2xl font-bold text-primary">{plan.price}</p>
                          </div>
                          <ul className="space-y-2">
                            {plan.features.slice(0, 3).map((feature) => (
                              <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                                <Check className="w-4 h-4 text-green-500" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedPlan(null)}
                            disabled={isUpgrading}
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={() => handleUpgrade(plan.id)}
                            disabled={isUpgrading}
                            className="bg-primary text-white"
                          >
                            {isUpgrading ? "Processando..." : "Confirmar"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
