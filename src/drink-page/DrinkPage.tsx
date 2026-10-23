import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import type { ListState } from '../drink-list/DrinkList'
import { SaveFavorite } from '../favorites/SaveFavorite'
import { findHouseDrink } from '../house-drinks/catalog'
import { GLASS_SIZES_OZ, readRiffLink, resolveRiff, riffLink, type Drink, type Picks } from '../riff-engine'
import { NotFound } from '../NotFound'
import { useSettings } from '../settings/use-settings'
import { StepMode } from '../step-mode/StepMode'
import { Bubbles, ColorSpots, IceCubes } from './Ambience'
import { readable } from './colors'
import { hasIceInGlass, isFizzy } from './ambience-for'
import { glassInSentence, GLASS_NAMES, METHOD_NAMES } from './format'
import { GlassSheet } from './GlassSheet'
import { RecipeCard } from './RecipeCard'
import { RiffSentence } from './RiffSentence'
import { ShareRiff } from './ShareRiff'
import { Title } from './Title'
import './drink-page.css'

// The page is a Riff link: /drinks/<drink>/<slot=option pairs>. With no
// pairs it's the House Spec.
export function DrinkPage() {
  const { drinkId = '', riff: pairs } = useParams()
  const drink = findHouseDrink(drinkId)
  if (!drink) return <NotFound />
  // Keyed so that moving to another Drink starts it afresh.
  return <DrinkView key={drink.id} drink={drink} pairs={pairs} />
}

// What the page was opened with: the list's search to go back to, or that it
// came from Favorites; and whether step mode is open.
export interface DrinkPageState extends Partial<ListState> {
  fromFavorites?: boolean
  making?: boolean
}

function DrinkView({ drink, pairs }: { drink: Drink; pairs: string | undefined }) {
  const location = useLocation()
  const navigate = useNavigate()
  const pageState = location.state as DrinkPageState | null

  // The picks live in the address, so a reload or a shared link opens the
  // same Riff. Swapping an Option rewrites the address in place.
  const { picks, fellBack } = useMemo(() => readRiffLink(drink, pairs), [drink, pairs])
  const setPicks = (next: Picks) => navigate(riffLink(drink, next), { replace: true, state: pageState })
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
  const back = pageState?.fromFavorites
    ? { to: '/favorites', label: 'Favorites' }
    : { to: listSearch ? `/?${listSearch}` : '/', label: 'All drinks' }

  // Step mode is its own history entry, so the back gesture leaves it. After
  // a reload the drink count and glass size are gone, so a leftover entry
  // shows the Drink page, and the next Make reuses that entry instead of
  // stacking another.
  const [makingEntry, setMakingEntry] = useState<'pushed' | 'replaced' | null>(null)
  const making = pageState?.making === true && makingEntry !== null
  const startMaking = () => {
    const leftover = pageState?.making === true
    setMakingEntry(leftover ? 'replaced' : 'pushed')
    navigate(location, { state: { ...pageState, making: true }, replace: leftover })
  }
  // Focus goes back to the Make button after step mode closes, which
  // removed it while it was open.
  const makeButton = useRef<HTMLButtonElement>(null)
  const wasMaking = useRef(making)
  useEffect(() => {
    if (wasMaking.current && !making) makeButton.current?.focus()
    wasMaking.current = making
  }, [making])
  const stopMaking = () => {
    if (makingEntry === 'pushed') navigate(-1)
    else navigate(location, { state: { ...pageState, making: false }, replace: true })
  }

  const pick = (slotId: string, optionId: string | null) => {
    setPicks({ ...riff.picks, [slotId]: optionId })
    setJustPicked(slotId)
  }
  const reset = () => {
    setPicks(drink.houseSpec)
    setJustPicked('all')
  }

  // Recipe lines a swap changed are marked in the picked Option's color, or
  // in mint after a reset or when a Slot was emptied.
  const pickedColor =
    justPicked && justPicked !== 'all'
      ? drink.slots.find((slot) => slot.id === justPicked)?.options.find((option) => option.id === riff.picks[justPicked])?.color
      : undefined
  const changeColor = pickedColor ? readable(pickedColor) : '#7fe3c6'

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
        <ShareRiff drink={drink} riff={riff} />
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

        <RiffSentence
          drink={drink}
          picks={riff.picks}
          justPicked={justPicked}
          onPick={pick}
          onReset={riff.isHouseSpec ? undefined : reset}
        />
        {fellBack.length > 0 && <LinkNotice drink={drink} slotIds={fellBack} />}

        <div className="dp-row">
          {riff.dietaryTags.length > 0 && <p className="dp-dietary">Contains {riff.dietaryTags.join(', ')}</p>}
        </div>

        <RecipeCard riff={riff} onServings={setServings} changeColor={changeColor} />
      </main>

      {!making && (
        <div className="dp-make">
          <button type="button" onClick={startMaking} ref={makeButton}>
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

// A link asked for Options this copy of Fizzwick doesn't have (an older
// version, or a typo), so those Slots show the House Spec instead.
function LinkNotice({ drink, slotIds }: { drink: Drink; slotIds: string[] }) {
  const labels = drink.slots.filter((slot) => slotIds.includes(slot.id)).map((slot) => slot.label.toLowerCase())
  const list = labels.length > 1 ? `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}` : labels[0]
  return (
    <p className="dp-note dp-link-note" role="status">
      This link asks for a {list} this version of Fizzwick doesn't have, so you're seeing the House Spec{' '}
      {labels.length > 1 ? 'ones' : 'one'} instead.
    </p>
  )
}
