import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/feed(.*)",
  "/explore(.*)",
  "/notifications(.*)",
  "/onboarding(.*)",
  "/api/feed(.*)",
  "/api/posts(.*)",
  "/api/onboarding(.*)",
  "/api/search(.*)",
  "/api/notifications(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
