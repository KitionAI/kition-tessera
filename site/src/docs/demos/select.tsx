import { Select } from '@kition/tessera-ui'

export default function Demo() {
  return (
    <div className="demo-stack">
      <Select defaultValue="sheet" aria-label="Kit">
        <option value="sheet">Sheet</option>
        <option value="slide">Slide</option>
        <option value="photo">Photo</option>
      </Select>
      <Select size="lg" defaultValue="slide" aria-label="Kit (large)">
        <option value="sheet">Sheet</option>
        <option value="slide">Slide</option>
      </Select>
    </div>
  )
}
