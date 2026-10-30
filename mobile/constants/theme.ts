// BTP palette and type, matching the approved website (behindtheprotocol.ai).
export const colors = {
  background: "#070405",
  surface: "#120B09",
  surfaceRaised: "#1A110D",
  ink: "#F2EADF",
  inkStrong: "#FFF6EA",
  muted: "#BFAE9C",
  faint: "#8E7F70",
  accent: "#C9A66B",
  accentBright: "#E8CC94",
  accentSoft: "rgba(201,166,107,0.13)",
  border: "rgba(232,204,148,0.16)",
  borderStrong: "rgba(232,204,148,0.42)",
  danger: "#E29A8F",
  dangerSoft: "rgba(226,154,143,0.13)",
  // Text and icons placed on the gold buttons.
  onAccent: "#1C0E0B",
};

export const gradients = {
  button: ["#EFD9A7", "#B49456"] as const,
};

export const spacing = { xs: 6, sm: 10, md: 16, lg: 22, xl: 32 };
export const radius = { sm: 10, md: 14, lg: 18, pill: 999 };

// Each weight is its own family so iOS never substitutes the system font.
export const fonts = {
  serif: "Newsreader-Regular",
  serifMedium: "Newsreader-Medium",
  serifItalic: "Newsreader-Italic",
  sans: "Inter-Regular",
  sansMedium: "Inter-Medium",
  sansSemiBold: "Inter-SemiBold",
  sansBold: "Inter-Bold",
  mark: "CormorantGaramond-Italic",
} as const;

export const type = {
  display: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 36, color: colors.inkStrong },
  title: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 30, color: colors.inkStrong },
  section: { fontFamily: fonts.serif, fontSize: 19, lineHeight: 25, color: colors.inkStrong },
  body: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24, color: colors.ink },
  bodyStrong: { fontFamily: fonts.sansSemiBold, fontSize: 16, lineHeight: 23, color: colors.inkStrong },
  small: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 21, color: colors.muted },
  meta: { fontFamily: fonts.sansMedium, fontSize: 12.5, lineHeight: 17, color: colors.muted },
  eyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 1.6, color: colors.accent, textTransform: "uppercase" as const },
};
