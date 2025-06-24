import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import analyzePoopRoute from "./routes/poop/analyze/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  poop: createTRPCRouter({
    analyze: analyzePoopRoute,
  }),
});

export type AppRouter = typeof appRouter;