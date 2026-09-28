import React, { useState, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import { LogOut, ChevronDown, ChevronUp, Plus, Trash2, Edit2, Check, X, Smartphone, ShoppingBag, Utensils, MoreHorizontal } from 'lucide-react';
import clsx from 'clsx';

export default function Profile() {
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  
  // States
  const [targetAmount, setTargetAmount] = useState('');
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  
  const [expandedMonth, setExpandedMonth] = useState(null);
  
  const [isEditingClasses, setIsEditingClasses] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassColor, setNewClassColor] = useState('#3b82f6');

  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
  const [editingClassId, setEditingClassId] = useState(null);
  const [editClassName, setEditClassName] = useState('');
  const [editClassColor, setEditClassColor] = useState('');
  
  const PREDEFINED_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#64748b'];

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

  const updateProfileMutation = useMutation({
    mutationFn: async (payload) => {
      await axios.put(`/users/${user._id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      setIsEditingProfile(false);
    }
  });

  const updateTargetMutation = useMutation({
    mutationFn: async (amount) => {
      await axios.put(`/users/${user._id}/target`, { targetAmount: amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      setIsEditingTarget(false);
    }
  });

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate({ name: editName, phone: editPhone });
  };

  const handleTargetSubmit = (e) => {
    e.preventDefault();
    if (targetAmount !== '') {
      updateTargetMutation.mutate(Number(targetAmount));
    }
  };

  const handleAddClass = () => {
    if (!newClassName) return;
    const currentClasses = profile?.classes || [];
    const newClass = {
      name: newClassName,
      color: newClassColor,
      icon: 'more-horizontal' // default icon for custom classes
    };
    updateProfileMutation.mutate({ classes: [...currentClasses, newClass] });
    setNewClassName('');
  };

  const handleDeleteClass = (classId) => {
    const currentClasses = profile?.classes || [];
    const updated = currentClasses.filter(c => c._id !== classId);
    updateProfileMutation.mutate({ classes: updated });
  };

  const handleUpdateClass = () => {
    if (!editClassName) return;
    const currentClasses = profile?.classes || [];
    const updated = currentClasses.map(c => {
      if (c._id === editingClassId) {
        return { ...c, name: editClassName, color: editClassColor };
      }
      return c;
    });
    updateProfileMutation.mutate({ classes: updated });
    setEditingClassId(null);
  };

  // Helper for icons
  const renderIcon = (name, size=16) => {
    if (name === 'utensils') return <Utensils size={size} />;
    if (name === 'shopping-bag') return <ShoppingBag size={size} />;
    if (name === 'smartphone') return <Smartphone size={size} />;
    return <MoreHorizontal size={size} />;
  };

  // Monthly Analytics Computation
  const monthlyData = useMemo(() => {
    const data = {};
    transactions?.forEach(t => {
      if (t.type === 'spent') {
        const d = new Date(t.date);
        const key = `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
        if (!data[key]) {
          data[key] = { total: 0, classBreakdown: {} };
        }
        data[key].total += t.amount;
        
        if (t.classId) {
          if (!data[key].classBreakdown[t.classId]) {
            data[key].classBreakdown[t.classId] = 0;
          }
          data[key].classBreakdown[t.classId] += t.amount;
        }
      }
    });
    return data;
  }, [transactions]);

  const targetAmountNum = profile?.targetAmount || 0;
  const classes = profile?.classes || [];

  const getClassDetails = (classId) => {
    return classes.find(c => c._id === classId) || { name: 'Unknown', color: '#ccc', icon: 'more-horizontal' };
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-10">
      <header className="bg-white/80 backdrop-blur-md p-4 shadow-sm sticky top-0 z-10 border-b border-gray-100 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <button onClick={logout} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 flex items-center gap-2 text-sm font-medium transition-colors">
          <LogOut size={16} /> Logout
        </button>
      </header>

      <div className="p-4 space-y-6">
        
        {/* User Info */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative">
          {!isEditingProfile ? (
            <>
              <button 
                onClick={() => {
                  setEditName(profile?.name || '');
                  setEditPhone(profile?.phone || '');
                  setIsEditingProfile(true);
                }}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
              >
                <Edit2 size={18} />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                  {profile?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{profile?.name}</h2>
                  <p className="text-gray-500">{profile?.phone}</p>
                </div>
              </div>
            </>
          ) : (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <h3 className="font-semibold text-gray-700 mb-2">Edit Profile</h3>
              <input 
                type="text"
                placeholder="Full Name"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500"
                value={editName}
                onChange={e => setEditName(e.target.value)}
              />
              <input 
                type="tel"
                placeholder="Phone Number"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500"
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
              />
              <div className="flex gap-2">
                <button type="submit" disabled={updateProfileMutation.isPending} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium">Save</button>
                <button type="button" onClick={() => setIsEditingProfile(false)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-medium">Cancel</button>
              </div>
            </form>
          )}
        </div>

        {/* Classes Customization */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div 
            onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
            className="p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold text-gray-700">Categories</h3>
            {isCategoriesExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
          </div>

          {isCategoriesExpanded && (
            <div className="p-5 pt-0 border-t border-gray-100">
              <div className="flex justify-end mb-4 mt-4">
                <button 
                  onClick={() => setIsEditingClasses(!isEditingClasses)}
                  className="text-sm text-blue-600 font-medium hover:underline"
                >
                  {isEditingClasses ? 'Done' : 'Customize'}
                </button>
              </div>
              
              <div className="space-y-2">
                {classes.map(cls => (
                  <div key={cls._id}>
                    {editingClassId === cls._id ? (
                      <div className="p-4 bg-white border border-blue-200 rounded-xl space-y-3 shadow-sm">
                        <input 
                          type="text"
                          value={editClassName}
                          onChange={e => setEditClassName(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm"
                        />
                        <div className="flex gap-2 justify-between">
                          {PREDEFINED_COLORS.map(c => (
                            <button 
                              key={c}
                              onClick={() => setEditClassColor(c)}
                              className={clsx(
                                "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                                editClassColor === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""
                              )}
                              style={{ backgroundColor: c }}
                            >
                              {editClassColor === c && <Check size={12} className="text-white" />}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button onClick={handleUpdateClass} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium text-sm">Save</button>
                          <button onClick={() => setEditingClassId(null)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium text-sm">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-full text-white" style={{ backgroundColor: cls.color }}>
                            {renderIcon(cls.icon)}
                          </div>
                          <span className="font-medium text-gray-800">{cls.name}</span>
                        </div>
                        {isEditingClasses && !cls.isDefault && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setEditingClassId(cls._id);
                                setEditClassName(cls.name);
                                setEditClassColor(cls.color);
                              }} 
                              className="text-blue-500 p-1 hover:bg-blue-50 rounded"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDeleteClass(cls._id)} className="text-red-500 p-1 hover:bg-red-50 rounded">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {isEditingClasses && (
                <div className="mt-4 p-4 border border-dashed border-gray-300 rounded-xl space-y-3">
                  <h4 className="text-sm font-semibold text-gray-600">Add New Category</h4>
                  <input 
                    type="text"
                    placeholder="Category Name"
                    value={newClassName}
                    onChange={e => setNewClassName(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm"
                  />
                  <div className="flex gap-2 justify-between">
                    {PREDEFINED_COLORS.map(c => (
                      <button 
                        key={c}
                        onClick={() => setNewClassColor(c)}
                        className={clsx(
                          "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                          newClassColor === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""
                        )}
                        style={{ backgroundColor: c }}
                      >
                        {newClassColor === c && <Check size={12} className="text-white" />}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={handleAddClass}
                    disabled={!newClassName || updateProfileMutation.isPending}
                    className="w-full mt-2 bg-gray-900 text-white py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <Plus size={16} /> Add Category
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Target Amount */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-3">Monthly Target</h3>
          
          {!isEditingTarget ? (
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div>
                <p className="text-sm text-gray-500 mb-1">Target Spending Amount</p>
                <p className="text-2xl font-bold text-gray-800">
                  {targetAmountNum > 0 ? `₹${targetAmountNum.toLocaleString('en-IN')}` : 'Not set'}
                </p>
              </div>
              <button 
                onClick={() => {
                  setTargetAmount(targetAmountNum || '');
                  setIsEditingTarget(true);
                }}
                className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
              >
                <Edit2 size={18} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleTargetSubmit} className="space-y-3">
              <input 
                type="number"
                inputMode="numeric"
                placeholder="Amount (₹)"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500"
                value={targetAmount}
                onChange={e => setTargetAmount(e.target.value)}
              />
              <div className="flex gap-2">
                <button 
                  type="submit"
                  disabled={updateTargetMutation.isPending}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium text-sm"
                >
                  Save
                </button>
                <button 
                  type="button"
                  onClick={() => setIsEditingTarget(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-medium text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          <p className="text-xs text-gray-400 mt-3 leading-relaxed">
            If you exceed this amount in a calendar month, you'll be notified on the home screen and history logs.
          </p>
        </div>

        {/* Monthly Analytics */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">Monthly Analytics</h3>
          <div className="space-y-3">
            {Object.keys(monthlyData).length > 0 ? (
              Object.entries(monthlyData).map(([month, data]) => {
                const isExpanded = expandedMonth === month;
                const exceededAmount = targetAmountNum > 0 ? data.total - targetAmountNum : 0;
                const exceeded = exceededAmount > 0;
                
                return (
                  <div key={month} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div 
                      onClick={() => setExpandedMonth(isExpanded ? null : month)}
                      className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{month}</p>
                        {exceeded ? (
                          <p className="text-xs text-red-500 mt-1 font-semibold flex items-center gap-1">
                            <X size={12} /> Exceeded by ₹{exceededAmount.toLocaleString('en-IN')}
                          </p>
                        ) : targetAmountNum > 0 ? (
                          <p className="text-xs text-green-500 mt-1 font-semibold flex items-center gap-1">
                            <Check size={12} /> Under target by ₹{Math.abs(exceededAmount).toLocaleString('en-IN')}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3">
                        <p className={clsx("font-bold", exceeded ? "text-red-600" : "text-gray-900")}>
                          ₹{data.total.toLocaleString('en-IN')}
                        </p>
                        {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                      </div>
                    </div>
                    
                    {/* Expanded Analytics Details */}
                    {isExpanded && (
                      <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-4">
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                            <p className="text-gray-500 text-xs mb-1">Target Amount</p>
                            <p className="font-bold text-gray-800">
                              {targetAmountNum > 0 ? `₹${targetAmountNum.toLocaleString('en-IN')}` : 'Not set'}
                            </p>
                          </div>
                          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                            <p className="text-gray-500 text-xs mb-1">Total Spent</p>
                            <p className={clsx("font-bold", exceeded ? "text-red-600" : "text-gray-800")}>
                              ₹{data.total.toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-2">Category Breakdown</p>
                          <div className="space-y-2">
                            {Object.entries(data.classBreakdown)
                              .sort(([,a], [,b]) => b - a)
                              .map(([classId, amount]) => {
                                const cls = getClassDetails(classId);
                                const percentage = ((amount / data.total) * 100).toFixed(0);
                                
                                return (
                                  <div key={classId} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cls.color }}></div>
                                      <span className="text-gray-600">{cls.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="font-medium text-gray-800">₹{amount.toLocaleString('en-IN')}</span>
                                      <span className="text-xs text-gray-400 w-8 text-right">{percentage}%</span>
                                    </div>
                                  </div>
                                )
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="text-center py-6 text-gray-500 bg-white rounded-xl border border-gray-100">
                No spending data yet.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
