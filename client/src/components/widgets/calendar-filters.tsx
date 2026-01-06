import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export interface CalendarFilters {
  search: string;
  type: 'ALL' | 'DIVE' | 'INSPECTION' | 'MAINTENANCE' | 'TRAINING' | 'OTHER';
  status: 'ALL' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  dateFrom: string;
  dateTo: string;
}

interface CalendarFiltersProps {
  filters: CalendarFilters;
  onFiltersChange: (filters: CalendarFilters) => void;
  onClearFilters: () => void;
}

export function CalendarFiltersComponent({
  filters,
  onFiltersChange,
  onClearFilters,
}: CalendarFiltersProps) {
  const hasActiveFilters = 
    filters.search ||
    filters.type !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.dateFrom ||
    filters.dateTo;

  const updateFilter = <K extends keyof CalendarFilters>(key: K, value: CalendarFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Filters</Label>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search operations..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
        </div>

        {/* Type Filter */}
        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={filters.type} onValueChange={(value) => updateFilter('type', value as CalendarFilters['type'])}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="DIVE">Dive</SelectItem>
              <SelectItem value="INSPECTION">Inspection</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              <SelectItem value="TRAINING">Training</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value as CalendarFilters['status'])}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range - From */}
        <div>
          <Label htmlFor="dateFrom">From Date</Label>
          <Input
            id="dateFrom"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => updateFilter('dateFrom', e.target.value)}
          />
        </div>

        {/* Date Range - To */}
        <div>
          <Label htmlFor="dateTo">To Date</Label>
          <Input
            id="dateTo"
            type="date"
            value={filters.dateTo}
            onChange={(e) => updateFilter('dateTo', e.target.value)}
          />
        </div>
      </div>

      {/* Active Filter Indicators */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2">
          {filters.search && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
              Search: {filters.search}
            </span>
          )}
          {filters.type !== 'ALL' && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
              Type: {filters.type}
            </span>
          )}
          {filters.status !== 'ALL' && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
              Status: {filters.status}
            </span>
          )}
          {filters.dateFrom && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
              From: {filters.dateFrom}
            </span>
          )}
          {filters.dateTo && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
              To: {filters.dateTo}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

