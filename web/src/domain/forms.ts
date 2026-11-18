import { C, THEME } from '../colors'
import { S } from '../strings'
import type { RegistrableRole } from './userTypes'
import type { RequiredField } from './validation'

/**
 * The five registration forms, described as data, copied from the Android
 * layouts (activity_learn_asker.xml, …) and each activity's validateInput().
 * RegistrationScreen renders any of them.
 */

export type FieldKind = 'text' | 'email' | 'password' | 'tel' | 'number' | 'multiline' | 'spinner' | 'dropdown'

export interface Option {
  label: string
  value: string
}

export interface FieldDef {
  id: string
  /** The Android hint, shown as the floating label. */
  label: string
  kind: FieldKind
  minLines?: number
  options?: Option[]
  /** dp below the field (TextInputLayout layout_marginBottom). */
  marginBottom: number
  /** Underline colour when focused, when it differs from the form's. */
  strokeColor?: string
  /** Name in Hebrew and English for the missing-fields popup. */
  required?: { he: string; en: string }
  autoComplete?: string
}

export interface SectionDef {
  title: string
  /** dp above the section title (group coordinator only). */
  marginTop?: number
  fields: FieldDef[]
}

export interface FormDef {
  role: RegistrableRole
  /** Web address: /register/<slug> */
  slug: string
  header: { background: string; titleColor: string; subtitleColor: string; title: string; subtitle: string }
  /** Section titles, focused labels (hintTextColor) and the register button. */
  accent: string
  /** Focused underline (boxStrokeColor); the Material default purple when unset in Android. */
  strokeColor: string
  /** Group coordinator has its buttons inside the form card. */
  buttonsInsideCard: boolean
  successToast: string
  sections: SectionDef[]
}

const req = (he: string, en: string) => ({ he, en })

const name = (): FieldDef => ({ id: 'name', label: S.name, kind: 'text', marginBottom: 16, required: req(S.field_name_he, S.field_name_en), autoComplete: 'given-name' })
const familyName = (): FieldDef => ({ id: 'familyName', label: S.family_name, kind: 'text', marginBottom: 16, required: req(S.field_family_name_he, S.field_family_name_en), autoComplete: 'family-name' })
const email = (): FieldDef => ({ id: 'email', label: S.email, kind: 'email', marginBottom: 16, required: req(S.field_email_he, S.field_email_en), autoComplete: 'email' })
const password = (): FieldDef => ({ id: 'password', label: S.password, kind: 'password', marginBottom: 16, required: req(S.field_password_he, S.field_password_en), autoComplete: 'new-password' })
const phone = (): FieldDef => ({ id: 'phone', label: S.phone, kind: 'tel', marginBottom: 16, required: req(S.field_phone_he, S.field_phone_en), autoComplete: 'tel' })
const city = (marginBottom: number): FieldDef => ({ id: 'city', label: S.city, kind: 'text', marginBottom, required: req(S.field_city_he, S.field_city_en), autoComplete: 'address-level2' })

const multiline = (id: string, label: string, minLines: number, marginBottom = 16, required?: { he: string; en: string }): FieldDef =>
  ({ id, label, kind: 'multiline', minLines, marginBottom, required })

/** The six personal fields in the order of the four main forms. */
const personalFields = (): FieldDef[] => [name(), familyName(), email(), password(), phone(), city(24)]

const availableSchedule = (label: string) =>
  multiline('availableSchedule', label, 2, 16, req(S.field_available_schedule_he, S.field_available_schedule_en))

