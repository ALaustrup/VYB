import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/feed(.*)",
  "/explore(.*)",
  "/notifications(.*)",
  "/profile(.*)",
  "/settings(.*)",
  "/chat(.*)",
  "/events(.*)",
  "/onboarding(.*)",
  "/api/feed(.*)",
  "/api/posts(.*)",
  "/api/comments(.*)",
  "/api/onboarding(.*)",
  "/api/search(.*)",
  "/api/notifications(.*)",
  "/api/profile(.*)",
  "/api/connections(.*)",
  "/api/chat(.*)",
  "/api/events(.*)",
  "/api/safety(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
