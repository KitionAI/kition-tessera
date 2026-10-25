import { Button, Popover, PopoverContent, PopoverTrigger, Select, Switch } from '@kition/tessera'
import { FunnelIcon } from '@kition/tessera-icons/react'

export default function Demo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="sm">
          <FunnelIcon /> Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <div style={{ display: 'grid', gap: 12, padding: 14 }}>
          <strong style={{ fontSize: 13 }}>Show records where</strong>
          <Select size="md" defaultValue="open">
            <option value="open">Status is Open</option>
            <option value="done">Status is Done</option>
          </Select>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
            Include archived <Switch aria-label="Include archived" />
          </label>
        </div>
      </PopoverContent>
    </Popover>
  )
}
