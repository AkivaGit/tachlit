import { describe, expect, it } from 'vitest'
import { findMissingFields, missingFieldsMessage, type RequiredField } from './validation'

const NAME: RequiredField = { id: 'name', he: 'שם פרטי', en: 'First name' }
const CITY: RequiredField = { id: 'city', he: 'עיר', en: 'City' }

describe('required fields (port of BaseActivity.checkRequiredFields)', () => {
  it('finds empty and blank fields, in form order', () => {
    expect(findMissingFields([NAME, CITY], { name: '  ', city: '' })).toEqual([NAME, CITY])
    expect(findMissingFields([NAME, CITY], { name: 'דוד', city: '' })).toEqual([CITY])
    expect(findMissingFields([NAME, CITY], { name: 'דוד', city: 'ירושלים' })).toEqual([])
    expect(findMissingFields([NAME], {})).toEqual([NAME])
  })

  it('builds the Hebrew + English popup text exactly like the app', () => {
    expect(missingFieldsMessage([NAME, CITY])).toBe(
      'יש למלא את השדות הבאים:\n• שם פרטי\n• עיר\n\nPlease fill in the following fields:\n• First name\n• City',
    )
  })
})
