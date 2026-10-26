import { ButtonLink } from '@kition/tessera-ui'
import { ArrowLeftIcon, MailIcon } from '@kition/tessera-icons/react'

export default function Demo() {
  return (
    <div className="demo-row">
      <ButtonLink variant="primary" size="md" href="#sign-in">
        Sign in again
      </ButtonLink>
      <ButtonLink size="md" href="#home">
        <ArrowLeftIcon size={16} />
        Back to the console
      </ButtonLink>
      <ButtonLink variant="ghost" size="md" href="mailto:hello@example.com">
        <MailIcon size={16} />
        Contact support
      </ButtonLink>
    </div>
  )
}
