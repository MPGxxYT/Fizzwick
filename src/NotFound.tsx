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

// A link to a Custom Drink made on another phone, or deleted from this one.
export function NotOnThisPhone() {
  return (
    <main className="home">
      <h1>This drink isn't on this phone</h1>
      <p>
        A drink someone makes in Fizzwick stays on their phone until sharing arrives. If it was yours, restoring a
        backup in Settings brings it back. <Link to="/">See all drinks</Link>
      </p>
    </main>
  )
}
