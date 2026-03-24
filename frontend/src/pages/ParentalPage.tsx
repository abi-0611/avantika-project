import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, ShieldAlert, Activity, Plus, X, Search, MessageSquare, AlertTriangle, ShieldCheck } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { useToast } from '../components/Toast';
import RiskBadge from '../components/RiskBadge';
import { cn } from '../lib/utils';

export default function ParentalPage() {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any | null>(null);
  const [newChildEmail, setNewChildEmail] = useState('');
  const [childSettings, setChildSettings] = useState<any>(null);
  const [childChats, setChildChats] = useState<any[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchChildData(selectedChild.childUid);
    }
  }, [selectedChild]);

  const fetchChildren = async () => {
    try {
      const data = await apiClient.get<any[]>('/supervision');
      setChildren(data);
      if (data.length > 0 && !selectedChild) {
        setSelectedChild(data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch children', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildData = async (childUid: string) => {
    try {
      const [settings, chats] = await Promise.all([
        apiClient.get<any>(`/child-settings/${childUid}`),
        apiClient.get<any[]>(`/chats/child/${childUid}`)
      ]);
      setChildSettings(settings);
      setChildChats(chats);
    } catch (error) {
      console.error('Failed to fetch child data', error);
    }
  };

  const handleLinkChild = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/supervision', { childEmail: newChildEmail });
      showToast('Child linked successfully', 'success');
      setNewChildEmail('');
      fetchChildren();
    } catch (error: any) {
      showToast(error.message || 'Failed to link child', 'error');
    }
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim() || !selectedChild) return;
    
    try {
      const updatedKeywords = [...(childSettings?.blockedKeywords || []), newKeyword];
      await apiClient.put(`/child-settings/${selectedChild.childUid}`, {
        blockedKeywords: updatedKeywords,
        blockedTopics: childSettings?.blockedTopics || []
      });
      setChildSettings({ ...childSettings, blockedKeywords: updatedKeywords });
      setNewKeyword('');
      showToast('Keyword added', 'success');
    } catch (error) {
      showToast('Failed to add keyword', 'error');
    }
  };

  const handleRemoveKeyword = async (keyword: string) => {
    if (!selectedChild) return;
    try {
      const updatedKeywords = childSettings.blockedKeywords.filter((k: string) => k !== keyword);
      await apiClient.put(`/child-settings/${selectedChild.childUid}`, {
        blockedKeywords: updatedKeywords,
        blockedTopics: childSettings?.blockedTopics || []
      });
      setChildSettings({ ...childSettings, blockedKeywords: updatedKeywords });
      showToast('Keyword removed', 'success');
    } catch (error) {
      showToast('Failed to remove keyword', 'error');
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
    <div className="flex h-full flex-col md:flex-row">
      {/* Sidebar - Linked Children */}
      <div className="w-full md:w-80 glass-panel border-r border-border/50 flex flex-col h-full shrink-0">
        <div className="p-6 border-b border-border/50">
          <h2 className="text-xl font-display font-bold text-white mb-4">Supervision</h2>
          
          <form onSubmit={handleLinkChild} className="relative">
            <input
              type="email"
              value={newChildEmail}
              onChange={(e) => setNewChildEmail(e.target.value)}
              placeholder="Link child email..."
              className="w-full bg-surface/50 border border-border rounded-xl py-2.5 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
              required
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          {children.map((child) => (
            <button
              key={child.childUid}
              onClick={() => setSelectedChild(child)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                selectedChild?.childUid === child.childUid 
                  ? "bg-primary/10 border border-primary/20" 
                  : "hover:bg-surface border border-transparent"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-primary font-bold border border-border">
                {(child.childDisplayName || child.childEmail || 'C')?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{child.childDisplayName || child.childEmail}</p>
                <p className="text-xs text-text-secondary truncate">{child.childEmail}</p>
              </div>
            </button>
          ))}
          {children.length === 0 && (
            <div className="text-center p-6 text-text-secondary">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No children linked yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Dashboard Area */}
      {selectedChild ? (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {/* Header & Stats */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-primary/20">
                {(selectedChild.childDisplayName || selectedChild.childEmail || 'C')?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-display font-bold text-white">{(selectedChild.childDisplayName || selectedChild.childEmail || 'Child')}'s Activity</h1>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium border border-success/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span> LIVE
                  </span>
                </div>
                <p className="text-text-secondary">{selectedChild.childEmail}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-text-secondary font-medium">Total Chats</p>
                <p className="text-2xl font-bold text-white">{childChats.length}</p>
              </div>
            </div>
            <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center text-warning">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-text-secondary font-medium">Safety Alerts</p>
                <p className="text-2xl font-bold text-white">
                  {childChats.filter(c => c.riskLevel && c.riskLevel !== 'Safe').length}
                </p>
              </div>
            </div>
            <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-text-secondary font-medium">Active Filters</p>
                <p className="text-2xl font-bold text-white">{childSettings?.blockedKeywords?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Filters */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col h-[400px]">
              <h3 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-primary" /> Content Filters
              </h3>
              
              <form onSubmit={handleAddKeyword} className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="Add keyword to block..."
                  className="flex-1 bg-surface/50 border border-border rounded-xl py-2 px-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                />
                <button type="submit" className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                  Add
                </button>
              </form>

              <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="flex flex-wrap gap-2">
                  {childSettings?.blockedKeywords?.map((keyword: string) => (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={keyword}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border text-sm text-text-primary"
                    >
                      <span>{keyword}</span>
                      <button onClick={() => handleRemoveKeyword(keyword)} className="text-text-secondary hover:text-danger transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                  {(!childSettings?.blockedKeywords || childSettings.blockedKeywords.length === 0) && (
                    <p className="text-sm text-text-secondary w-full text-center py-8">No keywords blocked.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col h-[400px]">
              <h3 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" /> Recent Alerts
              </h3>
              
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-2">
                {childChats.filter(c => c.riskLevel && c.riskLevel !== 'Safe').length > 0 ? (
                  childChats.filter(c => c.riskLevel && c.riskLevel !== 'Safe').map((chat, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-surface/50 border border-border/50 hover:bg-surface transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <RiskBadge level={chat.riskLevel} />
                        <span className="text-xs text-text-secondary">
                          {new Date(chat.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-white mb-1 line-clamp-2">"{chat.text}"</p>
                      <p className="text-xs text-text-secondary">Category: {chat.riskCategory}</p>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-text-secondary">
                    <ShieldCheck className="w-12 h-12 mb-2 opacity-50 text-success" />
                    <p>No safety alerts found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-text-secondary p-6">
          <Users className="w-16 h-16 mb-4 opacity-20" />
          <h3 className="text-xl font-display font-bold text-white mb-2">Select a Child</h3>
          <p className="text-center max-w-md">Select a linked child from the sidebar to view their activity and manage safety settings.</p>
        </div>
      )}
    </div>
  );
}
