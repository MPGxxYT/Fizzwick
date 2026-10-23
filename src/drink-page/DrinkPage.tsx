import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import type { ListState } from '../drink-list/DrinkList'
import { favoritePicks } from '../favorites/favorite'
import { SaveFavorite } from '../favorites/SaveFavorite'
import { findHouseDrink } from '../house-drinks/catalog'
import { GLASS_SIZES_OZ, resolveRiff, type Drink, type Picks } from '../riff-engine'
import { NotFound } from '../NotFound'
import { useSettings } from '../settings/use-settings'
import { StepMode } from '../step-mode/StepMode'
import { Bubbles, ColorSpots, IceCubes } from './Ambience'
import { hasIceInGlass, isFizzy } from './ambience-for'
import { glassInSentence, GLASS_NAMES, METHOD_NAMES } from './format'
import { GlassSheet } from './GlassSheet'
import { RecipeCard } from './RecipeCard'
import { RiffSentence } from './RiffSentence'
import { Title } from './Title'
import './drink-page.css'

export function DrinkPage() {
  const { drinkId = '' } = useParams()
  const drink = findHouseDrink(drinkId)
  if (!drink) return <NotFound />
  // Keyed so that moving to another Drink starts again from its House Spec.
  return <DrinkView key={drink.id} drink={drink} />
}

// What the page was opened with: the list's search to go back to, or a
// Favorite's picks; and whether step mode is open.
export interface DrinkPageState extends Partial<ListState> {
  favoritePicks?: Picks
  making?: boolean
}

function DrinkView({ drink }: { drink: Drink }) {
  const location = useLocation()
  const navigate = useNavigate()
  const pageState = location.state as DrinkPageState | null

  // Empty picks are the House Spec. A Favorite opens with its own.
  const [picks, setPicks] = useState<Picks>(() =>
    pageState?.favoritePicks ? favoritePicks(drink, pageState.favoritePicks) : {},
  )
  const [servings, setServings] = useState(1)
  const [customOz, setCustomOz] = useState<number | null>(null)
  const [glassOpen, setGlassOpen] = useState(false)
  // The Slot whose word should rise into place, or 'all' after a reset.
  const [justPicked, setJustPicked] = useState<string | null>(null)

  const { units } = useSettings()
  const riff = useMemo(
    () => resolveRiff(drink, picks, { servings, units, glassOz: customOz ?? undefined }),
    [drink, picks, servings, units, customOz],
  )

  // Back to the list as it was (same search and filters), or to Favorites.
  const listSearch = pageState?.listSearch
  const back = pageState?.favoritePicks
    ? { to: '/favorites', label: 'Favorites' }
    : { to: listSearch ? `/?${listSearch}` : '/', label: 'All drinks' }

  // Step mode is its own history entry, so the back gesture leaves it. After
  // a reload the Riff is gone, so a leftover entry shows the Drink page, and
  // the next Make reuses that entry instead of stacking another.
  const [makingEntry, setMakingEntry] = useState<'pushed' | 'replaced' | null>(null)
  const making = pageState?.making === true && makingEntry !== null
  const startMaking = () => {
    const leftover = pageState?.making === true
    setMakingEntry(leftover ? 'replaced' : 'pushed')
    navigate(location, { state: { ...pageState, making: true }, replace: leftover })
  }
  const stopMaking = () => {
    if (makingEntry === 'pushed') navigate(-1)
    else navigate(location, { state: { ...pageState, making: false }, replace: true })
  }

  const pick = (slotId: string, optionId: string | null) => {
    setPicks({ ...riff.picks, [slotId]: optionId })
    setJustPicked(slotId)
  }

  return (
    <div className="dp">
      <ColorSpots drink={drink} picks={riff.picks} />
      {isFizzy(riff) && <Bubbles />}
      {hasIceInGlass(riff) && <IceCubes />}
      <main className="dp-page" inert={making}>
        <Link to={back.to} className="dp-back">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          {back.label}
        </Link>
        <SaveFavorite riff={riff} />

        <header className="dp-head">
          <Title drink={drink} picks={riff.picks} />
          <p className="dp-kicker">
            {METHOD_NAMES[riff.method]}, in a{riff.glassOz !== GLASS_SIZES_OZ[riff.glass] && ` ${riff.glassOz} oz`}{' '}
            <button type="button" className="dp-glass-link" onClick={() => setGlassOpen(true)}>
              {glassInSentence(GLASS_NAMES[riff.glass])}
            </button>
          </p>
        </header>

        <RiffSentence drink={drink} picks={riff.picks} justPicked={justPicked} onPick={pick} />

        <div className="dp-row">
          {riff.dietaryTags.length > 0 && <p className="dp-dietary">Contains {riff.dietaryTags.join(', ')}</p>}
          {!riff.isHouseSpec && (
            <button
              type="button"
              className="dp-reset"
              onClick={() => {
                setPicks({})
                setJustPicked('all')
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 12a8 8 0 1 0 2.6-5.9" />
                <path d="M4 4v4.5h4.5" />
              </svg>
              Reset to House Spec
            </button>
          )}
        </div>

        <RecipeCard riff={riff} onServings={setServings} />
      </main>

      {!making && (
        <div className="dp-make">
          <button type="button" onClick={startMaking}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5.5v13a1 1 0 0 0 1.5.9l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 8 5.5z" />
            </svg>
            Make it
          </button>
        </div>
      )}
      {making && <StepMode drink={drink} riff={riff} onLeave={stopMaking} />}

      {glassOpen && (
        <GlassSheet
          glass={riff.glass}
          colors={riff.colors}
          customOz={customOz}
          onCustomOz={setCustomOz}
          onClose={() => setGlassOpen(false)}
        />
      )}
    </div>
  )
}
