import { Link } from 'react-router'

export function NotFound() {
  return (
    <main className="home">
      <h1>No drink here</h1>
      <p>
        That page doesn't exist. <Link to="/">See all drinks</Link>
      </p>
    </main>
  )
}
