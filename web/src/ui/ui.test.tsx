import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'
import { Card } from './Card'
import { Checkbox } from './Checkbox'
import { Dialog } from './Dialog'
import { DropdownField, SpinnerField } from './SelectField'
import { TextField } from './TextField'
import { UiProvider, useUi } from './UiProvider'

function ControlledField(props: Partial<React.ComponentProps<typeof TextField>>) {
  const [value, setValue] = useState('')
  return <TextField id="f" label="שם" value={value} onChange={setValue} {...props} />
}

describe('Card', () => {
  it('is a clickable button when it has onClick (keyboard too)', async () => {
    const onClick = vi.fn()
    render(<Card onClick={onClick}>אני רוצה ללמוד</Card>)
    const card = screen.getByRole('button', { name: 'אני רוצה ללמוד' })
    await userEvent.click(card)
    card.focus()
    await userEvent.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('is a plain block without onClick', () => {
    render(<Card>תוכן</Card>)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('תוכן')).toBeInTheDocument()
  })
})

describe('Button', () => {
  it('renders a button with its colours and calls onClick', async () => {
    const onClick = vi.fn()
    render(<Button color="#449799" onClick={onClick}>הירשם</Button>)
    const button = screen.getByRole('button', { name: 'הירשם' })
    expect(button).toHaveStyle({ backgroundColor: '#449799' })
    await userEvent.click(button)
    expect(onClick).toHaveBeenCalled()
  })

  it('does nothing when disabled', async () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>שלח</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'שלח' }))
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('TextField (filled Material text field)', () => {
  it('has an accessible label that floats when focused or filled', async () => {
    render(<ControlledField />)
    const input = screen.getByLabelText('שם')
    const box = input.closest('.tf')!
    expect(box).not.toHaveClass('tf--floating')
    await userEvent.click(input)
    expect(box).toHaveClass('tf--focused', 'tf--floating')
    await userEvent.type(input, 'דוד')
    await userEvent.tab()
    expect(box).not.toHaveClass('tf--focused')
    expect(box).toHaveClass('tf--floating')
    expect(input).toHaveValue('דוד')
  })

  it('uses a textarea for multi-line fields', () => {
    render(<ControlledField kind="multiline" minLines={3} />)
    expect(screen.getByLabelText('שם').tagName).toBe('TEXTAREA')
    expect(screen.getByLabelText('שם')).toHaveAttribute('rows', '3')
  })

  it('maps field kinds to input types', () => {
    const { rerender } = render(<ControlledField kind="email" />)
    expect(screen.getByLabelText('שם')).toHaveAttribute('type', 'email')
    rerender(<ControlledField kind="tel" />)
    expect(screen.getByLabelText('שם')).toHaveAttribute('type', 'tel')
    rerender(<ControlledField kind="number" />)
    expect(screen.getByLabelText('שם')).toHaveAttribute('inputmode', 'numeric')
  })

  it('shows the red error icon, and the error bubble only while focused', async () => {
    render(<ControlledField error="אנא מלא את כל השדות הנדרשים" />)
    expect(screen.getByTestId('tf-error-icon')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
    await userEvent.click(screen.getByLabelText('שם'))
    expect(screen.getByRole('alert')).toHaveTextContent('אנא מלא את כל השדות הנדרשים')
  })

  it('password toggle shows and hides the password', async () => {
    render(<ControlledField kind="password" passwordToggle />)
    const input = screen.getByLabelText('שם')
    expect(input).toHaveAttribute('type', 'password')
    await userEvent.click(screen.getByRole('button', { name: 'הצג סיסמה' }))
    expect(input).toHaveAttribute('type', 'text')
  })
})

describe('select fields', () => {
  const options = [{ label: 'מתחיל', value: 'Beginner' }, { label: 'בינוני', value: 'Intermediate' }]

  it('SpinnerField shows the first option by default and reports changes', async () => {
    const onChange = vi.fn()
    render(<SpinnerField id="lvl" label="רמת ניסיון" options={options} value="" onChange={onChange} />)
    const select = screen.getByLabelText('רמת ניסיון')
    expect(select).toHaveValue('Beginner')
    await userEvent.selectOptions(select, 'Intermediate')
    expect(onChange).toHaveBeenCalledWith('Intermediate')
  })

  it('DropdownField starts empty with a floating label', async () => {
    function Wrapper() {
      const [v, setV] = useState('')
      return <DropdownField id="gt" label="סוג הקבוצה" options={options} value={v} onChange={setV} />
    }
    render(<Wrapper />)
    const select = screen.getByLabelText('סוג הקבוצה')
    expect(select).toHaveValue('')
    expect(select.closest('.tf')).not.toHaveClass('tf--floating')
    await userEvent.selectOptions(select, 'Beginner')
    expect(select.closest('.tf')).toHaveClass('tf--floating')
  })
})

describe('Checkbox', () => {
  it('toggles', async () => {
    const onChange = vi.fn()
    render(<Checkbox label="Supervisors" checked={false} onChange={onChange} />)
    await userEvent.click(screen.getByLabelText('Supervisors'))
    expect(onChange).toHaveBeenCalledWith(true)
  })
})

describe('Dialog (Android AlertDialog)', () => {
  it('shows title, message and buttons with the positive button last (far left in RTL)', async () => {
    const yes = vi.fn()
    const no = vi.fn()
    render(<Dialog title="התנתקות" message="להמשיך?" positive={{ label: 'כן', onClick: yes }} negative={{ label: 'לא', onClick: no }} onDismiss={() => {}} />)
    const dialog = screen.getByRole('dialog', { name: 'התנתקות' })
    expect(dialog).toHaveTextContent('להמשיך?')
    const buttons = screen.getAllByRole('button').map((b) => b.textContent)
    expect(buttons).toEqual(['לא', 'כן'])
    await userEvent.click(screen.getByRole('button', { name: 'כן' }))
    expect(yes).toHaveBeenCalled()
  })

  it('splits the message into paragraphs so Hebrew and English each get their own direction', () => {
    render(<Dialog title="t" message={'שלום\n\nHello'} onDismiss={() => {}} />)
    const paragraphs = screen.getByRole('dialog').querySelectorAll('.dialog__line')
    expect([...paragraphs].map((p) => p.getAttribute('dir'))).toEqual(['auto', 'auto', 'auto'])
  })

  it('lists items and reports the chosen one', async () => {
    const onItem = vi.fn()
    render(<Dialog title="סינון לפי עיר" items={['ירושלים', 'חיפה']} onItem={onItem} onDismiss={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'חיפה' }))
    expect(onItem).toHaveBeenCalledWith(1)
  })

  it('closes when tapping outside or pressing Escape', async () => {
    const onDismiss = vi.fn()
    render(<Dialog title="t" message="m" onDismiss={onDismiss} />)
    await userEvent.click(screen.getByTestId('dialog-scrim'))
    await userEvent.keyboard('{Escape}')
    expect(onDismiss).toHaveBeenCalledTimes(2)
  })
})

describe('UiProvider: dialogs, toasts, loading', () => {
  function Demo() {
    const ui = useUi()
    return (
      <>
        <button onClick={() => ui.showDialog({ title: 'שגיאה', message: 'משהו', positive: { label: 'אישור' } })}>dialog</button>
        <button onClick={() => ui.showToast('Login successful')}>toast</button>
        <button onClick={() => ui.showLoading()}>load</button>
        <button onClick={() => ui.hideLoading()}>unload</button>
      </>
    )
  }

  it('shows a dialog that closes after a button is pressed', async () => {
    render(<UiProvider><Demo /></UiProvider>)
    await userEvent.click(screen.getByText('dialog'))
    expect(screen.getByRole('dialog', { name: 'שגיאה' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'אישור' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows a toast for about 2 seconds (Toast.LENGTH_SHORT)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    render(<UiProvider><Demo /></UiProvider>)
    await userEvent.click(screen.getByText('toast'))
    expect(screen.getByRole('status')).toHaveTextContent('Login successful')
    act(() => { vi.advanceTimersByTime(2600) })
    expect(screen.queryByRole('status')).toBeNull()
    vi.useRealTimers()
  })

  it('shows and hides the loading overlay', async () => {
    render(<UiProvider><Demo /></UiProvider>)
    await userEvent.click(screen.getByText('load'))
    expect(screen.getByText('בטעינה')).toBeInTheDocument()
    await userEvent.click(screen.getByText('unload'))
    expect(screen.queryByText('בטעינה')).toBeNull()
  })
})
