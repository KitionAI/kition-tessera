import { useState } from 'react'
import { Combobox } from '@kition/tessera-ui'

const PEOPLE = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson', 'Margaret Hamilton', 'Edsger Dijkstra', 'Barbara Liskov', 'Donald Knuth']

export default function Demo() {
  const [person, setPerson] = useState<number | undefined>(2)
  return (
    <div style={{ maxWidth: 320 }}>
      <Combobox
        label="Person"
        size="md"
        placeholder="Search people"
        value={person}
        onChange={setPerson}
        options={PEOPLE.map((name, index) => ({ value: index + 1, label: index === 5 ? `${name} (no GitHub)` : name, disabled: index === 5 }))}
      />
    </div>
  )
}
