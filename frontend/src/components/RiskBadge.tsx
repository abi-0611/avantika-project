import React from 'react';
import { cn } from '../lib/utils';
import { ShieldCheck, AlertTriangle, ShieldAlert, AlertOctagon } from 'lucide-react';

type RiskLevel = 'Safe' | 'Low' | 'Moderate' | 'High';

interface RiskBadgeProps {
  level: RiskLevel | string;
  className?: string;
}

export default function RiskBadge({ level, className }: RiskBadgeProps) {
  const normalizedLevel = (level || 'Safe').toLowerCase();

  const config = {
    safe: {
      color: 'text-success',
      bg: 'bg-success/10',
      border: 'border-success/20',
      icon: ShieldCheck,
      label: 'Safe'
    },
    low: {
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/20',
      icon: AlertTriangle,
      label: 'Low Risk'
    },
    moderate: {
      color: 'text-warning',
      bg: 'bg-warning/10',
      border: 'border-warning/20',
      icon: ShieldAlert,
      label: 'Moderate Risk'
    },
    high: {
      color: 'text-danger',
      bg: 'bg-danger/10',
      border: 'border-danger/20',
      icon: AlertOctagon,
      label: 'High Risk'
    }
  };

  const currentConfig = config[normalizedLevel as keyof typeof config] || config.safe;
  const Icon = currentConfig.icon;

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
      currentConfig.bg,
      currentConfig.color,
      currentConfig.border,
      normalizedLevel === 'high' && "animate-pulse",
      className
    )}>
      <Icon className="w-3.5 h-3.5" />
      <span>{currentConfig.label}</span>
    </div>
  );
}
