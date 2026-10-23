import { Route, Routes } from 'react-router'
import { BarTermsPage } from './bar-terms-page/BarTermsPage'
import { DrinkList } from './drink-list/DrinkList'
import { DrinkPage } from './drink-page/DrinkPage'
import { NotFound } from './NotFound'

function App() {
  return (
    <Routes>
      <Route path="/" element={<DrinkList />} />
      <Route path="/drinks/:drinkId" element={<DrinkPage />} />
      <Route path="/bar-terms" element={<BarTermsPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
