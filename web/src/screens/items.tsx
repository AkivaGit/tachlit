import type { UserData } from '../api/types'
import { C } from '../colors'
import { fmt, K } from '../strings'
import { Card } from '../ui/Card'
import { isLatinOnly } from '../ui/script'
import { useLongPress } from '../ui/useLongPress'

interface ItemProps {
  user: UserData
  onClick: () => void
  onLongPress: () => void
}

function ItemCard({ onClick, onLongPress, children }: Omit<ItemProps, 'user'> & { children: React.ReactNode }) {
  const press = useLongPress(onLongPress)
  return (
    <div {...press.handlers}>
      <Card className="item" radius={8} elevation={2} onClick={press.wrapClick(onClick)}>{children}</Card>
    </div>
  )
}

/**
 * In the Android item layouts the city, level and capacity badges have a
 * transparent background with white text, so they are invisible. Copied as is.
 */
const Badge = ({ text, size, small }: { text: string; size: number; small?: boolean }) => (
  <span className={`item__badge ${small ? 'item__badge--small' : ''} ${isLatinOnly(text) ? 'latin' : ''}`} style={{ fontSize: size }}>{text}</span>
)

/** item_user.xml (GenericUsersAdapter) */
export function UserItem({ user, onClick, onLongPress }: ItemProps) {
  return (
    <ItemCard onClick={onClick} onLongPress={onLongPress}>
      <div className="item__row">
        <span className="item__name" style={{ color: C.main_color }}>{user.name}</span>
        <Badge text={user.city ?? ''} size={14} />
      </div>
      <div className="item__line1">{fmt(K.item_email, user.email)}</div>
      <div className="item__line2">{fmt(K.item_phone, user.phone ?? '')}</div>
    </ItemCard>
  )
}

/** item_learner.xml (LearnersAdapter); subjects/schedule are empty, as on Android. */
export function LearnerItem({ user, onClick, onLongPress }: ItemProps) {
  return (
    <ItemCard onClick={onClick} onLongPress={onLongPress}>
      <div className="item__row">
        <span className="item__name" style={{ color: C.main_color }}>{user.name}</span>
        <Badge text={user.city ?? ''} size={14} />
      </div>
      <div className="item__line1">{fmt(K.item_subjects, '').trim()}</div>
      <div className="item__line2 item__line2--spaced">{fmt(K.item_schedule, '').trim()}</div>
      <div className="item__badge-row"><Badge text="Beginner" size={12} small /></div>
    </ItemCard>
  )
}

/** item_teacher.xml (TeachersAdapter) */
export function TeacherItem({ user, onClick, onLongPress }: ItemProps) {
  return (
    <ItemCard onClick={onClick} onLongPress={onLongPress}>
      <div className="item__row">
        <span className="item__name" style={{ color: C.secondary_color }}>{user.name}</span>
        <Badge text={user.city ?? ''} size={14} />
      </div>
      <div className="item__line1">{fmt(K.item_subjects, '').trim()}</div>
      <div className="item__line2 item__line2--spaced">{fmt(K.item_schedule, '').trim()}</div>
      <div className="item__row">
        <span className="item__line2 item__grow" />
        <Badge text={fmt(K.item_capacity, 0, 3)} size={12} small />
      </div>
    </ItemCard>
  )
}
