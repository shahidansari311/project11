/**
 * SilverReal Estate — Global Color System
 * ────────────────────────────────────────
 * All colours are defined here as named variables
 * following the Material 3 token naming convention.
 *
 * To re-theme the entire app, simply update the hex
 * values below — every screen references these tokens.
 */

export const Colors = {
  // ─── Primary ──────────────────────────────────────
  primary: "#003946",
  primaryContainer: "#005163",
  onPrimary: "#ffffff",
  onPrimaryContainer: "#86c2d7",

  // ─── Secondary ────────────────────────────────────
  secondary: "#526164",
  secondaryContainer: "#d5e5e9",
  onSecondary: "#ffffff",
  onSecondaryContainer: "#58676a",

  // ─── Tertiary ─────────────────────────────────────
  tertiary: "#4e2a00",
  tertiaryContainer: "#6a4011",
  onTertiary: "#ffffff",
  onTertiaryContainer: "#e9ad75",

  // ─── Surface ──────────────────────────────────────
  surface: "#f8f9fb",
  surfaceBright: "#f8f9fb",
  surfaceDim: "#d8dadc",
  surfaceContainer: "#eceeef",
  surfaceContainerHigh: "#e7e8ea",
  surfaceContainerLow: "#f2f4f5",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerHighest: "#e1e3e4",
  surfaceVariant: "#e1e3e4",
  surfaceTint: "#256679",

  // ─── On Surface ───────────────────────────────────
  onSurface: "#191c1d",
  onSurfaceVariant: "#40484b",
  onBackground: "#191c1d",

  // ─── Background ───────────────────────────────────
  background: "#f8f9fb",

  // ─── Outline ──────────────────────────────────────
  outline: "#70787c",
  outlineVariant: "#bfc8cc",

  // ─── Error ────────────────────────────────────────
  error: "#ba1a1a",
  errorContainer: "#ffdad6",
  onError: "#ffffff",
  onErrorContainer: "#93000a",

  // ─── Inverse ──────────────────────────────────────
  inverseSurface: "#2e3132",
  inverseOnSurface: "#eff1f2",
  inversePrimary: "#93cfe5",

  // ─── Fixed ────────────────────────────────────────
  primaryFixed: "#b4ebff",
  primaryFixedDim: "#93cfe5",
  onPrimaryFixed: "#001f27",
  onPrimaryFixedVariant: "#004e5f",
  secondaryFixed: "#d5e5e9",
  secondaryFixedDim: "#bac9cd",
  onSecondaryFixed: "#0f1e20",
  onSecondaryFixedVariant: "#3b494c",
  tertiaryFixed: "#ffdcbf",
  tertiaryFixedDim: "#f7ba81",
  onTertiaryFixed: "#2d1600",
  onTertiaryFixedVariant: "#673d0e",

  // ─── Misc / Borders ──────────────────────────────
  border: "#DCE2E3",
  divider: "rgba(191, 200, 204, 0.3)", // outlineVariant at 30%
} as const;

export type ColorKey = keyof typeof Colors;
