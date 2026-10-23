import { Link, useLocation, useNavigate } from 'react-router'
import type { Units } from '../riff-engine'
import { updateSettings, useSettings } from './use-settings'
import '../drink-page/drink-page.css'
import './settings-page.css'

const UNIT_CHOICES: { value: Units; name: string }[] = [
  { value: 'oz', name: 'Ounces (oz)' },
  { value: 'ml', name: 'Millilitres (ml)' },
]

// The two v1 settings, saved on this device as soon as they change.
export function SettingsPage() {
  const { key } = useLocation()
  const navigate = useNavigate()
  const settings = useSettings()

  return (
    <div className="dp st">
      <div className="dp-glow" aria-hidden="true" />
      <main className="dp-page">
        {/* Back where you came from, or to the list when opened directly. */}
        {key === 'default' ? (
          <Link to="/" className="dp-back">
            <BackArrow />
            All drinks
          </Link>
        ) : (
          <button type="button" className="dp-back st-back" onClick={() => navigate(-1)}>
            <BackArrow />
            Back
          </button>
        )}

        <header className="dp-head">
          <h1>Settings</h1>
          <p className="dp-kicker">Saved on this device.</p>
        </header>

        <section className="st-card" aria-labelledby="st-units">
          <h2 id="st-units">Units</h2>
          <p className="st-hint">For every amount. Dashes, barspoons and cups stay as they are.</p>
          <div className="st-choices" role="radiogroup" aria-labelledby="st-units">
            {UNIT_CHOICES.map((choice) => (
              <button
                key={choice.value}
                type="button"
                role="radio"
                aria-checked={settings.units === choice.value}
                onClick={() => updateSettings({ units: choice.value })}
              >
                {choice.name}
              </button>
            ))}
          </div>
        </section>

        <section className="st-card">
          <div className="st-switch-row">
            <div>
              <h2 id="st-underlines">Bar Term underlines</h2>
              <p className="st-hint" id="st-underlines-hint">
                Tapping a term still explains it when they're off.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              className="st-switch"
              aria-checked={settings.underlines}
              aria-labelledby="st-underlines"
              aria-describedby="st-underlines-hint"
              onClick={() => updateSettings({ underlines: !settings.underlines })}
            >
              <span aria-hidden="true" />
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

function BackArrow() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  )
}
