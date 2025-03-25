import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { playerRouter } from "./routers/player";
import { groupRouter } from "./routers/group";
import { playerGroupRouter } from "./routers/playerGroup";
import { matchRouter } from "./routers/match";
import { scoreRouter } from "./routers/score";
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  player: playerRouter,
  group: groupRouter,
  playerGroup: playerGroupRouter,
  match: matchRouter,
  score: scoreRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
