/** Near-black canvas/surface background used across Play surfaces. */
export const BG_COLOR = "#0a0a0a";

/** Amber accent — dials, active pills, panel highlights. */
export const ACCENT = "#f59e0b";

/** Control panel shell background. */
export const PANEL_BG_COLOR = "#111111";

/** Subtle white border on panel chrome — 10% opacity. */
export const PANEL_BORDER_COLOR = "rgba(255, 255, 255, 0.1)";

/** Muted header/tab label opacity. */
export const PANEL_HEADER_OPACITY = 0.5;

/** Selected row tint — accent at 15% opacity. */
export const PANEL_SELECTED_TINT = "rgba(245, 158, 11, 0.15)";

/** Loading dot pulse stagger interval. */
export const DOT_STAGGER_MS = 200;

/** Screen transition via clip-path mask. */
export const SCREEN_TRANSITION_MS = 600;

/** Easing for screen clip-path transitions. */
export const SCREEN_TRANSITION_EASING = "ease-in-out";

/** Dial diameter in pixels. */
export const DIAL_SIZE_PX = 80;

/** Dial indicator rotation at minimum value (degrees). */
export const DIAL_ANGLE_MIN_DEG = -135;

/** Dial indicator rotation at maximum value (degrees). */
export const DIAL_ANGLE_MAX_DEG = 135;

/** Total sweep arc for dial indicator (degrees). */
export const DIAL_ARC_DEG = DIAL_ANGLE_MAX_DEG - DIAL_ANGLE_MIN_DEG;

/** Dial arc in radians — used for atan2 gesture mapping. */
export const DIAL_ARC_RAD = (DIAL_ARC_DEG * Math.PI) / 180;

/** Horizontal inset for XY pad (each side). */
export const XY_PAD_INSET_PX = 32;

/** XY pad cursor dot diameter. */
export const XY_PAD_DOT_PX = 12;

/** Top offset for dial row on controller surface. */
export const CONTROLLER_DIALS_TOP_PX = 48;

/** Default normalised value for speed dial. */
export const DIAL_DEFAULT_SPEED = 0.3;

/** Default normalised value for size dial. */
export const DIAL_DEFAULT_SIZE = 0.5;

/** Default normalised value for density dial. */
export const DIAL_DEFAULT_DENSITY = 0.4;

/** Default normalised XY pad position. */
export const XY_PAD_DEFAULT = 0.5;

/** Ignore stick drift below this magnitude (axes return -1..1). */
export const GAMEPAD_DEADZONE = 0.08;

/** Left stick X — maps to xy_x (camera / cursor X). */
export const GAMEPAD_AXIS_LEFT_STICK_X = 0;

/** Left stick Y — maps to xy_y (camera / cursor Y). */
export const GAMEPAD_AXIS_LEFT_STICK_Y = 1;

/** Right stick X — maps to speed (animation rate). */
export const GAMEPAD_AXIS_RIGHT_STICK_X = 2;

/** Right stick Y — maps to size (object scale). */
export const GAMEPAD_AXIS_RIGHT_STICK_Y = 3;

/** Left trigger axis — maps to density on most browsers. */
export const GAMEPAD_AXIS_LEFT_TRIGGER = 4;

/** Right trigger axis — maps to hue on most browsers. */
export const GAMEPAD_AXIS_RIGHT_TRIGGER = 5;

/** A / Cross — switches to GEO mode. */
export const GAMEPAD_BUTTON_A = 0;

/** B / Circle — switches to AUDIO mode. */
export const GAMEPAD_BUTTON_B = 1;

/** X / Square — switches to COLOUR mode. */
export const GAMEPAD_BUTTON_X = 2;

/** Left bumper — maps to trail opacity. */
export const GAMEPAD_BUTTON_LEFT_BUMPER = 4;

/** Left trigger as button on some browsers (Firefox / older drivers). */
export const GAMEPAD_BUTTON_LEFT_TRIGGER = 6;

/** Right trigger as button on some browsers. */
export const GAMEPAD_BUTTON_RIGHT_TRIGGER = 7;

/** Start / Options — toggles the control panel (Phase 6). */
export const GAMEPAD_BUTTON_START = 9;

/** Number of standard axes polled each frame (sticks + triggers). */
export const GAMEPAD_AXIS_COUNT = 6;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Zero small stick values so centred sticks do not drift. */
export function applyGamepadDeadzone(
  value: number,
  deadzone = GAMEPAD_DEADZONE,
): number {
  return Math.abs(value) < deadzone ? 0 : value;
}

/** Map a stick axis from [-1, 1] to normalised [0, 1]. */
export function normalizeGamepadAxis(value: number): number {
  const deadzoned = applyGamepadDeadzone(value);
  return clamp01((deadzoned + 1) / 2);
}

/** Triggers and analog buttons already report 0..1 on most browsers. */
export function normalizeGamepadTrigger(value: number): number {
  return clamp01(value);
}
