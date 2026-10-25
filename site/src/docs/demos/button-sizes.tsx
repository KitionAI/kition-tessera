import { Button } from '@kition/tessera'

export default function Demo() {
  return (
    <div className="demo-row">
      <Button variant="primary" size="sm">Small (28)</Button>
      <Button variant="primary" size="md">Medium (36)</Button>
      <Button variant="primary" size="lg">Large (44)</Button>
      <Button>Editor chrome (30)</Button>
    </div>
  )
}
