/**
 * Form controls and containers for hosts and kit panels: text fields, password, multi-line text,
 * select, a labelled field, cards, and disclosures. Sizes: `sm` (32px, toolbars and dense rows,
 * the default), `md` (36px, settings panels), `lg` (40px, forms).
 * Styled only through the theme tokens (styles.css, "Forms").
 */
import { forwardRef, useId, useState, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { ChevronDownIcon, EyeIcon, EyeOffIcon } from '@kition/tessera-icons/react'
import { useStrings } from './context'
import { ICON_STROKE, type ControlSize } from './ui'

type Sized = { size?: ControlSize; invalid?: boolean }

export type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & Sized

/** A single-line text field. `invalid` marks it (and `aria-invalid`) after a failed check. */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput({ size = 'sm', invalid, className, ...props }, ref) {
  return <input ref={ref} className={join('kui-input', className)} data-size={size} aria-invalid={invalid || undefined} {...props} />
})

export type PasswordInputProps = Omit<TextInputProps, 'type'>

/** A password field with a show/hide button; the button keeps out of the tab order. */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput({ size = 'sm', className, ...props }, ref) {
  const t = useStrings()
  const [visible, setVisible] = useState(false)
  const label = visible ? t('passwordHide') : t('passwordShow')
  const Icon = visible ? EyeOffIcon : EyeIcon
  return (
    <span className={join('kui-password', className)} data-size={size}>
      <TextInput ref={ref} size={size} {...props} type={visible ? 'text' : 'password'} />
      <button type="button" className="kui-password-toggle" aria-label={label} title={label} tabIndex={-1} onClick={() => setVisible((value) => !value)}>
        <Icon size={16} strokeWidth={ICON_STROKE} aria-hidden="true" />
      </button>
    </span>
  )
})

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }

/** Multi-line text. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ invalid, className, ...props }, ref) {
  return <textarea ref={ref} className={join('kui-textarea', className)} aria-invalid={invalid || undefined} {...props} />
})

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> & Sized

/**
 * A drop-down. It stays a native select, as kits' do, for the platform's popup and accessibility,
 * drawn as Tessera's control. Children are `<option>`s.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ size = 'sm', invalid, className, children, ...props }, ref) {
  return (
    <span className={join('kui-select', className)} data-size={size}>
      <select ref={ref} aria-invalid={invalid || undefined} {...props}>
        {children}
      </select>
      <ChevronDownIcon className="kui-select-chevron" size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
    </span>
  )
})

export type FieldProps = {
  label: ReactNode
  /** Help under the control; replaced by `error` when there is one. */
  hint?: ReactNode
  error?: ReactNode
  /** The control. Given a function, it receives the ids to put on it (`id`, `aria-describedby`). */
  children: ReactNode | ((ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode)
  className?: string
}

/** A label, a control, and its help or error, wired together for screen readers. */
export function Field({ label, hint, error, children, className }: FieldProps) {
  const id = useId()
  const noteId = `${id}-note`
  const note = error ?? hint
  const describedBy = note ? noteId : undefined
  return (
    <div className={join('kui-form-field', className)} data-invalid={error ? true : undefined}>
      <label className="kui-form-label" htmlFor={id}>
        {label}
      </label>
      {typeof children === 'function' ? children({ id, describedBy, invalid: Boolean(error) }) : children}
      {note ? (
        <p id={noteId} className="kui-form-note" role={error ? 'alert' : undefined}>
          {note}
        </p>
      ) : null}
    </div>
  )
}

/** A product card: 12px radius, a hairline, a light shadow. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={join('kui-card', className)} {...props} />
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={join('kui-card-header', className)} {...props} />
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={join('kui-card-content', className)} {...props} />
}

export type DisclosureProps = {
  title: ReactNode
  defaultOpen?: boolean
  /** Called when the person closes it. */
  onClose?: () => void
  children?: ReactNode
  className?: string
}

/** A section that opens and closes under its title. */
export function Disclosure({ title, defaultOpen = false, onClose, children, className }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen)
  const bodyId = useId()
  return (
    <div className={join('kui-disclosure', className)} data-open={open || undefined}>
      <button
        type="button"
        className="kui-disclosure-trigger"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => {
          setOpen(!open)
          if (open) onClose?.()
        }}
      >
        <ChevronDownIcon className="kui-disclosure-chevron" size={16} strokeWidth={ICON_STROKE} aria-hidden="true" />
        <span>{title}</span>
      </button>
      {open ? (
        <div id={bodyId} className="kui-disclosure-body">
          {children}
        </div>
      ) : null}
    </div>
  )
}

function join(...names: (string | undefined | false)[]) {
  return names.filter(Boolean).join(' ')
}
