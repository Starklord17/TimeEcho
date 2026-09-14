import { createRoot } from 'react-dom/client'
import { EchoReview } from './EchoReview'
if (import.meta.env.DEV) {
  const root = createRoot(document.getElementById('root')!)
  root.render(<EchoReview />)
  import.meta.hot?.dispose(() => root.unmount())
}
