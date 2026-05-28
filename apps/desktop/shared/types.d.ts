import type { Handlers } from "../preload/preload.cjs";

declare global {
  interface Window {
    omnia: Handlers;
  }
}
