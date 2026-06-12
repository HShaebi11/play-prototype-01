export type PlayMessage =
  | { type: "dial"; id: string; value: number }
  | { type: "slider"; id: string; value: number }
  | { type: "xy"; x: number; y: number }
  | { type: "mode"; value: "geo" | "audio" | "colour" };
