import { GroupsClient } from "@/components/group-client";
import { currentUser } from "@clerk/nextjs/server";

export default async function GroupsPage() {
  const user = await currentUser();

  const userData = user
    ? {
        id: user.id,
        role: user.publicMetadata.role as string,
      }
    : null;

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-6 text-3xl font-bold">Grupper</h1>
      <GroupsClient user={userData} />
    </div>
  );
}
