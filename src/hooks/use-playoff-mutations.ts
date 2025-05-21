import { api } from "@/trpc/react";
import { useToast } from "@/hooks/use-toast";

export function usePlayoffMutations() {
  const utils = api.useUtils();
  const { toast } = useToast();

  const { mutate: generatePlayoffs, isPending: isGenerating } =
    api.match.generatePlayoffs.useMutation({
      onSuccess: async () => {
        await utils.match.getAll.invalidate();
        toast({
          title: "Slutspel genererat",
          description: "Slutspelsmatcherna har skapats",
        });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Fel",
          description: error.message,
        });
      },
    });

  const { mutate: createNextRoundMatches, isPending: isCreatingNextRound } =
    api.match.createEmptyPlayoffMatchesForRound.useMutation({
      onSuccess: async (data) => {
        await utils.match.getAll.invalidate();
        toast({
          title: data.createdNew ? "Nästa omgång genererad" : "Info",
          description: data.message,
        });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Fel vid generering av nästa omgång",
          description: error.message,
        });
      },
    });

  return {
    generatePlayoffs,
    isGenerating,
    createNextRoundMatches,
    isCreatingNextRound,
  };
}
