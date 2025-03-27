import Link from "next/link";
import { HydrateClient } from "@/trpc/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Grid3X3,
  Calendar,
  Medal,
  Trophy,
  TableIcon as TableTennis,
} from "lucide-react";

export default async function Home() {
  return (
    <HydrateClient>
      <div className="container mx-auto py-10">
        <div className="mb-10 flex flex-col items-center text-center">
          <TableTennis className="text-primary mb-4 h-16 w-16" />
          <h1 className="text-4xl font-bold tracking-tight dark:text-white">
            Sogeti Pingis
          </h1>
          <p className="text-muted-foreground mt-2 text-xl">
            Hantera din pingis turnering med lätthet
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/players">
            <Card className="h-full transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium">Spelare</CardTitle>
                <Users className="text-muted-foreground h-5 w-5" />
              </CardHeader>
              <CardContent>
                <CardDescription>Hantera turneringsspelare</CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/groups">
            <Card className="h-full transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium">Grupper</CardTitle>
                <Grid3X3 className="text-muted-foreground h-5 w-5" />
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Skapa och hantera spelare i grupper
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/schedule">
            <Card className="h-full transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium">Schema</CardTitle>
                <Calendar className="text-muted-foreground h-5 w-5" />
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Se och hantera matchernas schema
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/matches">
            <Card className="h-full transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium">Matcher</CardTitle>
                <TableTennis className="text-muted-foreground h-5 w-5" />
              </CardHeader>
              <CardContent>
                <CardDescription>Spara matchernas resultat</CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/standings">
            <Card className="h-full transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium">Resultat</CardTitle>
                <Medal className="text-muted-foreground h-5 w-5" />
              </CardHeader>
              <CardContent>
                <CardDescription>Se gruppresultat</CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/playoffs">
            <Card className="h-full transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium">Slutspel</CardTitle>
                <Trophy className="text-muted-foreground h-5 w-5" />
              </CardHeader>
              <CardContent>
                <CardDescription>Hantera slutspel</CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </HydrateClient>
  );
}
