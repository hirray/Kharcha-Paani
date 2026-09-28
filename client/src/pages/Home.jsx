import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import { LogOut, Check, ShoppingBag, Utensils, Smartphone, MoreHorizontal } from 'lucide-react';
import clsx from 'clsx';

export default function Home() {
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();

  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(null);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await axios.get(`/users/${user._id}`);
      return data.data;
    }
  });

  const classes = profile?.classes || [];
  const currentBalance = profile?.balance || 0;
  
  // Calculate current month's spent for the banner
  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data } = await axios.get(`/users/${user._id}/transactions`);
      return data.data;
    }
  });
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthSpent = transactions?.filter(t => {
      const d = new Date(t.date);
      return t.type === 'spent' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).reduce((acc, t) => acc + t.amount, 0) || 0;

  const target = profile?.targetAmount || 0;
  const isTargetExceeded = target > 0 && currentMonthSpent >= target;
  const exceededAmount = currentMonthSpent - target;

  const addTransaction = useMutation({
    mutationFn: async (payload) => {
      await axios.post(`/users/${user._id}/transactions`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      queryClient.invalidateQueries(['transactions']);
      setAdjustmentAmount('');
      setExpenseAmount('');
      setExpenseDesc('');
      setSelectedClassId(null);
    }
  });

  const handleAdjustment = (kind) => {
    if (!adjustmentAmount || isNaN(adjustmentAmount) || adjustmentAmount <= 0) return;
    
    // Convert update to an adjustment by calculating difference
    let diff = Number(adjustmentAmount);
    let type = 'adjustment';
    let finalAmount = diff;

    if (kind === 'subtract') {
       finalAmount = diff;
    }

    addTransaction.mutate({ type, adjustmentKind: kind, amount: finalAmount });
  };

  const handleExpense = (type) => {
    if (!expenseAmount || isNaN(expenseAmount) || expenseAmount <= 0 || !selectedClassId) return;
    addTransaction.mutate({ 
      type, 
      amount: Number(expenseAmount), 
      classId: selectedClassId, 
      description: expenseDesc 
    });
  };

  // Helper for icons
  const renderIcon = (name) => {
    if (name === 'utensils') return <Utensils size={20} />;
    if (name === 'shopping-bag') return <ShoppingBag size={20} />;
    if (name === 'smartphone') return <Smartphone size={20} />;
    return <MoreHorizontal size={20} />;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-10">
      <header className="bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-800">Kharcha</h1>
        <button onClick={logout} className="p-2 bg-gray-100 rounded-full text-gray-600">
          <LogOut size={20} />
        </button>
      </header>

      {isTargetExceeded && (
        <div className="bg-red-500 text-white p-3 text-center text-sm font-medium">
          {exceededAmount > 0 
            ? `Target spending amount reached, exceeded by ₹${exceededAmount.toLocaleString('en-IN')}` 
            : `Target spending amount reached`}
        </div>
      )}

      <div className="p-4 space-y-6">
        
        {/* Balance Card */}
        <div className="bg-blue-600 text-white rounded-2xl p-5 shadow-md">
          <p className="text-sm opacity-80 mb-1">Current Balance</p>
          <h2 className="text-4xl font-bold mb-4">₹{currentBalance.toLocaleString('en-IN')}</h2>
          
          <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl">
            <input 
              type="number"
              inputMode="decimal"
              placeholder="Amount..."
              className="bg-white/20 text-white placeholder:text-white/60 p-2 rounded-lg flex-1 outline-none text-sm w-full min-w-0"
              value={adjustmentAmount}
              onChange={e => setAdjustmentAmount(e.target.value)}
            />
            <div className="flex gap-1 shrink-0">
              <button onClick={() => handleAdjustment('add')} className="bg-white/20 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-white/30">+ Add</button>
              <button onClick={() => handleAdjustment('subtract')} className="bg-white/20 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-white/30">- Sub</button>
              <button onClick={() => handleAdjustment('update')} className="bg-white/20 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-white/30">Set</button>
            </div>
          </div>
        </div>
        
        {/* Class Cards */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">Categories</h3>
          <div className="grid grid-cols-2 gap-3">
            {classes.map(cls => {
              const spentThisMonth = transactions?.filter(t => {
                const d = new Date(t.date);
                return t.type === 'spent' && t.classId === cls._id && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
              }).reduce((acc, t) => acc + t.amount, 0) || 0;

              return (
                <div 
                  key={cls._id} 
                  onClick={() => setSelectedClassId(cls._id)}
                  className={clsx(
                    "p-4 rounded-xl border-2 cursor-pointer transition-all",
                    selectedClassId === cls._id ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-white shadow-sm'
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-2">
                      <div className="p-2 rounded-full text-white w-max" style={{ backgroundColor: cls.color }}>
                        {renderIcon(cls.icon)}
                      </div>
                      <p className="font-semibold text-gray-800 text-sm">{cls.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">₹{spentThisMonth.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expense Entry Form */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">Add Entry</h3>
          <div className="space-y-4">
            <input 
              type="number"
              inputMode="decimal"
              placeholder="Amount (₹)"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500"
              value={expenseAmount}
              onChange={e => setExpenseAmount(e.target.value)}
            />
            <input 
              type="text"
              placeholder="Description (Optional)"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500"
              value={expenseDesc}
              onChange={e => setExpenseDesc(e.target.value)}
            />
            
            <div className="flex flex-wrap gap-2">
              {classes.map(cls => (
                <button 
                  key={cls._id}
                  onClick={() => setSelectedClassId(cls._id)}
                  className={clsx(
                    "px-4 py-2 rounded-full text-xs font-medium border",
                    selectedClassId === cls._id 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-600 border-gray-200'
                  )}
                >
                  {cls.name}
                </button>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => handleExpense('spent')}
                disabled={!expenseAmount || !selectedClassId || addTransaction.isPending}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                - Spent
              </button>
              <button 
                onClick={() => handleExpense('earned')}
                disabled={!expenseAmount || !selectedClassId || addTransaction.isPending}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                + Earned
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
