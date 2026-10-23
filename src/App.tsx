import { useLayoutEffect } from 'react'
import { Route, Routes, useLocation, useNavigationType } from 'react-router'
import { BarTermsPage } from './bar-terms-page/BarTermsPage'
import { DrinkList } from './drink-list/DrinkList'
import { DrinkPage } from './drink-page/DrinkPage'
import { FavoritesPage } from './favorites/FavoritesPage'
import { NotFound } from './NotFound'
import { SettingsPage } from './settings/SettingsPage'

// A link to another page starts it at the top. Going back or forward keeps
// the browser's own scroll position, so the list is where you left it.
function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()
  useLayoutEffect(() => {
    if (navigationType !== 'POP') window.scrollTo(0, 0)
  }, [pathname, navigationType])
  return null
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<DrinkList />} />
        <Route path="/drinks/:drinkId" element={<DrinkPage />} />
        <Route path="/bar-terms" element={<BarTermsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default App
