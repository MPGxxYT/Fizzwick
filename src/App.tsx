import { Route, Routes } from 'react-router'
import { DrinkList } from './drink-list/DrinkList'
import { DrinkPage } from './drink-page/DrinkPage'
import { NotFound } from './NotFound'

function App() {
  return (
    <Routes>
      <Route path="/" element={<DrinkList />} />
      <Route path="/drinks/:drinkId" element={<DrinkPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
