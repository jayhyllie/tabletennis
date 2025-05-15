import { PlayoffBracket } from "@/components/playoff-bracket";

export default function PlayoffEmbedPage() {
  return (
    <div className="h-screen w-screen overflow-auto bg-background text-foreground">
      <PlayoffBracket />
    </div>
  );
}
