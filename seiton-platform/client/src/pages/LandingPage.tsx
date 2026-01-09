import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BarChart3, Calendar, ChefHat, Download, Share2, Smartphone, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-700 font-sans">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold font-display tracking-wider text-gray-800">SEITON</div>
        <div className="hidden md:flex gap-8">
          <a href="#features" className="hover:text-primary transition-colors">Funcionalidades</a>
          <a href="#benefits" className="hover:text-primary transition-colors">Benefícios</a>
          <a href="#pricing" className="hover:text-primary transition-colors">Planos</a>
        </div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost" className="hover:bg-transparent hover:text-primary">Entrar</Button>
          </Link>
          <Link href="/login">
            <Button className="rounded-xl bg-primary text-white shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)] transition-all">
              Começar Agora
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 md:py-32 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold font-display leading-tight text-gray-800">
            Gestão Inteligente para <span className="text-primary">Pequenos Negócios</span>
          </h1>
          <p className="text-xl text-gray-500 leading-relaxed">
            Organize sua agenda, controle suas finanças e cresça com o SEITON. 
            A plataforma completa para autônomos e restaurantes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/login">
              <Button className="h-14 px-8 text-lg rounded-xl bg-primary text-white shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] hover:shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] transition-all">
                Experimente Grátis
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="h-14 px-8 text-lg rounded-xl border-none bg-[#f0f2f5] text-gray-700 shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] hover:text-primary hover:shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] transition-all"
              onClick={() => {
                const featuresSection = document.getElementById('features');
                if (featuresSection) {
                  featuresSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Ver Demonstração
            </Button>
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-3xl opacity-30 animate-pulse" />
          <img 
            src="/images/hero-banner.png" 
            alt="SEITON Dashboard" 
            className="relative z-10 w-full rounded-3xl shadow-[20px_20px_60px_#d1d9e6,-20px_-20px_60px_#ffffff] transform hover:scale-[1.02] transition-transform duration-500"
          />
        </div>
      </section>

      {/* Interactive Report Benefits Section */}
      <section id="benefits" className="bg-[#eef0f4] py-24">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold font-display text-gray-800 mb-4">Por que escolher o SEITON?</h2>
            <p className="text-gray-500 text-lg">
              Nossa plataforma transforma dados complexos em insights visuais claros.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <Card className="bg-[#eef0f4] border-none shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] hover:shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#eef0f4] shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Exploração Intuitiva</h3>
                <p className="text-gray-500">
                  Explore os dados de forma mais intuitiva com dashboards interativos que mostram exatamente o que você precisa ver, sem planilhas complicadas.
                </p>
              </CardContent>
            </Card>

            {/* Benefit 2 */}
            <Card className="bg-[#eef0f4] border-none shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] hover:shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#eef0f4] shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Tendências Claras</h3>
                <p className="text-gray-500">
                  Compreenda melhor as tendências do seu negócio com gráficos visuais que destacam crescimento, sazonalidade e oportunidades de lucro.
                </p>
              </CardContent>
            </Card>

            {/* Benefit 3 */}
            <Card className="bg-[#eef0f4] border-none shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] hover:shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#eef0f4] shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Share2 className="w-8 h-8 text-yellow-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Compartilhamento Fácil</h3>
                <p className="text-gray-500">
                  Salve ou compartilhe facilmente relatórios e fichas técnicas com sua equipe ou contador em apenas um clique.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="features" className="container mx-auto px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <div className="order-2 lg:order-1">
            <img 
              src="/images/planner-cover.png" 
              alt="Seiton Planner" 
              className="w-full rounded-3xl shadow-[12px_12px_24px_#d1d9e6,-12px_-12px_24px_#ffffff]"
            />
          </div>
          <div className="order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm">
              <Calendar className="w-4 h-4" />
              Módulo 01
            </div>
            <h2 className="text-4xl font-bold font-display text-gray-800">Seiton Planner</h2>
            <p className="text-lg text-gray-500">
              Muito mais que uma agenda. Um sistema gamificado que recompensa sua organização.
            </p>
            <ul className="space-y-4">
              {['Agenda inteligente', 'Sistema de pontos e recompensas', 'Lembretes automáticos'].map(item => (
                <li key={item} className="flex items-center gap-3 text-gray-600">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs">✓</div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary font-bold text-sm">
              <ChefHat className="w-4 h-4" />
              Módulo 02
            </div>
            <h2 className="text-4xl font-bold font-display text-gray-800">AnotaChef</h2>
            <p className="text-lg text-gray-500">
              O controle que sua cozinha precisa. Gestão de insumos e finanças sem complicação.
            </p>
            <ul className="space-y-4">
              {['Fichas técnicas digitais', 'Controle de estoque em tempo real', 'Fluxo de caixa simplificado'].map(item => (
                <li key={item} className="flex items-center gap-3 text-gray-600">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs">✓</div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <img 
              src="/images/anotachef-cover.png" 
              alt="AnotaChef" 
              className="w-full rounded-3xl shadow-[12px_12px_24px_#d1d9e6,-12px_-12px_24px_#ffffff]"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-6 py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold font-display text-gray-800 mb-4">Planos que se adaptam ao seu negócio</h2>
          <p className="text-gray-500 text-lg">
            Escolha o plano ideal para você. Comece grátis e faça upgrade quando precisar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Basic Plan */}
          <Card className="bg-[#f0f2f5] border-none shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Básico</h3>
                <div className="text-4xl font-bold text-primary mb-1">Grátis</div>
                <p className="text-sm text-gray-500">Para sempre</p>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  'Acesso ao Seiton Planner',
                  'Agenda básica',
                  'Até 50 tarefas/mês',
                  'Sistema de pontos e conquistas',
                  'Suporte por email'
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-gray-600">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs flex-shrink-0">✓</div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/login">
                <Button className="w-full h-12 rounded-xl bg-gray-600 text-white hover:bg-gray-700 shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] transition-all">
                  Começar Grátis
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="bg-[#f0f2f5] border-none shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] relative scale-105 border-2 border-primary/20">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
              Recomendado
            </div>
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Premium</h3>
                <div className="text-4xl font-bold text-primary mb-1">R$ 29,90</div>
                <p className="text-sm text-gray-500">por mês</p>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  'Tudo do Básico',
                  'Acesso ao AnotaChef',
                  'Gestão Financeira Completa',
                  'Controle de Estoque',
                  'Tarefas ilimitadas',
                  'Gamificação Avançada',
                  'Suporte Prioritário',
                  'Análises e Relatórios'
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-gray-600">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs flex-shrink-0">✓</div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/login">
                <Button className="w-full h-12 rounded-xl bg-primary text-white hover:bg-primary/90 shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] transition-all">
                  Assinar Premium
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold font-display mb-6">Pronto para organizar seu negócio?</h2>
          <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
            Junte-se a centenas de empreendedores que já transformaram sua gestão com o SEITON.
          </p>
          <Link href="/login">
            <Button className="h-16 px-10 text-xl rounded-xl bg-white text-primary font-bold shadow-lg hover:bg-gray-100 transition-all">
              Criar Conta Grátis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#eef0f4] py-12 border-t border-gray-200">
        <div className="container mx-auto px-6 text-center text-gray-500">
          <p>&copy; 2025 SEITON Platform. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
