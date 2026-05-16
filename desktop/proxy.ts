import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
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
  "/api/matchmaker(.*)",
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
