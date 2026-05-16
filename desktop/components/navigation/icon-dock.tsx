"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Compass,
  Home,
  LayoutDashboard,
  MessageCircle,
  Radio,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const items = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/chat", label: "Connect", icon: MessageCircle },
  { href: "/chat/matchmaker", label: "Match", icon: Sparkles },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/dashboard", label: "You", icon: LayoutDashboard },
  { href: "/explore", label: "Explore", icon: Compass },
] as const;

export function IconDock() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <motion.nav
        layout
        className="glass-panel flex items-end gap-1 border border-white/25 px-2 py-2 shadow-2xl"
        style={{ borderRadius: expanded ? "1.25rem" : "9999px" }}
      >
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex flex-col items-center rounded-2xl px-3 py-2 transition ${
                active ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden />
              <AnimatePresence>
                {expanded ? (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="mt-1 text-[10px] font-medium"
                  >
                    {item.label}
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </Link>
          );
        })}
        <Link
          href="/chat/create"
          className="ml-1 flex items-center gap-1 rounded-full bg-[var(--vyb-sunset)] px-3 py-2 text-xs font-semibold text-white"
        >
          <Users className="h-4 w-4" />
          {expanded ? "Room" : null}
        </Link>
        <Link
          href="/chat?mode=world"
          className="flex items-center rounded-full border border-white/20 px-2 py-2 text-white/80"
          title="World chat"
        >
          <Radio className="h-4 w-4" />
        </Link>
      </motion.nav>
    </div>
  );
}
