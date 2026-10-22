import { useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import type { ListState } from '../drink-list/DrinkList'
import { findHouseDrink } from '../house-drinks/catalog'
import { GLASS_SIZES_OZ, resolveRiff, type Drink, type Picks } from '../riff-engine'
import { NotFound } from '../NotFound'
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

function DrinkView({ drink }: { drink: Drink }) {
  const [picks, setPicks] = useState<Picks>({}) // empty: the House Spec
  const [servings, setServings] = useState(1)
  const [customOz, setCustomOz] = useState<number | null>(null)
  const [glassOpen, setGlassOpen] = useState(false)
  // The Slot whose word should rise into place, or 'all' after a reset.
  const [justPicked, setJustPicked] = useState<string | null>(null)

  const riff = useMemo(
    () => resolveRiff(drink, picks, { servings, glassOz: customOz ?? undefined }),
    [drink, picks, servings, customOz],
  )

  // Back to the list as it was: same search and filters, if we came from it.
  const listSearch = (useLocation().state as Partial<ListState> | null)?.listSearch
  const backToList = listSearch ? `/?${listSearch}` : '/'

  const pick = (slotId: string, optionId: string | null) => {
    setPicks({ ...riff.picks, [slotId]: optionId })
    setJustPicked(slotId)
  }

  return (
    <div className="dp">
      <ColorSpots drink={drink} picks={riff.picks} />
      {isFizzy(riff) && <Bubbles />}
      {hasIceInGlass(riff) && <IceCubes />}
      <main className="dp-page">
        <Link to={backToList} className="dp-back">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          All drinks
        </Link>

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