export const FORMS: Record<RegistrableRole, FormDef> = {
  LEARN_ASKER: {
    role: 'LEARN_ASKER',
    slug: 'learn-asker',
    header: { background: C.card_learn_asker, titleColor: C.text_on_light_blue, subtitleColor: C.text_secondary_blue, title: S.learn_asker_title, subtitle: S.learn_asker_description },
    accent: C.main_color,
    strokeColor: C.main_color,
    buttonsInsideCard: false,
    successToast: 'Registration successful!',
    sections: [
      { title: S.personal_information, fields: personalFields() },
      {
        title: S.learning_information,
        fields: [
          multiline('subjectsToLearn', S.subjects_to_learn, 2),
          multiline('learningGoals', S.learning_goals, 2),
          multiline('preferredSchedule', S.preferred_schedule, 2),
          {
            id: 'experienceLevel', label: S.experience_level, kind: 'spinner', marginBottom: 16,
            options: [
              { label: S.experience_beginner, value: 'Beginner' },
              { label: S.experience_intermediate, value: 'Intermediate' },
              { label: S.experience_advanced, value: 'Advanced' },
            ],
          },
          multiline('additionalNotes', S.additional_notes, 3, 24),
        ],
      },
    ],
  },

  LEARN_GIVER: {
    role: 'LEARN_GIVER',
    slug: 'learn-giver',
    header: { background: C.card_learn_giver, titleColor: C.text_on_light_green, subtitleColor: C.text_secondary_green, title: S.learn_giver_title, subtitle: S.learn_giver_description },
    accent: C.secondary_color,
    strokeColor: C.secondary_color,
    buttonsInsideCard: false,
    successToast: 'Registration successful!',
    sections: [
      { title: 'מידע אישי', fields: personalFields() },
      {
        title: 'מידע הוראה',
        fields: [
          multiline('subjectsCanTeach', S.subjects_can_teach, 2, 16, req(S.field_subjects_can_teach_he, S.field_subjects_can_teach_en)),
          multiline('teachingExperience', S.teaching_experience, 2),
          availableSchedule(S.available_schedule),
          { id: 'maxStudents', label: S.max_students, kind: 'number', marginBottom: 16 },
          multiline('teachingStyle', S.teaching_style, 3),
        ],
      },
    ],
  },

  OFFICE_VOLUNTEER: {
    role: 'OFFICE_VOLUNTEER',
    slug: 'office-volunteer',
    header: { background: C.card_learn_asker, titleColor: C.text_on_light_blue, subtitleColor: C.text_secondary_blue, title: S.office_volunteer_title, subtitle: S.office_volunteer_description },
    accent: C.main_color,
    strokeColor: C.main_color,
    buttonsInsideCard: false,
    successToast: 'Registration successful!',
    sections: [
      { title: S.personal_information, fields: personalFields() },
      {
        title: 'מידע התנדבות',
        fields: [
          multiline('skills', "כישורים (מחשב, שפות, וכו')", 2, 16, req(S.field_skills_he, S.field_skills_en)),
          multiline('experience', 'ניסיון קודם בעבודה משרדית', 2),
          availableSchedule('זמנים פנויים'),
          multiline('preferredTasks', "משימות מועדפות (הקלדה, טלפונים, ארכוב וכו')", 2),
          multiline('additionalNotes', S.additional_notes, 3, 24),
        ],
      },
    ],
  },

  FOOD_VOLUNTEER: {
    role: 'FOOD_VOLUNTEER',
    slug: 'food-volunteer',
    header: { background: C.card_learn_giver, titleColor: C.text_on_light_green, subtitleColor: C.text_secondary_green, title: S.food_volunteer_title, subtitle: S.food_volunteer_description },
    accent: C.secondary_color,
    strokeColor: C.secondary_color,
    buttonsInsideCard: false,
    successToast: 'Registration successful!',
    sections: [
      { title: S.personal_information, fields: personalFields() },
      {
        title: 'מידע התנדבות',
        fields: [
          multiline('physicalCapabilities', "יכולות פיזיות (הרמת משקלים, עמידה ממושכת וכו')", 2, 16, req(S.field_physical_capabilities_he, S.field_physical_capabilities_en)),
          multiline('experience', 'ניסיון קודם באריזה/מחסן', 2),
          availableSchedule('זמנים פנויים'),
          { id: 'transportationMethod', label: 'אמצעי תחבורה (רכב, תחבורה ציבורית, הליכה)', kind: 'text', marginBottom: 16 },
          multiline('dietaryRestrictions', 'הגבלות תזונתיות לטיפול במזון', 2),
          multiline('additionalNotes', S.additional_notes, 3, 24),
        ],
      },
    ],
  },

  GROUP_COORDINATOR: {
    role: 'GROUP_COORDINATOR',
    slug: 'group-coordinator',
    header: { background: C.card_learn_asker, titleColor: C.text_on_light_blue, subtitleColor: C.text_secondary_blue, title: S.group_coordinator_title, subtitle: S.group_coordinator_description },
    accent: C.main_color,
    strokeColor: THEME.colorPrimary,
    buttonsInsideCard: true,
    successToast: S.registration_successful,
    sections: [
      { title: S.personal_information, fields: [name(), familyName(), email(), phone(), city(16), password()] },
      {
        title: S.group_information,
        marginTop: 16,
        fields: [
          { id: 'groupName', label: S.group_name, kind: 'text', marginBottom: 16, required: req(S.field_group_name_he, S.field_group_name_en) },
          {
            id: 'groupType', label: S.group_type, kind: 'dropdown', marginBottom: 16, required: req(S.field_group_type_he, S.field_group_type_en),
            options: [S.youth, S.adult, S.tourist].map((t) => ({ label: t, value: t })),
          },
          {
            id: 'participantsCount', label: S.number_of_participants, kind: 'number', marginBottom: 16, strokeColor: C.main_color,
            required: req(S.field_participants_count_he, S.field_participants_count_en),
          },
        ],
      },
    ],
  },
}

/** The fields validateInput() checks, in the order the popup lists them. */
export function requiredFields(form: FormDef): RequiredField[] {
  const fields = form.sections.flatMap((s) => s.fields).filter((f) => f.required)
  // The group coordinator activity checks password before phone and city,
  // although the form shows it last.
  const order = form.role === 'GROUP_COORDINATOR'
    ? ['name', 'familyName', 'email', 'password', 'phone', 'city', 'groupName', 'groupType', 'participantsCount']
    : fields.map((f) => f.id)
  return order
    .map((id) => fields.find((f) => f.id === id)!)
    .map((f) => ({ id: f.id, he: f.required!.he, en: f.required!.en }))
}

export function formBySlug(slug: string | undefined): FormDef | undefined {
  return Object.values(FORMS).find((f) => f.slug === slug)
}

const PERSONAL = new Set(['name', 'familyName', 'email', 'password', 'phone', 'city'])

/**
 * The role-specific details (LearnAsker / LearnGiver / … records of the
 * Android app). Values are trimmed; max students defaults to 3 and the
 * experience level to Beginner, as in the activities.
 */
export function roleDetailsFrom(form: FormDef, values: Record<string, string | undefined>): Record<string, string | number> {
  const details: Record<string, string | number> = {}
  for (const field of form.sections.flatMap((s) => s.fields)) {
    if (PERSONAL.has(field.id)) continue
    const value = (values[field.id] ?? '').trim()
    if (field.id === 'maxStudents') details[field.id] = Number.parseInt(value, 10) || 3
    else if (field.kind === 'spinner') details[field.id] = value || field.options![0].value
    else details[field.id] = value
  }
  return details
}
