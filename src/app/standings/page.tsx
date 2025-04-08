import { StandingsList } from "@/components/standings-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function StandingsPage() {
  return (
    <div className="mx-auto p-2 md:container md:py-10">
      <Card>
        <CardHeader>
          <CardTitle>Turnerings tabell</CardTitle>
          <CardDescription>
            Nuvarande poängställning för varje grupp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StandingsList />
        </CardContent>
      </Card>
    </div>
  );
}
