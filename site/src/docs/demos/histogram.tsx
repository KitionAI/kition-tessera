import { Histogram } from '@kition/tessera'

const bins = Array.from({ length: 256 }, (_, i) => Math.exp(-((i - 110) ** 2) / 1800) * 900 + Math.exp(-((i - 200) ** 2) / 600) * 500 + 40)

export default function Demo() {
  return (
    <div style={{ width: 300 }}>
      <Histogram bins={bins} />
    </div>
  )
}
