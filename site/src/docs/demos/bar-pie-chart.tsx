import { BarChart, PieChart } from '@kition/tessera-ui'

const STAGES = [
  { stage: 'Backlog', tasks: 14 },
  { stage: 'To do', tasks: 9 },
  { stage: 'Doing', tasks: 6 },
  { stage: 'Review', tasks: 4 },
  { stage: 'Done', tasks: 21 },
]

export default function Demo() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24 }}>
      <BarChart label="Tasks by stage" data={STAGES} xField="stage" yField="tasks" height={240} />
      <PieChart label="Share of tasks" data={STAGES} labelField="stage" valueField="tasks" innerRadius={0.6} height={200} />
    </div>
  )
}
