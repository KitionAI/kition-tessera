import { LineChart } from '@kition/tessera'

const days = Array.from({ length: 14 }, (_, index) => `10-${String(index + 10).padStart(2, '0')}`)
const DATA = days.flatMap((date, index) => [
  { date, metric: 'Visitors', value: Math.round(420 + Math.sin(index / 2) * 90 + index * 12) },
  { date, metric: 'Downloads', value: Math.round(120 + Math.cos(index / 3) * 30 + index * 6) },
  { date, metric: 'Sign-ups', value: Math.round(40 + Math.sin(index) * 8 + index * 2) },
])

export default function Demo() {
  return <LineChart label="Growth by day" data={DATA} xField="date" yField="value" seriesField="metric" height={260} />
}
