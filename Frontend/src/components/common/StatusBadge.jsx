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
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      border: 'border-slate-300',
      icon: FileText,
    },
    RECEIVED: {
      label: 'Received',
      bg: 'bg-sky-50',
      text: 'text-sky-800',
      border: 'border-sky-300',
      icon: PackageCheck,
    },
    LOADED: {
      label: 'Loaded on Bus',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-300',
      icon: Truck,
    },
    IN_TRANSIT: {
      label: 'In Transit',
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-400',
      icon: Navigation,
      pulse: true,
    },
    ARRIVED: {
      label: 'Arrived at Station',
      bg: 'bg-teal-50',
      text: 'text-teal-800',
      border: 'border-teal-300',
      icon: MapPin,
    },
    DELIVERED: {
      label: 'Delivered',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-300',
      icon: CheckCircle2,
    },
    MISSING: {
      label: 'Missing Alert',
      bg: 'bg-red-50',
      text: 'text-red-800',
      border: 'border-red-300',
      icon: AlertTriangle,
    },
    DAMAGED: {
      label: 'Damaged Reported',
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-300',
      icon: AlertOctagon,
    },
    SCHEDULED: {
      label: 'Scheduled',
      bg: 'bg-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-300',
      icon: Clock,
    },
  };

  const config = statusConfig[status] || {
    label: status ? status.replace('_', ' ') : 'Unknown',
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-300',
    icon: Clock,
  };

  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1 font-semibold',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border shadow-2xs ${config.bg} ${config.text} ${config.border} ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      <IconComponent size={iconSizes[size] || 14} className={config.pulse ? 'animate-pulse text-blue-600' : ''} />
      <span>{config.label}</span>
    </span>
  );
};
