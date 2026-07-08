import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

export function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function getCriticalityColor(criticality: string): string {
  switch (criticality) {
    case 'Critical': return 'text-nq-accent-red';
    case 'High': return 'text-nq-accent-amber';
    case 'Medium': return 'text-nq-accent-blue';
    case 'Low': return 'text-nq-accent-emerald';
    default: return 'text-nq-text-secondary';
  }
}

export function getCriticalityBg(criticality: string): string {
  switch (criticality) {
    case 'Critical': return 'bg-nq-accent-red/15 text-nq-accent-red border-nq-accent-red/20';
    case 'High': return 'bg-nq-accent-amber/15 text-nq-accent-amber border-nq-accent-amber/20';
    case 'Medium': return 'bg-nq-accent-blue/15 text-nq-accent-blue border-nq-accent-blue/20';
    case 'Low': return 'bg-nq-accent-emerald/15 text-nq-accent-emerald border-nq-accent-emerald/20';
    default: return 'bg-nq-text-muted/15 text-nq-text-secondary';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'Running': case 'Compliant': case 'Pass': case 'Completed': case 'Indexed': case 'Resolved': case 'Closed':
      return 'bg-nq-accent-emerald/15 text-nq-accent-emerald border-nq-accent-emerald/20';
    case 'Alert': case 'Non-Compliant': case 'Fail': case 'Overdue': case 'Failed': case 'Critical': case 'Open':
      return 'bg-nq-accent-red/15 text-nq-accent-red border-nq-accent-red/20';
    case 'Under Maintenance': case 'Pending': case 'Conditional Pass': case 'In Progress': case 'Processing':
      return 'bg-nq-accent-amber/15 text-nq-accent-amber border-nq-accent-amber/20';
    case 'Idle': case 'Scheduled': case 'N/A':
      return 'bg-nq-accent-blue/15 text-nq-accent-blue border-nq-accent-blue/20';
    case 'Shutdown':
      return 'bg-nq-text-muted/15 text-nq-text-muted border-nq-text-muted/20';
    default:
      return 'bg-nq-text-muted/15 text-nq-text-secondary';
  }
}

export function getConfidenceColor(confidence: string): string {
  switch (confidence) {
    case 'High': return 'text-nq-accent-emerald';
    case 'Medium': return 'text-nq-accent-amber';
    case 'Low': return 'text-nq-accent-red';
    default: return 'text-nq-text-secondary';
  }
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + '...';
}
