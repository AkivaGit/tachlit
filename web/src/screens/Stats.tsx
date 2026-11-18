import { C } from '../colors'
import { K } from '../strings'

/** The statistics row: learners, teachers, pairings (right to left). */
export function Stats({ learners, teachers, pairings }: { learners: number; teachers: number; pairings: number }) {
  const cell = (testId: string, value: number, color: string, label: string) => (
    <div className="stats__cell">
      <div className="stats__value" style={{ color }} data-testid={testId}>{value}</div>
      <div className="stats__label">{label}</div>
    </div>
  )
  return (
    <div className="stats">
      {cell('stat-learners', learners, C.main_color, K.stat_learners)}
      {cell('stat-teachers', teachers, C.secondary_color, K.stat_teachers)}
      {cell('stat-pairings', pairings, C.success_color, K.stat_pairings)}
    </div>
  )
}
