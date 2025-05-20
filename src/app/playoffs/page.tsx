import { PlayoffBracket } from "@/components/playoff-bracket";
import { currentUser } from "@clerk/nextjs/server";

export default async function PlayoffsPage() {
  const user = await currentUser();

  const userData = user
    ? {
        id: user.id,
        role: user.publicMetadata.role as string,
      }
    : null;
  return (
    <div className="mx-auto px-2 py-10 xl:min-w-[1400px] xl:p-10">
      <div className="space-y-6">
        <PlayoffBracket user={userData} />
      </div>
    </div>
  );
}
