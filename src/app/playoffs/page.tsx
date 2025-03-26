import { PlayoffBracket } from "@/components/playoff-bracket";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PlayoffsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-6 text-3xl font-bold">Slutspel</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Slutspelsträd</CardTitle>
            <CardDescription>Direkt utslagsspel</CardDescription>
          </CardHeader>
          <CardContent>
            <PlayoffBracket />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
