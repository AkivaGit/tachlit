import { describe, expect, it } from 'vitest'
import { C, THEME } from '../colors'
import { S } from '../strings'
import { FORMS, formBySlug, requiredFields, roleDetailsFrom } from './forms'

const ids = (role: keyof typeof FORMS) => FORMS[role].sections.flatMap((s) => s.fields.map((f) => f.id))

describe('registration forms (from the Android layouts)', () => {
  it('has the fields of each Android form, in order', () => {
    const personal = ['name', 'familyName', 'email', 'password', 'phone', 'city']
    expect(ids('LEARN_ASKER')).toEqual([...personal, 'subjectsToLearn', 'learningGoals', 'preferredSchedule', 'experienceLevel', 'additionalNotes'])
    expect(ids('LEARN_GIVER')).toEqual([...personal, 'subjectsCanTeach', 'teachingExperience', 'availableSchedule', 'maxStudents', 'teachingStyle'])
    expect(ids('OFFICE_VOLUNTEER')).toEqual([...personal, 'skills', 'experience', 'availableSchedule', 'preferredTasks', 'additionalNotes'])
    expect(ids('FOOD_VOLUNTEER')).toEqual([...personal, 'physicalCapabilities', 'experience', 'availableSchedule', 'transportationMethod', 'dietaryRestrictions', 'additionalNotes'])
    expect(ids('GROUP_COORDINATOR')).toEqual(['name', 'familyName', 'email', 'phone', 'city', 'password', 'groupName', 'groupType', 'participantsCount'])
  })

  it('requires the same fields as each activity\'s validateInput()', () => {
    const req = (role: keyof typeof FORMS) => requiredFields(FORMS[role]).map((f) => f.id)
    const personal = ['name', 'familyName', 'email', 'password', 'phone', 'city']
    expect(req('LEARN_ASKER')).toEqual(personal)
    expect(req('LEARN_GIVER')).toEqual([...personal, 'subjectsCanTeach', 'availableSchedule'])
    expect(req('OFFICE_VOLUNTEER')).toEqual([...personal, 'skills', 'availableSchedule'])
    expect(req('FOOD_VOLUNTEER')).toEqual([...personal, 'physicalCapabilities', 'availableSchedule'])
    expect(req('GROUP_COORDINATOR')).toEqual(['name', 'familyName', 'email', 'password', 'phone', 'city', 'groupName', 'groupType', 'participantsCount'])
    expect(requiredFields(FORMS.LEARN_ASKER)[0]).toEqual({ id: 'name', he: 'שם פרטי', en: 'First name' })
  })

  it('uses the Android labels and field kinds', () => {
    const field = (role: keyof typeof FORMS, id: string) => FORMS[role].sections.flatMap((s) => s.fields).find((f) => f.id === id)!
    expect(field('LEARN_ASKER', 'name')).toMatchObject({ label: S.name, kind: 'text' })
    expect(field('LEARN_ASKER', 'email')).toMatchObject({ label: S.email, kind: 'email' })
    expect(field('LEARN_ASKER', 'password')).toMatchObject({ label: S.password, kind: 'password' })
    expect(field('LEARN_ASKER', 'phone')).toMatchObject({ kind: 'tel' })
    expect(field('LEARN_ASKER', 'city')).toMatchObject({ marginBottom: 24 })
    expect(field('LEARN_ASKER', 'subjectsToLearn')).toMatchObject({ kind: 'multiline', minLines: 2 })
    expect(field('LEARN_ASKER', 'additionalNotes')).toMatchObject({ kind: 'multiline', minLines: 3, marginBottom: 24 })
    expect(field('LEARN_ASKER', 'experienceLevel')).toMatchObject({
      kind: 'spinner', label: S.experience_level,
      options: [{ label: 'מתחיל', value: 'Beginner' }, { label: 'בינוני', value: 'Intermediate' }, { label: 'מתקדם', value: 'Advanced' }],
    })
    expect(field('LEARN_GIVER', 'maxStudents')).toMatchObject({ kind: 'number' })
    expect(field('OFFICE_VOLUNTEER', 'skills').label).toBe("כישורים (מחשב, שפות, וכו')")
    expect(field('FOOD_VOLUNTEER', 'transportationMethod')).toMatchObject({ kind: 'text', label: 'אמצעי תחבורה (רכב, תחבורה ציבורית, הליכה)' })
    expect(field('GROUP_COORDINATOR', 'groupType')).toMatchObject({
      kind: 'dropdown', options: [{ label: 'נוער', value: 'נוער' }, { label: 'מבוגר', value: 'מבוגר' }, { label: 'תיירים', value: 'תיירים' }],
    })
    expect(field('GROUP_COORDINATOR', 'participantsCount')).toMatchObject({ kind: 'number', strokeColor: C.main_color })
  })

  it('uses each form\'s colours and section titles', () => {
    expect(FORMS.LEARN_ASKER.header).toEqual({ background: C.card_learn_asker, titleColor: C.text_on_light_blue, subtitleColor: C.text_secondary_blue, title: S.learn_asker_title, subtitle: S.learn_asker_description })
    expect(FORMS.LEARN_GIVER.header.background).toBe(C.card_learn_giver)
    expect(FORMS.OFFICE_VOLUNTEER.header.background).toBe(C.card_learn_asker)
    expect(FORMS.FOOD_VOLUNTEER.header.background).toBe(C.card_learn_giver)
    expect(FORMS.GROUP_COORDINATOR.header.background).toBe(C.card_learn_asker)
    expect([FORMS.LEARN_ASKER.accent, FORMS.LEARN_GIVER.accent, FORMS.OFFICE_VOLUNTEER.accent, FORMS.FOOD_VOLUNTEER.accent])
      .toEqual([C.main_color, C.secondary_color, C.main_color, C.secondary_color])
    expect(FORMS.GROUP_COORDINATOR).toMatchObject({ accent: C.main_color, strokeColor: THEME.colorPrimary, buttonsInsideCard: true })
    expect(FORMS.LEARN_GIVER.sections.map((s) => s.title)).toEqual(['מידע אישי', 'מידע הוראה'])
    expect(FORMS.OFFICE_VOLUNTEER.sections.map((s) => s.title)).toEqual([S.personal_information, 'מידע התנדבות'])
    expect(FORMS.GROUP_COORDINATOR.sections[1]).toMatchObject({ title: S.group_information, marginTop: 16 })
  })

  it('shows the same success toast as Android', () => {
    expect(FORMS.LEARN_ASKER.successToast).toBe('Registration successful!')
    expect(FORMS.GROUP_COORDINATOR.successToast).toBe(S.registration_successful)
  })

  it('finds a form by its address', () => {
    expect(formBySlug('learn-asker')?.role).toBe('LEARN_ASKER')
    expect(formBySlug('group-coordinator')?.role).toBe('GROUP_COORDINATOR')
    expect(formBySlug('supervisor')).toBeUndefined()
  })

  it('keeps the role details (non-personal fields) like the Android records', () => {
    const values = { name: 'דוד', email: 'x', subjectsCanTeach: ' גמרא ', availableSchedule: 'ראשון', maxStudents: '', teachingStyle: 'שיחה', teachingExperience: '' }
    expect(roleDetailsFrom(FORMS.LEARN_GIVER, values)).toEqual({ subjectsCanTeach: 'גמרא', teachingExperience: '', availableSchedule: 'ראשון', maxStudents: 3, teachingStyle: 'שיחה' })
    expect(roleDetailsFrom(FORMS.LEARN_GIVER, { ...values, maxStudents: '5' }).maxStudents).toBe(5)
    expect(roleDetailsFrom(FORMS.LEARN_ASKER, {}).experienceLevel).toBe('Beginner')
  })
})
