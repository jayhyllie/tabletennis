import { Button } from "@/components/ui/button";

type ActionButtonsProps = {
  nextRound: { roundNumber: number; name: string } | null;
  onGenerateNext: (params: { roundNumber: number }) => void;
  isCreatingNext: boolean;
};

export function ActionButtons({
  nextRound,
  onGenerateNext,
  isCreatingNext,
}: ActionButtonsProps) {
  return (
    <div className="mt-10 flex flex-wrap justify-center gap-4 px-4 md:justify-start">
      {nextRound && (
        <Button
          onClick={() => onGenerateNext({ roundNumber: nextRound.roundNumber })}
          disabled={isCreatingNext}
          variant="secondary"
          className="text-white"
        >
          {isCreatingNext
            ? "Genererar..."
            : `Generera matcher för ${nextRound.name}`}
        </Button>
      )}
    </div>
  );
}
