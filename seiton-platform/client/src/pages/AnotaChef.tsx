import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { addDoc, collection, onSnapshot, query, where, Timestamp } from "firebase/firestore";
import { ArrowDownCircle, ArrowUpCircle, DollarSign, Package, Plus, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: Date;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minQuantity: number;
} 

export default function AnotaChef() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [newTransaction, setNewTransaction] = useState({ type: 'income', amount: '', description: '', category: '' });
  const [newItem, setNewItem] = useState({ name: '', quantity: '', unit: 'kg', minQuantity: '' });

  useEffect(() => {
    if (!user) return;

    const qTransactions = query(collection(db, "transactions"), where("userId", "==", user.uid));
    const qInventory = query(collection(db, "inventory"), where("userId", "==", user.uid));

    const unsubTrans = onSnapshot(qTransactions, (snap) => {
      setTransactions(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        date: d.data().date?.toDate ? d.data().date.toDate() : new Date(d.data().date)
      } as Transaction)));
    });

    const unsubInv = onSnapshot(qInventory, (snap) => {
      setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem)));
    });

    return () => {
      unsubTrans();
      unsubInv();
    };
  }, [user]);

  const handleAddTransaction = async () => {
    if (!user || !newTransaction.amount || !newTransaction.description) return;
    await addDoc(collection(db, "transactions"), {
      ...newTransaction,
      amount: Number(newTransaction.amount),
      date: Timestamp.now(),
      userId: user.uid,
      createdAt: Timestamp.now(),
    });
    setNewTransaction({ type: 'income', amount: '', description: '', category: '' });
  };

  const handleAddItem = async () => {
    if (!user || !newItem.name || !newItem.quantity) return;
    await addDoc(collection(db, "inventory"), {
      ...newItem,
      quantity: Number(newItem.quantity),
      minQuantity: Number(newItem.minQuantity),
      userId: user.uid,
      createdAt: Timestamp.now(),
    });
    setNewItem({ name: '', quantity: '', unit: 'kg', minQuantity: '' });
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-700 font-display">AnotaChef</h1>
            <p className="text-gray-500">Gestão financeira e operacional simplificada</p>
          </div>
          <div className="flex gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-secondary text-white hover:bg-secondary/90 rounded-xl shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff]">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Transação
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#f0f2f5]">
                <DialogHeader><DialogTitle>Registrar Movimentação</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <Select 
                    value={newTransaction.type} 
                    onValueChange={(v: any) => setNewTransaction({...newTransaction, type: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Entrada</SelectItem>
                      <SelectItem value="expense">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input 
                    placeholder="Descrição" 
                    value={newTransaction.description}
                    onChange={e => setNewTransaction({...newTransaction, description: e.target.value})}
                  />
                  <Input 
                    type="number" 
                    placeholder="Valor (R$)" 
                    value={newTransaction.amount}
                    onChange={e => setNewTransaction({...newTransaction, amount: e.target.value})}
                  />
                  <Button onClick={handleAddTransaction} className="w-full">Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Financial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-[#f0f2f5] border-none shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Entradas</CardTitle>
              <ArrowUpCircle className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">R$ {totalIncome.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="bg-[#f0f2f5] border-none shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Saídas</CardTitle>
              <ArrowDownCircle className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">R$ {totalExpense.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="bg-[#f0f2f5] border-none shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Saldo</CardTitle>
              <DollarSign className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", balance >= 0 ? "text-primary" : "text-red-600")}>
                R$ {balance.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="finance" className="w-full">
          <TabsList className="bg-[#f0f2f5] p-1 rounded-xl shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff]">
            <TabsTrigger value="finance" className="rounded-lg data-[state=active]:bg-[#f0f2f5] data-[state=active]:shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff]">Financeiro</TabsTrigger>
            <TabsTrigger value="inventory" className="rounded-lg data-[state=active]:bg-[#f0f2f5] data-[state=active]:shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff]">Estoque</TabsTrigger>
          </TabsList>

          <TabsContent value="finance" className="mt-6">
            <div className="bg-[#f0f2f5] rounded-2xl p-6 shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]">
              <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Histórico de Transações
              </h3>
              <div className="space-y-4">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-[#f0f2f5] shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff]">
                    <div>
                      <p className="font-medium text-gray-700">{t.description}</p>
                      <p className="text-xs text-gray-500 capitalize">{t.type === 'income' ? 'Entrada' : 'Saída'}</p>
                    </div>
                    <span className={cn("font-bold", t.type === 'income' ? "text-green-600" : "text-red-600")}>
                      {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="mt-6">
            <div className="bg-[#f0f2f5] rounded-2xl p-6 shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Controle de Estoque
                </h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">Adicionar Item</Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#f0f2f5]">
                    <DialogHeader><DialogTitle>Novo Item de Estoque</DialogTitle></DialogHeader>
                    <div className="space-y-4 mt-4">
                      <Input 
                        placeholder="Nome do Item" 
                        value={newItem.name}
                        onChange={e => setNewItem({...newItem, name: e.target.value})}
                      />
                      <div className="flex gap-4">
                        <Input 
                          type="number" 
                          placeholder="Quantidade" 
                          value={newItem.quantity}
                          onChange={e => setNewItem({...newItem, quantity: e.target.value})}
                        />
                        <Select 
                          value={newItem.unit} 
                          onValueChange={v => setNewItem({...newItem, unit: v})}
                        >
                          <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="un">un</SelectItem>
                            <SelectItem value="l">L</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Input 
                        type="number" 
                        placeholder="Qtd. Mínima" 
                        value={newItem.minQuantity}
                        onChange={e => setNewItem({...newItem, minQuantity: e.target.value})}
                      />
                      <Button onClick={handleAddItem} className="w-full">Salvar Item</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inventory.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl bg-[#f0f2f5] shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700">{item.name}</p>
                      <p className="text-xs text-gray-500">Mínimo: {item.minQuantity} {item.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("font-bold text-lg", item.quantity <= item.minQuantity ? "text-red-500" : "text-primary")}>
                        {item.quantity} <span className="text-sm font-normal text-gray-500">{item.unit}</span>
                      </p>
                      {item.quantity <= item.minQuantity && (
                        <span className="text-[10px] text-red-500 font-bold uppercase">Repor Estoque</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
