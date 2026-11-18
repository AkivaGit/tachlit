import { useNavigate } from 'react-router'
import { FORMS } from '../domain/forms'
import { asset, ROUTES } from '../routes'
import { S } from '../strings'
import { Card } from '../ui/Card'
import { NotificationsPrompt } from '../ui/NotificationsPrompt'

/** MainActivity: logo card, titles, and the "choose your role" cards. */
export function MainScreen() {
  const navigate = useNavigate()
  const cards: { title: string; description: string; to: string }[] = [
    { title: S.learn_asker_title, description: S.learn_asker_description, to: ROUTES.register(FORMS.LEARN_ASKER.slug) },
    { title: S.learn_giver_title, description: S.learn_giver_description, to: ROUTES.register(FORMS.LEARN_GIVER.slug) },
    { title: S.office_volunteer_title, description: S.office_volunteer_description, to: ROUTES.register(FORMS.OFFICE_VOLUNTEER.slug) },
    { title: S.food_volunteer_title, description: S.food_volunteer_description, to: ROUTES.register(FORMS.FOOD_VOLUNTEER.slug) },
    { title: S.group_coordinator_title, description: S.group_coordinator_description, to: ROUTES.register(FORMS.GROUP_COORDINATOR.slug) },
    { title: S.donations_title, description: S.donations_description, to: ROUTES.donations },
    { title: S.supervisor_title, description: S.supervisor_description, to: ROUTES.supervisor },
  ]

  return (
    <div className="main">
      <NotificationsPrompt />
      <Card className="main__logo-card" background="var(--card)" radius={12} elevation={6}>
        <img className="main__logo" src={asset('images/tachlit_logo1.webp')} alt={S.app_logo} />
      </Card>
      <div className="main__title">{S.app_name}</div>
      <div className="main__subtitle">{S.welcome_subtitle}</div>
      <div className="main__choose">{S.choose_your_role}</div>
      <div className="main__list">
        {cards.map((c) => (
          <Card key={c.to} className="main__card" background="var(--card)" radius={12} elevation={6} rippleColor="rgba(68, 151, 153, 0.3)" onClick={() => navigate(c.to)}>
            <div className="main__card-title">{c.title}</div>
            <div className="main__card-description">{c.description}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}
