import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/feed(.*)",
  "/explore(.*)",
  "/notifications(.*)",
  "/profile(.*)",
  "/onboarding(.*)",
  "/api/feed(.*)",
  "/api/posts(.*)",
  "/api/onboarding(.*)",
  "/api/search(.*)",
  "/api/notifications(.*)",
  "/api/profile(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
