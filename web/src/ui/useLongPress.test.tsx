import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLongPress } from './useLongPress'

function Item({ onClick, onLongPress }: { onClick: () => void; onLongPress: () => void }) {
  const press = useLongPress(onLongPress)
  return <div role="button" onClick={press.wrapClick(onClick)} {...press.handlers}>item</div>
}

describe('useLongPress (Android long click, 500 ms)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('fires after holding 500 ms and then swallows the click', () => {
    const onClick = vi.fn(); const onLongPress = vi.fn()
    render(<Item onClick={onClick} onLongPress={onLongPress} />)
    const el = screen.getByRole('button')
    fireEvent.pointerDown(el)
    act(() => { vi.advanceTimersByTime(500) })
    fireEvent.pointerUp(el)
    fireEvent.click(el)
    expect(onLongPress).toHaveBeenCalledTimes(1)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('a short tap is a normal click', () => {
    const onClick = vi.fn(); const onLongPress = vi.fn()
    render(<Item onClick={onClick} onLongPress={onLongPress} />)
    const el = screen.getByRole('button')
    fireEvent.pointerDown(el)
    act(() => { vi.advanceTimersByTime(200) })
    fireEvent.pointerUp(el)
    fireEvent.click(el)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onLongPress).not.toHaveBeenCalled()
  })

  it('moving away cancels; right-click (context menu) also long-presses', () => {
    const onClick = vi.fn(); const onLongPress = vi.fn()
    render(<Item onClick={onClick} onLongPress={onLongPress} />)
    const el = screen.getByRole('button')
    fireEvent.pointerDown(el)
    fireEvent.pointerLeave(el)
    act(() => { vi.advanceTimersByTime(600) })
    expect(onLongPress).not.toHaveBeenCalled()
    fireEvent.contextMenu(el)
    expect(onLongPress).toHaveBeenCalledTimes(1)
  })
})
