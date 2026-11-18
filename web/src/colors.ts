/**
 * The Android app's res/values/colors.xml, same names (src/colors.test.ts keeps
 * them identical). Theme colours that Android takes from Material Components
 * are at the bottom.
 */
export const C = {
  purple_200: "#BB86FC",
  purple_500: "#6200EE",
  purple_700: "#3700B3",
  teal_200: "#03DAC5",
  teal_700: "#018786",
  black: "#000000",
  white: "#FFFFFF",
  primary_color: "#2196F3",
  primary_dark: "#1976D2",
  accent_color: "#FF9800",
  background_color: "#F5F5F5",
  surface_color: "#FFFFFF",
  text_primary: "#212121",
  text_secondary: "#757575",
  text_hint: "#BDBDBD",
  success_color: "#4CAF50",
  error_color: "#F44336",
  warning_color: "#FF9800",
  main_color: "#449799",
  secondary_color: "#B94B55",
  card_unified_background: "#FFF8F6",
  card_learn_asker: "#E3F2FD",
  card_learn_giver: "#E8F5E8",
  card_supervisor: "#FCE4EC",
  card_office_volunteer: "#FFF8E1",
  card_food_volunteer: "#F3E5F5",
  card_group_coordinator: "#E0F7FA",
  text_on_light_blue: "#0D47A1",
  text_on_light_green: "#1B5E20",
  text_on_light_pink: "#880E4F",
  text_on_light_amber: "#E65100",
  text_on_light_purple: "#4A148C",
  text_on_light_cyan: "#006064",
  text_secondary_blue: "#1565C0",
  text_secondary_green: "#2E7D32",
  text_secondary_pink: "#C2185B",
} as const

/** Material Components theme values used by the Android app (themes.xml). */
export const THEME = {
  /** colorPrimary: dialog buttons, default text-field accents, checkboxes */
  colorPrimary: "#6200EE",
  /** colorPrimaryVariant = status bar */
  statusBar: "#3700B3",
  /** colorSecondary: progress spinner */
  colorSecondary: "#03DAC5",
} as const
