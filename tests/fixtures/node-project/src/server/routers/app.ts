import { createTRPCRouter } from '~/server/api/trpc';
import { postRouter } from '~/server/api/routers/post';
import { userRouter } from '~/server/api/routers/user';
import { authRouter } from '~/server/api/routers/auth';

/**
 * This is the primary router for the server.
 * All routers added here are available as API procedures.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  user: userRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
