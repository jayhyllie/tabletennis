import { PlayoffBracket } from "@/components/playoff-bracket";

export default function PlayoffsPage() {
  return (
    <div className="mx-auto px-2 py-10 xl:min-w-[1400px] xl:p-10">
      <div className="space-y-6">
        <PlayoffBracket />
      </div>
    </div>
  );
}
