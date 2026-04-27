"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { DbOrder, OrderStatus } from "@/lib/supabase";

const CHANNEL_NAME = "onix-admin-notifications";
const SOUNDED_KEY = "onix_soundedOrders";
const POLL_INTERVAL_MS = 60_000;
const DISMISS_RECHECK_MS = 30_000;

// ---------------------------------------------------------------------------
// sessionStorage helpers – persist sounded order IDs across page refreshes
// ---------------------------------------------------------------------------
function getSoundedIds(): Set<string> {
  try {
    return new Set(
      JSON.parse(sessionStorage.getItem(SOUNDED_KEY) ?? "[]") as string[]
    );
  } catch {
    return new Set();
  }
}

function addSoundedIds(ids: string[]) {
  const set = getSoundedIds();
  ids.forEach((id) => set.add(id));
  sessionStorage.setItem(SOUNDED_KEY, JSON.stringify(Array.from(set)));
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useOrderNotifications(enabled = true) {
  const [pendingOrders, setPendingOrders] = useState<DbOrder[]>([]);
  const [showPopup, setShowPopup] = useState(false);

  const bcRef = useRef<BroadcastChannel | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable ref for the broadcast handler so it can access latest setState
  const handleBroadcast = useCallback((e: MessageEvent) => {
    const msg = e.data as { type: string; [k: string]: unknown };

    switch (msg.type) {
      case "NEW_ORDERS": {
        const orders = msg.orders as DbOrder[];
        setPendingOrders(orders);
        if (orders.length > 0) setShowPopup(true);
        break;
      }
      case "SOUND_CLAIMED":
        addSoundedIds(msg.orderIds as string[]);
        break;
      case "ORDER_ACCEPTED":
        setPendingOrders((prev) =>
          prev.filter((o) => o.order_id !== msg.orderId)
        );
        break;
      case "ORDER_CANCELLED":
        setPendingOrders((prev) =>
          prev.filter((o) => o.order_id !== msg.orderId)
        );
        break;
      case "DISMISS":
        setShowPopup(false);
        break;
    }
  }, []);

  // --- BroadcastChannel setup (once) ---
  useEffect(() => {
    if (!enabled) return;
    if (typeof BroadcastChannel === "undefined") return;
    const bc = new BroadcastChannel(CHANNEL_NAME);
    bcRef.current = bc;
    bc.onmessage = handleBroadcast;
    return () => {
      bc.close();
      bcRef.current = null;
    };
  }, [enabled, handleBroadcast]);

  // --- Core polling function ---
  const checkPendingOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders?status=pending&limit=50");
      const data = (await res.json()) as { orders?: DbOrder[] };
      const pending = data.orders ?? [];

      // Detect truly new orders (not yet sounded)
      const soundedIds = getSoundedIds();
      const newIds = pending
        .filter((o) => !soundedIds.has(o.id))
        .map((o) => o.id);

      if (newIds.length > 0) {
        // Claim sound before playing – other tabs will only persist IDs
        bcRef.current?.postMessage({
          type: "SOUND_CLAIMED",
          orderIds: newIds,
        });
        addSoundedIds(newIds);
      }

      // Broadcast order list to other tabs
      bcRef.current?.postMessage({ type: "NEW_ORDERS", orders: pending });

      setPendingOrders(pending);
      if (pending.length > 0) setShowPopup(true);
    } catch {
      // silent
    }
  }, []);

  // --- Supabase Realtime – instant notification on INSERT ---
  useEffect(() => {
    if (!enabled) return;
    const ch = supabase
      .channel("admin-layout-orders")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: "status=eq.pending",
        },
        () => {
          checkPendingOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [enabled, checkPendingOrders]);

  // --- Safety-net polling (Realtime handles the real-time part) ---
  useEffect(() => {
    if (!enabled) return;
    checkPendingOrders();
    const id = setInterval(checkPendingOrders, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled, checkPendingOrders]);

  // --- Auto-hide popup when list empties ---
  useEffect(() => {
    if (pendingOrders.length === 0) setShowPopup(false);
  }, [pendingOrders]);

  // --- Actions ---
  const handleAccept = useCallback(
    async (orderId: string) => {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          status: "preparing" as OrderStatus,
        }),
      });
      setPendingOrders((prev) =>
        prev.filter((o) => o.order_id !== orderId)
      );
      bcRef.current?.postMessage({ type: "ORDER_ACCEPTED", orderId });
    },
    []
  );

  const handleCancel = useCallback(
    async (orderId: string) => {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          status: "cancelled" as OrderStatus,
        }),
      });
      setPendingOrders((prev) =>
        prev.filter((o) => o.order_id !== orderId)
      );
      bcRef.current?.postMessage({ type: "ORDER_CANCELLED", orderId });
    },
    []
  );

  const handleDismiss = useCallback(() => {
    setShowPopup(false);
    bcRef.current?.postMessage({ type: "DISMISS" });
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(checkPendingOrders, DISMISS_RECHECK_MS);
  }, [checkPendingOrders]);

  return {
    pendingOrders,
    showPopup,
    setShowPopup,
    handleAccept,
    handleCancel,
    handleDismiss,
  };
}
