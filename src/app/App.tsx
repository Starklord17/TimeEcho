import { Component, type ReactNode } from 'react'
import { Game } from '../game/Game'
import { GameOverlay } from '../ui/GameOverlay'

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
      <Game />
      <GameOverlay />
    </GameErrorBoundary>
  )
}
