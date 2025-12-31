import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import RoleBasedNavigation from "@/components/role-based-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";

type Deck = {
  id: string;
  title: string;
  description?: string | null;
};

type DueItem = {
  card_id: string;
  deck_id: string;
  front: string;
  back: string;
  state: string;
  due_at: number;
};

type DueResponse = {
  deckId: string;
  now: number;
  items: DueItem[];
};

const CURRENT_USER_ID = "current-user";

export default function SrsReview() {
  const queryClient = useQueryClient();
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const [queue, setQueue] = useState<DueItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const { data: decks = [] } = useQuery<Deck[]>({
    queryKey: ["/api/srs/decks"],
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!selectedDeckId && decks.length > 0) {
      setSelectedDeckId(decks[0].id);
    }
  }, [decks, selectedDeckId]);

  const { data: dueData, refetch: refetchDue, isFetching: isFetchingDue } = useQuery<DueResponse>({
    queryKey: ["/api/srs/due", `?userId=${CURRENT_USER_ID}&deckId=${selectedDeckId}&limit=50`],
    enabled: !!selectedDeckId,
    staleTime: 0,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (dueData?.items) {
      setQueue(dueData.items);
      setIdx(0);
      setRevealed(false);
    }
  }, [dueData?.deckId, dueData?.items]);

  const current = queue[idx];
  const total = queue.length;
  const progress = total > 0 ? ((idx + 1) / total) * 100 : 0;

  const deckTitle = useMemo(() => {
    const deck = decks.find((d) => d.id === selectedDeckId);
    return deck?.title ?? "Daily Review";
  }, [decks, selectedDeckId]);

  const reviewMutation = useMutation({
    mutationFn: async (grade: 0 | 1 | 2 | 3) => {
      if (!current) return;
      await apiRequest("POST", "/api/srs/review", {
        userId: CURRENT_USER_ID,
        deckId: selectedDeckId,
        cardId: current.card_id,
        grade,
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/srs"] });
      await refetchDue();
    },
  });

  const handleGrade = async (grade: 0 | 1 | 2 | 3) => {
    if (!current || !selectedDeckId) return;
    await reviewMutation.mutateAsync(grade);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
      <RoleBasedNavigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Review (SRS)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {decks.length === 0 ? (
              <div className="text-slate-600">
                No SRS decks yet. Create one in <a className="underline" href="/admin/srs">SRS Admin</a>.
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="w-full sm:w-80">
                  <Select value={selectedDeckId} onValueChange={setSelectedDeckId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a deck" />
                    </SelectTrigger>
                    <SelectContent>
                      {decks.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-slate-600">
                  {isFetchingDue ? "Updating…" : `${total} cards queued`} • {deckTitle}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>
                  {total > 0 ? `Card ${idx + 1} of ${total}` : "No cards due"}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {selectedDeckId && total > 0 && current ? (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Prompt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-white border text-slate-900 whitespace-pre-wrap">
                {current.front}
              </div>

              {revealed ? (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-900 whitespace-pre-wrap">
                  {current.back}
                </div>
              ) : (
                <Button onClick={() => setRevealed(true)} className="w-full">
                  Reveal Answer
                </Button>
              )}

              {revealed && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => handleGrade(0)}
                    disabled={reviewMutation.isPending}
                  >
                    Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleGrade(1)}
                    disabled={reviewMutation.isPending}
                  >
                    Hard
                  </Button>
                  <Button
                    onClick={() => handleGrade(2)}
                    disabled={reviewMutation.isPending}
                  >
                    Good
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleGrade(3)}
                    disabled={reviewMutation.isPending}
                  >
                    Easy
                  </Button>
                </div>
              )}

              <div className="flex justify-between pt-2 text-sm text-slate-600">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIdx((v) => Math.max(0, v - 1));
                    setRevealed(false);
                  }}
                  disabled={idx === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIdx((v) => Math.min(total - 1, v + 1));
                    setRevealed(false);
                  }}
                  disabled={idx >= total - 1}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          selectedDeckId && (
            <Card>
              <CardContent className="py-10 text-center text-slate-600">
                Nothing due right now. Great work.
              </CardContent>
            </Card>
          )
        )}
      </main>
    </div>
  );
}

