import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WreckCard } from "@/components/salvage/WreckCard";
import { getWrecks, type SalvageWreck } from "@/lib/api";
import { useLocation } from "wouter";
import { Search, Filter, Plus, Grid, List } from "lucide-react";

export default function SalvageList() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [hullTypeFilter, setHullTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: wrecks, isLoading } = useQuery({
    queryKey: ["/api/salvage/wrecks", statusFilter, hullTypeFilter],
    queryFn: () => getWrecks({
      status: statusFilter !== "all" ? statusFilter : undefined,
      hullType: hullTypeFilter !== "all" ? hullTypeFilter : undefined,
    }),
  });

  const filteredWrecks = wrecks?.filter((wreck) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      wreck.name.toLowerCase().includes(query) ||
      wreck.notes?.toLowerCase().includes(query) ||
      wreck.id.toLowerCase().includes(query)
    );
  }) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Salvage Operations</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track 34 shipwrecks in Suva Harbour
          </p>
        </div>
        <Button onClick={() => setLocation("/salvage/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Wreck
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search wrecks by name, notes, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>
              <select
                value={hullTypeFilter}
                onChange={(e) => setHullTypeFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Hull Types</option>
                <option value="metal">Metal</option>
                <option value="fiberglass">Fiberglass</option>
              </select>
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-12">Loading wrecks...</div>
      ) : filteredWrecks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all" || hullTypeFilter !== "all"
                ? "No wrecks match your filters."
                : "No wrecks found. Add your first wreck to get started."}
            </p>
            {!searchQuery && statusFilter === "all" && hullTypeFilter === "all" && (
              <Button onClick={() => setLocation("/salvage/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Wreck
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredWrecks.length} of {wrecks?.length || 0} wrecks
            </p>
          </div>
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {filteredWrecks.map((wreck) => (
              <WreckCard key={wreck.id} wreck={wreck} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
