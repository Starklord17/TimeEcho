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
          <h1>No pudimos iniciar la escena</h1>
          <p>Comprobá que WebGL esté disponible y recargá la página.</p>
          <button onClick={() => location.reload()}>Reintentar</button>
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
