import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import RoleBasedNavigation from "@/components/role-based-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useFeaturePermissions } from "@/hooks/use-feature-permissions";

type Deck = {
  id: string;
  title: string;
  description?: string | null;
};

type Tag = {
  id: string;
  name: string;
};

type CardRow = {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  source_type: string;
  source_id?: string | null;
};

export default function AdminSrs() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { hasFeature, isLoading } = useFeaturePermissions();

  // Check permission on mount
  useEffect(() => {
    if (!isLoading && !hasFeature("srs_admin")) {
      setLocation("/admin");
    }
  }, [hasFeature, isLoading, setLocation]);

  // Show loading or access denied
  if (isLoading) {
    return (
      <>
        <RoleBasedNavigation />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  if (!hasFeature("srs_admin")) {
    return (
      <>
        <RoleBasedNavigation />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center">
          <Alert className="max-w-md border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-sm text-red-800">
              Access Denied: You do not have permission to access SRS Admin.
            </AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  const isMobile = useIsMobile();

  // Show mobile-not-supported message on mobile devices
  if (isMobile) {
    return (
      <>
        <RoleBasedNavigation />
        <MobileNotSupported pageName="SRS Admin" />
      </>
    );
  }

  const [deckTitle, setDeckTitle] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");

  const [cardFront, setCardFront] = useState("");
  const [cardBack, setCardBack] = useState("");
  const [tagName, setTagName] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const { data: decks = [] } = useQuery<Deck[]>({
    queryKey: ["/api/srs/decks"],
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["/api/srs/tags"],
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: cards = [] } = useQuery<CardRow[]>({
    queryKey: selectedDeckId ? [`/api/srs/decks/${selectedDeckId}/cards`] : ["/api/srs/decks/_/cards"],
    enabled: !!selectedDeckId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const createDeck = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/srs/decks", {
        title: deckTitle,
        description: deckDescription || undefined,
      });
    },
    onSuccess: async () => {
      setDeckTitle("");
      setDeckDescription("");
      await queryClient.invalidateQueries({ queryKey: ["/api/srs/decks"] });
    },
  });

  const createTag = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/srs/tags", { name: tagName });
    },
    onSuccess: async () => {
      setTagName("");
      await queryClient.invalidateQueries({ queryKey: ["/api/srs/tags"] });
    },
  });

  const createCard = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/srs/cards", {
        deckId: selectedDeckId,
        front: cardFront,
        back: cardBack,
        tagIds: selectedTagIds.length ? selectedTagIds : undefined,
      });
    },
    onSuccess: async () => {
      setCardFront("");
      setCardBack("");
      setSelectedTagIds([]);
      await queryClient.invalidateQueries({ queryKey: [`/api/srs/decks/${selectedDeckId}/cards`] });
      await queryClient.invalidateQueries({ queryKey: ["/api/analytics/srs"] });
    },
  });

  const deckSelectItems = useMemo(() => decks.map((d) => ({ id: d.id, title: d.title })), [decks]);

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50" data-sidebar-content="true">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>SRS Admin</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="font-medium">Create deck</div>
              <Input
                placeholder="Deck title"
                value={deckTitle}
                onChange={(e) => setDeckTitle(e.target.value)}
              />
              <Textarea
                placeholder="Deck description (optional)"
                value={deckDescription}
                onChange={(e) => setDeckDescription(e.target.value)}
              />
              <Button
                onClick={() => createDeck.mutate()}
                disabled={!deckTitle.trim() || createDeck.isPending}
              >
                Create Deck
              </Button>
            </div>

            <div className="space-y-3">
              <div className="font-medium">Create tag</div>
              <Input
                placeholder="Tag name"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() => createTag.mutate()}
                disabled={!tagName.trim() || createTag.isPending}
              >
                Create Tag
              </Button>
              <div className="flex flex-wrap gap-2 pt-2">
                {tags.map((t) => (
                  <Badge key={t.id} variant="secondary">
                    {t.name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create cards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-md">
              <Select value={selectedDeckId} onValueChange={setSelectedDeckId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a deck" />
                </SelectTrigger>
                <SelectContent>
                  {deckSelectItems.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDeckId ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Textarea
                    placeholder="Front (prompt)"
                    value={cardFront}
                    onChange={(e) => setCardFront(e.target.value)}
                    className="min-h-[120px]"
                  />
                  <Textarea
                    placeholder="Back (answer)"
                    value={cardBack}
                    onChange={(e) => setCardBack(e.target.value)}
                    className="min-h-[120px]"
                  />

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-slate-700">Tags (optional)</div>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((t) => {
                        const active = selectedTagIds.includes(t.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() =>
                              setSelectedTagIds((prev) =>
                                active ? prev.filter((id) => id !== t.id) : [...prev, t.id],
                              )
                            }
                            className={`px-2 py-1 rounded border text-sm ${
                              active ? "bg-blue-100 border-blue-300 text-blue-900" : "bg-white border-gray-200 text-slate-700"
                            }`}
                          >
                            {t.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Button
                    onClick={() => createCard.mutate()}
                    disabled={!cardFront.trim() || !cardBack.trim() || createCard.isPending}
                  >
                    Add Card
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="font-medium">Cards in deck</div>
                  <div className="space-y-2 max-h-[420px] overflow-y-auto">
                    {cards.length > 0 ? (
                      cards.map((c) => (
                        <div key={c.id} className="p-3 bg-white border rounded">
                          <div className="text-xs text-slate-500 mb-2">#{c.id.slice(0, 8)} • {c.source_type}</div>
                          <div className="font-medium text-slate-900 whitespace-pre-wrap">{c.front}</div>
                          <div className="text-slate-700 whitespace-pre-wrap mt-2">{c.back}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-600">No cards yet.</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-600">Select a deck to create and view cards.</div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
    </>
  );
}

