import { Component, lazy, Suspense, type ReactNode } from 'react'
import { GameOverlay } from '../ui/GameOverlay'

// Show the interface while the WebGL scene and physics dependencies load.
const Game = lazy(() =>
  import('../game/Game').then(({ Game }) => ({ default: Game })),
)

class GameErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed)
      return (
        <main className="error-screen">
          <h1>We couldn't start the scene</h1>
          <p>Make sure WebGL is available, then reload the page.</p>
          <button onClick={() => location.reload()}>Try again</button>
        </main>
      )
    return this.props.children
  }
}

export function App() {
  return (
    <GameErrorBoundary>
      <Suspense fallback={<div className="game-viewport" aria-hidden="true" />}>
        <Game />
      </Suspense>
      <GameOverlay />
    </GameErrorBoundary>
  )
}
