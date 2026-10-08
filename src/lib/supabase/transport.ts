import "server-only";

import type { WebSocketLikeConstructor } from "@supabase/supabase-js";
import WebSocket from "ws";

// Supabase recommends ws on Node 20. Its DOM-style transport event types differ
// from @types/ws, although ws implements the browser-compatible event API.
export const serverWebSocketTransport = WebSocket as unknown as WebSocketLikeConstructor;
