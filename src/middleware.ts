import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/playoff-embed(.*)",
  "/api/trpc/match(.*)", // Allow all match-related routes
  "/api/trpc/player(.*)", // Allow all player-related routes
  "/api/trpc/score(.*)", // Allow all score-related routes
  "/api/trpc/group(.*)", // Allow all group-related routes
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Only run on tRPC routes
    "/api/trpc/:path*",
  ],
};
