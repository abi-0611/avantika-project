import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, RefreshCw, Plus, Trash2, Search, Shield } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { useToast } from '../components/Toast';
import RiskBadge from '../components/RiskBadge';
import { cn } from '../lib/utils';

export default function AdminPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const { showToast } = useToast();

  const [newRule, setNewRule] = useState({
    keyword: '',
    category: '',
    riskLevel: 'Moderate'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rulesData, logsData] = await Promise.all([
        apiClient.get<any[]>('/rules'),
        apiClient.get<any[]>('/logs?limit=50')
      ]);
      setRules(rulesData);
      setLogs(logsData);
    } catch (error) {
      console.error('Failed to fetch admin data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/rules', newRule);
      showToast('Rule added successfully', 'success');
      setNewRule({ keyword: '', category: '', riskLevel: 'Moderate' });
      fetchData();
    } catch (error) {
      showToast('Failed to add rule', 'error');
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await apiClient.delete(`/rules/${id}`);
      showToast('Rule deleted', 'success');
      fetchData();
    } catch (error) {
      showToast('Failed to delete rule', 'error');
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      await apiClient.post('/admin/retrain');
      showToast('Model retraining initiated', 'success');
    } catch (error) {
      showToast('Failed to start retraining', 'error');
    } finally {
      setTimeout(() => setRetraining(false), 2000); // Simulate processing time
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="glass-panel border-b border-border/50 p-6 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-danger" /> Admin Dashboard
          </h1>
          <p className="text-sm text-text-secondary mt-1">Manage safety rules and monitor system logs.</p>
        </div>
        <button 
          onClick={handleRetrain}
          disabled={retraining}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-70"
        >
          <RefreshCw className={cn("w-4 h-4", retraining && "animate-spin")} />
          {retraining ? 'Retraining...' : 'Retrain Models'}
        </button>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden p-6 gap-6">
        {/* Left Panel - Rules Manager */}
        <div className="w-full lg:w-1/3 glass-panel rounded-2xl flex flex-col overflow-hidden border border-border/50">
          <div className="p-5 border-b border-border/50 bg-surface/30">
            <h2 className="text-lg font-display font-bold text-white mb-4">Keyword Rules</h2>
            <form onSubmit={handleAddRule} className="space-y-3">
              <input
                type="text"
                placeholder="Keyword or phrase..."
                value={newRule.keyword}
                onChange={(e) => setNewRule({ ...newRule, keyword: e.target.value })}
                className="w-full bg-surface border border-border rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-primary/50"
                required
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Category (e.g. self-harm)"
                  value={newRule.category}
                  onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                  className="flex-1 bg-surface border border-border rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-primary/50"
                  required
                />
                <select
                  value={newRule.riskLevel}
                  onChange={(e) => setNewRule({ ...newRule, riskLevel: e.target.value })}
                  className="w-32 bg-surface border border-border rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-primary/50 appearance-none"
                >
                  <option value="Low">Low</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-surface hover:bg-surface-hover border border-border text-white py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Rule
              </button>
            </form>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {rules.map((rule) => (
              <div key={rule.id} className="p-3 rounded-xl bg-surface/50 border border-border flex items-center justify-between group">
                <div className="min-w-0 flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm text-white truncate">{rule.keyword}</span>
                    <RiskBadge level={rule.riskLevel} />
                  </div>
                  <span className="text-xs text-text-secondary px-2 py-0.5 rounded-md bg-surface border border-border inline-block">
                    {rule.category}
                  </span>
                </div>
                <button 
                  onClick={() => handleDeleteRule(rule.id)}
                  className="p-2 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {rules.length === 0 && (
              <p className="text-center text-text-secondary py-8 text-sm">No rules configured.</p>
            )}
          </div>
        </div>

        {/* Right Panel - Security Logs */}
        <div className="w-full lg:w-2/3 glass-panel rounded-2xl flex flex-col overflow-hidden border border-border/50">
          <div className="p-5 border-b border-border/50 bg-surface/30 flex items-center justify-between">
            <h2 className="text-lg font-display font-bold text-white">Security Logs</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Search logs..."
                className="w-full bg-surface border border-border rounded-xl py-1.5 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
            {logs.length > 0 ? (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 rounded-xl bg-surface/50 border border-border hover:bg-surface transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <RiskBadge level={log.riskLevel} />
                        {log.escalated && (
                          <span className="px-2 py-0.5 rounded-full bg-danger/20 text-danger text-[10px] font-bold uppercase tracking-wider border border-danger/30">
                            Escalated
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-text-secondary font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-white mb-2">"{log.text}"</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-secondary">Category: <span className="text-text-primary">{log.riskCategory}</span></span>
                      <span className="text-xs text-text-secondary">•</span>
                      <span className="text-xs text-text-secondary">User: <span className="font-mono">{log.uid}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-text-secondary">
                <Shield className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium text-white mb-1">System Secure</p>
                <p className="text-sm">No security logs recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
