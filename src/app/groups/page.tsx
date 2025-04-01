import { GroupList } from "@/components/group-list";
import { GroupForm } from "@/components/group-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { currentUser } from "@clerk/nextjs/server";

export default async function GroupsPage() {
  const user = await currentUser();
  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-6 text-3xl font-bold">Grupper</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Grupplista</CardTitle>
            <CardDescription>Se och hantera grupper</CardDescription>
          </CardHeader>
          <CardContent>
            <GroupList />
          </CardContent>
        </Card>

        {user?.publicMetadata?.role === "admin" ? (
          <Card>
            <CardHeader>
              <CardTitle>Skapa grupper</CardTitle>
              <CardDescription>
                Generera grupper för turneringen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GroupForm />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
