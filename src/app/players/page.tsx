import { PlayerList } from "@/components/player-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PlayersPage() {
  return (
    <div className="mx-auto p-2 md:container md:py-10">
      <h1 className="mb-6 text-3xl font-bold">Spelare</h1>

      <div className="grid">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Spelarlista</CardTitle>
            <CardDescription>Hantera medverkande i turneringen</CardDescription>
          </CardHeader>
          <CardContent>
            <PlayerList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
