import { Route, Routes } from 'react-router'
import { APP_NAME } from './app-name'
import { DrinkPage } from './drink-page/DrinkPage'
import { NotFound } from './NotFound'

function Home() {
  return (
    <main className="home">
      <h1>{APP_NAME}</h1>
      <p>Drinks are on the way.</p>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/drinks/:drinkId" element={<DrinkPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
