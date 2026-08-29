import React from 'react';
import {
  FileText,
  PackageCheck,
  Truck,
  Navigation,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock
} from 'lucide-react';

export const StatusBadge = ({ status, size = 'md', className = '' }) => {
  const statusConfig = {
    REGISTERED: {
      label: 'Registered',
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-200',
      border: 'border-slate-300 dark:border-slate-700',
      icon: FileText,
    },
    RECEIVED: {
      label: 'Received',
      bg: 'bg-blue-50 dark:bg-blue-950/50',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      icon: PackageCheck,
    },
    LOADED: {
      label: 'Loaded on Bus',
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      icon: Truck,
    },
    IN_TRANSIT: {
      label: 'In Transit',
      bg: 'bg-indigo-50 dark:bg-indigo-950/50',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-200 dark:border-indigo-800',
      icon: Navigation,
      pulse: true,
    },
    ARRIVED: {
      label: 'Arrived at Station',
      bg: 'bg-teal-50 dark:bg-teal-950/50',
      text: 'text-teal-700 dark:text-teal-300',
      border: 'border-teal-200 dark:border-teal-800',
      icon: MapPin,
    },
    DELIVERED: {
      label: 'Delivered',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: CheckCircle2,
    },
    MISSING: {
      label: 'Missing Alert',
      bg: 'bg-red-50 dark:bg-red-950/50',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800',
      icon: AlertTriangle,
    },
    DAMAGED: {
      label: 'Damaged Reported',
      bg: 'bg-rose-50 dark:bg-rose-950/50',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
      icon: AlertOctagon,
    },
    SCHEDULED: {
      label: 'Scheduled',
      bg: 'bg-purple-50 dark:bg-purple-950/50',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800',
      icon: Clock,
    },
  };

  const config = statusConfig[status] || {
    label: status ? status.replace('_', ' ') : 'Unknown',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    icon: Clock,
  };

  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      <IconComponent size={iconSizes[size] || 14} className={config.pulse ? 'animate-pulse text-indigo-600 dark:text-indigo-400' : ''} />
      <span>{config.label}</span>
    </span>
  );
};
