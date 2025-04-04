import { MatchList } from "@/components/match-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { currentUser } from "@clerk/nextjs/server";

export default async function MatchesPage() {
  const user = await currentUser();

  const userData = user
    ? {
        id: user.id,
        role: user.publicMetadata.role as string,
      }
    : null;
  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-6 text-3xl font-bold">Matcher</h1>

      <Card>
        <CardHeader>
          <CardTitle>Registrera poäng</CardTitle>
          <CardDescription>Ange resultat för färdiga matcher</CardDescription>
        </CardHeader>
        <CardContent>
          <MatchList user={userData} />
        </CardContent>
      </Card>
    </div>
  );
}
