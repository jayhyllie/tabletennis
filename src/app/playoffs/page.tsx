import { PlayoffBracket } from "@/components/playoff-bracket";

export default function PlayoffsPage() {
  return (
    <div className="mx-auto p-10 md:min-w-[1400px]">
      <div className="space-y-6">
        <PlayoffBracket />
      </div>
    </div>
  );
}
