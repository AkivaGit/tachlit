/** True when the text has no Hebrew letters (Android lays such lines out with Roboto's shorter line height). */
export function isLatinOnly(text: string): boolean {
  return !/[֐-׿]/.test(text)
}
