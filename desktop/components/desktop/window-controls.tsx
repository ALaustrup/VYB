"use client";

import { Minus, Square, X } from "lucide-react";
import { useCallback } from "react";

function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function WindowControls() {
  const run = useCallback(async (action: "minimize" | "toggleMaximize" | "close") => {
    if (!isTauriRuntime()) return;
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const win = getCurrentWindow();
    if (action === "minimize") await win.minimize();
    else if (action === "toggleMaximize") await win.toggleMaximize();
    else await win.close();
  }, []);

  return (
    <div className="flex items-center gap-1">
      <button aria-label="Minimize" className="window-btn" type="button" onClick={() => void run("minimize")}>
        <Minus className="h-3.5 w-3.5" />
      </button>
      <button aria-label="Maximize" className="window-btn" type="button" onClick={() => void run("toggleMaximize")}>
        <Square className="h-3.5 w-3.5" />
      </button>
      <button aria-label="Close" className="window-btn window-btn-danger" type="button" onClick={() => void run("close")}>
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
