import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import { ShoppingBag, Utensils, Smartphone, MoreHorizontal } from 'lucide-react';
import clsx from 'clsx';

export default function History() {
  const { user } = useAuthStore();
  const [filterType, setFilterType] = useState('All');

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await axios.get(`/users/${user._id}`);
      return data.data;
    }
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data } = await axios.get(`/users/${user._id}/transactions`);
      return data.data;
    }
  });

  const classes = profile?.classes || [];
  const targetAmount = profile?.targetAmount || 0;

  // Filter transactions
  const filtered = transactions?.filter(t => {
    if (filterType === 'All') return true;
    if (['Spent', 'Earned', 'Adjustment'].includes(filterType)) {
      return t.type === filterType.toLowerCase();
    }
    return t.classId === filterType;
  }) || [];

  const [editingTxId, setEditingTxId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editClassId, setEditClassId] = useState('');

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      await axios.put(`/users/${user._id}/transactions/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['profile']);
      setEditingTxId(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`/users/${user._id}/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['profile']);
      setEditingTxId(null);
    }
  });

  // Client-side computation for over-target red text logic
  // We need to group by month and calculate a running total of 'spent'
  const monthlyRunningSpent = {};
  
  // To do running total chronologically, we need the transactions ascending for calculation
  const chronological = [...(transactions || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  chronological.forEach(t => {
    if (t.type === 'spent') {
      const d = new Date(t.date);
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      
      if (!monthlyRunningSpent[monthKey]) {
        monthlyRunningSpent[monthKey] = 0;
      }
      
      monthlyRunningSpent[monthKey] += t.amount;
      
      if (targetAmount > 0 && monthlyRunningSpent[monthKey] > targetAmount) {
        t.isOverTarget = true;
      }
    }
  });

  // Helper for icons
  const renderIcon = (name) => {
    if (name === 'utensils') return <Utensils size={18} />;
    if (name === 'shopping-bag') return <ShoppingBag size={18} />;
    if (name === 'smartphone') return <Smartphone size={18} />;
    return <MoreHorizontal size={18} />;
  };

  const getClassDetails = (classId) => {
    return classes.find(c => c._id === classId) || { name: 'Unknown', icon: 'more-horizontal', color: '#ccc' };
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-10">
      <header className="bg-white/80 backdrop-blur-md p-4 shadow-sm sticky top-0 z-10 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">History</h1>
        
        <div className="flex flex-col gap-2.5 mt-4">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {['All', 'Spent', 'Earned', 'Adjustment'].map(f => {
              const isActive = filterType === f;
              let activeClass = "bg-gray-800 text-white";
              if (isActive) {
                if (f === 'Spent') activeClass = "bg-red-500 text-white shadow-md shadow-red-200";
                if (f === 'Earned') activeClass = "bg-green-500 text-white shadow-md shadow-green-200";
                if (f === 'Adjustment') activeClass = "bg-blue-500 text-white shadow-md shadow-blue-200";
              }
              return (
                <button 
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={clsx(
                    "px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all",
                    isActive ? activeClass : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  )}
                >
                  {f}
                </button>
              );
            })}
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {classes.map(cls => {
              const isActive = filterType === cls._id;
              return (
                <button 
                  key={cls._id}
                  onClick={() => setFilterType(cls._id)}
                  className={clsx(
                    "px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all border",
                    isActive ? "text-white shadow-md" : "bg-white"
                  )}
                  style={
                    isActive 
                      ? { backgroundColor: cls.color, borderColor: cls.color, boxShadow: `0 4px 6px -1px ${cls.color}40` } 
                      : { color: cls.color, borderColor: `${cls.color}40` }
                  }
                >
                  {cls.name}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filtered.map(tx => {
          const cls = tx.classId ? getClassDetails(tx.classId) : null;
          const isEditing = editingTxId === tx._id;
          
          return (
            <div key={tx._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div 
                onClick={() => {
                  if (isEditing) {
                    setEditingTxId(null);
                  } else {
                    setEditingTxId(tx._id);
                    setEditAmount(tx.amount);
                    setEditDesc(tx.description || '');
                    setEditClassId(tx.classId || '');
                  }
                }}
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {cls ? (
                    <div className="p-2 rounded-full text-white" style={{ backgroundColor: cls.color }}>
                      {renderIcon(cls.icon)}
                    </div>
                  ) : (
                    <div className="p-2 rounded-full bg-gray-200 text-gray-600">
                      <MoreHorizontal size={18} />
                    </div>
                  )}
                  
                  <div>
                    <p className="font-semibold text-gray-800">
                      {cls ? cls.name : 'Adjustment'}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500">
                        {new Date(tx.date).toLocaleDateString()}
                      </p>
                      {tx.isOverTarget && (
                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                          Over target
                        </span>
                      )}
                    </div>
                    {tx.description && (
                      <p className="text-sm text-gray-600 mt-0.5">{tx.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={clsx(
                    "font-bold",
                    tx.type === 'earned' && 'text-green-600',
                    tx.type === 'spent' && !tx.isOverTarget && 'text-gray-900',
                    tx.type === 'spent' && tx.isOverTarget && 'text-red-500',
                    tx.type === 'adjustment' && 'text-gray-500'
                  )}>
                    {tx.type === 'earned' ? '+' : tx.type === 'spent' ? '-' : ''}₹{tx.amount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Bal: ₹{tx.balanceAfter.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {isEditing && (
                <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-3">
                  <input 
                    type="number"
                    value={editAmount}
                    onChange={e => setEditAmount(e.target.value)}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                    placeholder="Amount"
                  />
                  <input 
                    type="text"
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                    placeholder="Description (Optional)"
                  />
                  {(tx.type === 'spent' || tx.type === 'earned') && (
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {classes.map(c => (
                        <button
                          key={c._id}
                          onClick={() => setEditClassId(c._id)}
                          className={clsx(
                            "px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all border",
                            editClassId === c._id ? "text-white shadow-md" : "bg-white"
                          )}
                          style={
                            editClassId === c._id 
                              ? { backgroundColor: c.color, borderColor: c.color } 
                              : { color: c.color, borderColor: `${c.color}40` }
                          }
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => updateMutation.mutate({ id: tx._id, payload: { amount: Number(editAmount), description: editDesc, classId: editClassId } })}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium text-sm disabled:opacity-50"
                      disabled={updateMutation.isPending || !editAmount}
                    >
                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button 
                      onClick={() => deleteMutation.mutate(tx._id)}
                      className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg font-medium text-sm disabled:opacity-50"
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            No transactions found.
          </div>
        )}
      </div>
    </div>
  );
}
