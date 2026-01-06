import React from 'react';
import { X } from 'lucide-react';

interface Operation {
  id: string;
  title: string;
  description?: string | null;
  operationDate: string | Date;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  type: 'DIVE' | 'INSPECTION' | 'MAINTENANCE' | 'TRAINING' | 'OTHER';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  color?: string | null;
}

interface CalendarViewListProps {
  operations: Operation[];
  onOperationClick?: (operation: Operation) => void;
  onDeleteOperation: (e: React.MouseEvent, operationId: string) => void;
  isLoading?: boolean;
}

function getOperationDate(operation: Operation): Date {
  if (operation.operationDate instanceof Date) {
    return operation.operationDate;
  }
  return new Date(operation.operationDate);
}

export default function CalendarViewList({
  operations,
  onOperationClick,
  onDeleteOperation,
  isLoading = false,
}: CalendarViewListProps) {
  // Sort operations by date and time
  const sortedOperations = [...operations].sort((a, b) => {
    const dateA = getOperationDate(a);
    const dateB = getOperationDate(b);
    
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    
    // If same date, sort by start time
    const timeA = a.startTime || '00:00';
    const timeB = b.startTime || '00:00';
    return timeA.localeCompare(timeB);
  });

  const formatDate = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-slate-500">Loading operations...</div>
    );
  }

  if (sortedOperations.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No operations scheduled
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedOperations.map((op) => {
        const opDate = getOperationDate(op);
        const isPast = opDate < new Date() && op.status !== 'COMPLETED';
        
        return (
          <div
            key={op.id}
            className={`border rounded-lg p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
              isPast ? 'opacity-60' : ''
            }`}
            onClick={() => onOperationClick?.(op)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: op.color || '#8b5cf6' }}
                  />
                  <h3 className="font-semibold text-slate-900 truncate">{op.title}</h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {op.type}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    op.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    op.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                    op.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {op.status}
                  </span>
                </div>
                <div className="text-sm text-slate-600 mb-1">
                  {formatDate(opDate)}
                  {op.startTime && (
                    <>
                      {' • '}
                      {op.startTime}
                      {op.endTime && ` - ${op.endTime}`}
                    </>
                  )}
                </div>
                {op.location && (
                  <div className="text-sm text-slate-500 mb-1">
                    📍 {op.location}
                  </div>
                )}
                {op.description && (
                  <p className="text-sm text-slate-600 line-clamp-2">{op.description}</p>
                )}
              </div>
              <button
                onClick={(e) => onDeleteOperation(e, op.id)}
                className="opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity ml-2 flex-shrink-0 text-slate-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

