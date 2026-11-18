import { S } from '../strings'

/** A form field the user must fill in, with its name in Hebrew and in English. */
export interface RequiredField {
  id: string
  he: string
  en: string
}

/** The required fields that are empty or blank, in form order. */
export function findMissingFields(fields: RequiredField[], values: Record<string, string | undefined>): RequiredField[] {
  return fields.filter((f) => (values[f.id] ?? '').trim() === '')
}

/**
 * The popup text listing the missing fields in Hebrew and in English,
 * exactly as BaseActivity.checkRequiredFields builds it.
 */
export function missingFieldsMessage(missing: RequiredField[]): string {
  return [
    S.missing_fields_intro_he,
    ...missing.map((f) => `• ${f.he}`),
    '',
    S.missing_fields_intro_en,
    ...missing.map((f) => `• ${f.en}`),
  ].join('\n')
}
