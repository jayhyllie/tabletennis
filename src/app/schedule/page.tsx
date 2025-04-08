import { ScheduleList } from "@/components/schedule-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SchedulePage() {
  return (
    <div className="mx-auto p-2 md:container md:py-10">
      <h1 className="mb-6 text-3xl font-bold">Matchschema</h1>

      <Card>
        <CardHeader>
          <CardTitle>Turneringsschema</CardTitle>
          <CardDescription>Se alla schemalagda matcher</CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduleList />
        </CardContent>
      </Card>
    </div>
  );
}
