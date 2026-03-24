import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, Plus, Trash2, BarChart3, History, X, RefreshCw } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { SafetyRule, SafetyLog } from '../types';
import { motion } from 'motion/react';

import { handleFirestoreError, OperationType } from '../services/errorService';

export default function AdminDashboard({ onClose }: { onClose: () => void }) {
  const [rules, setRules] = useState<SafetyRule[]>([]);
  const [logs, setLogs] = useState<SafetyLog[]>([]);
  const [newRule, setNewRule] = useState({ keyword: '', category: 'General', riskLevel: 'Low' as any });
  const [isRetraining, setIsRetraining] = useState(false);

  useEffect(() => {
    const rulesUnsub = onSnapshot(collection(db, 'rules'), (snapshot) => {
      setRules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SafetyRule)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'rules'));

    const logsQuery = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(50));
    const logsUnsub = onSnapshot(logsQuery, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SafetyLog)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'logs'));

    return () => {
      rulesUnsub();
      logsUnsub();
    };
  }, []);

  const addRule = async () => {
    if (!newRule.keyword) return;
    try {
      await addDoc(collection(db, 'rules'), newRule);
      setNewRule({ keyword: '', category: 'General', riskLevel: 'Low' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'rules');
    }
  };

  const deleteRule = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'rules', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `rules/${id}`);
    }
  };

  const retrainModels = async () => {
    setIsRetraining(true);
    try {
      const res = await fetch('/api/admin/retrain', { method: 'POST' });
      const data = await res.json();
      alert(data.message);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRetraining(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <header className="px-8 py-6 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-emerald-600" />
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Admin Customization</h2>
              <p className="text-sm text-stone-500">Manage safety rules and monitor risks</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={retrainModels}
              disabled={isRetraining}
              className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-all disabled:opacity-50"
            >
              <RefreshCw className={isRetraining ? "animate-spin w-4 h-4" : "w-4 h-4"} />
              {isRetraining ? "Retraining..." : "Retrain Models"}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Rules Management */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-semibold">Keyword Rules</h3>
            </div>
            
            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input 
                  placeholder="Keyword"
                  value={newRule.keyword}
                  onChange={e => setNewRule({...newRule, keyword: e.target.value})}
                  className="bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm"
                />
                <select 
                  value={newRule.riskLevel}
                  onChange={e => setNewRule({...newRule, riskLevel: e.target.value as any})}
                  className="bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm"
                >
                  <option value="Low">Low Risk</option>
                  <option value="Moderate">Moderate Risk</option>
                  <option value="High">High Risk</option>
                </select>
              </div>
              <div className="flex gap-4">
                <input 
                  placeholder="Category (e.g. Self-harm)"
                  value={newRule.category}
                  onChange={e => setNewRule({...newRule, category: e.target.value})}
                  className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm"
                />
                <button 
                  onClick={addRule}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {rules.map(rule => (
                <div key={rule.id} className="flex items-center justify-between p-4 bg-white border border-stone-100 rounded-xl shadow-sm">
                  <div>
                    <span className="font-mono text-sm font-bold text-stone-900">"{rule.keyword}"</span>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 bg-stone-100 rounded-full text-stone-500 uppercase font-bold">{rule.category}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                        rule.riskLevel === 'High' ? 'bg-red-100 text-red-600' : 
                        rule.riskLevel === 'Moderate' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {rule.riskLevel}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => deleteRule(rule.id!)} className="text-stone-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Analytics & Logs */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-semibold">Security Logs</h3>
            </div>

            <div className="space-y-3">
              {logs.map(log => (
                <div key={log.id} className="p-4 bg-stone-50 border border-stone-200 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                      log.riskLevel === 'High' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'
                    }`}>
                      {log.riskLevel}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-stone-800 mb-1">"{log.text}"</p>
                  <div className="flex items-center gap-2 text-[10px] text-stone-500">
                    <span className="font-bold">Category:</span> {log.riskCategory}
                    {log.escalated && (
                      <span className="flex items-center gap-1 text-red-600 font-bold ml-auto">
                        <AlertCircle className="w-3 h-3" /> Escalated
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center py-12 text-stone-400">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No critical safety events logged yet.</p>
                </div>
              )}
            </div>
          </section>
        </main>
      </motion.div>
    </div>
  );
}
