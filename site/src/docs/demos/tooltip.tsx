import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@kition/tessera'
import { CircleAlertIcon } from '@kition/tessera-icons/react'

export default function Demo() {
  return (
    <TooltipProvider>
      <div className="demo-row">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" iconOnly aria-label="Invalid value">
              <CircleAlertIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>The value is not a date</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" size="sm">Hover or focus me</Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Tooltips name a control; they never hold the only copy of something.</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
