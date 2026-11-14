/** @jsxRuntime automatic */
/**
 * Form controls and containers for hosts and kit panels: text fields, password, multi-line text,
 * select, a labelled field, cards, and disclosures. Sizes: `sm` (32px, toolbars and dense rows,
 * the default), `md` (36px, settings panels), `lg` (40px, forms).
 * Styled only through the theme tokens (styles.css, "Forms").
 */
import { forwardRef, useId, useLayoutEffect, useRef, useState, type HTMLAttributes, type RefObject, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { ChevronDownIcon, EyeIcon, EyeOffIcon } from '@kition/tessera-icons/react'
import { useStrings } from './context'
import { ICON_STROKE, type ControlSize } from './ui'

type Sized = { size?: ControlSize; invalid?: boolean }

export type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> &
  Sized & {
    /** An icon (or short text) inside the field before the text: a search glass, a person. */
    prefix?: ReactNode
    /** Classes for the box around the field and its prefix (layout: width, margins). */
    wrapperClassName?: string
  }

/** A single-line text field. `invalid` marks it (and `aria-invalid`) after a failed check. */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput({ size = 'sm', invalid, className, prefix, wrapperClassName, ...props }, ref) {
  const input = <input ref={ref} className={join('kui-input', className)} data-size={size} aria-invalid={invalid || undefined} {...props} />
  if (prefix === undefined || prefix === null) return input
  return (
    <span className={join('kui-input-affix', wrapperClassName)} data-size={size}>
      <span className="kui-input-prefix" aria-hidden="true">
        {prefix}
      </span>
      {input}
    </span>
  )
})

export type PasswordInputProps = Omit<TextInputProps, 'type' | 'wrapperClassName'> & {
  /** Classes for the box around the field and its show/hide button (layout: width, margins). */
  wrapperClassName?: string
}

/**
 * A password field with a show/hide button; the button keeps out of the tab order. `className`
 * goes on the field itself, as on TextInput.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput({ size = 'sm', className, wrapperClassName, ...props }, ref) {
  const t = useStrings()
  const [visible, setVisible] = useState(false)
  const label = visible ? t('passwordHide') : t('passwordShow')
  const Icon = visible ? EyeOffIcon : EyeIcon
  return (
    <span className={join('kui-password', wrapperClassName)} data-size={size}>
      <TextInput ref={ref} size={size} className={className} {...props} type={visible ? 'text' : 'password'} />
      <button type="button" className="kui-password-toggle" aria-label={label} title={label} tabIndex={-1} onClick={() => setVisible((value) => !value)}>
        <Icon size={16} strokeWidth={ICON_STROKE} aria-hidden="true" />
      </button>
    </span>
  )
})

export type AutoSize = { minRows?: number; maxRows?: number }

/**
 * Grows a text area with its text, between `minRows` and `maxRows` lines (it scrolls past
 * `maxRows`); measured again whenever `value` changes; `null` options leave it alone. For a text
 * area of your own; Textarea takes `autoSize` instead.
 */
export function useAutoSize(ref: RefObject<HTMLTextAreaElement | null>, value: unknown, options: AutoSize | null = {}) {
  const off = options === null
  const minRows = options?.minRows ?? 1
  const maxRows = options?.maxRows
  useLayoutEffect(() => {
    const element = ref.current
    if (!element || off) return
    const style = getComputedStyle(element)
    const line = parseFloat(style.lineHeight) || (parseFloat(style.fontSize) || 14) * 1.4
    const padding = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0)
    const border = (parseFloat(style.borderTopWidth) || 0) + (parseFloat(style.borderBottomWidth) || 0)
    element.style.height = 'auto'
    const lines = Math.ceil((element.scrollHeight - padding) / line)
    const rows = Math.max(minRows, Math.min(maxRows ?? Number.POSITIVE_INFINITY, lines))
    element.style.height = `${rows * line + padding + border}px`
    element.style.overflowY = maxRows !== undefined && lines > maxRows ? 'auto' : 'hidden'
  }, [ref, value, off, minRows, maxRows])
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean
  /** Grows with its text (between `minRows` and `maxRows` lines, when given). */
  autoSize?: boolean | AutoSize
}

/** Multi-line text. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ invalid, autoSize, className, ...props }, ref) {
  const own = useRef<HTMLTextAreaElement | null>(null)
  useAutoSize(own, props.value, autoSize ? (typeof autoSize === 'object' ? autoSize : {}) : null)
  return (
    <textarea
      ref={(element) => {
        own.current = element
        if (typeof ref === 'function') ref(element)
        else if (ref) ref.current = element
      }}
      className={join('kui-textarea', className)}
      data-auto-size={autoSize ? true : undefined}
      aria-invalid={invalid || undefined}
      {...props}
    />
  )
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
  /** Open, when the screen holds the state (with `onOpenChange`). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Called when the person closes it. */
  onClose?: () => void
  children?: ReactNode
  className?: string
}

/** A section that opens and closes under its title. */
export function Disclosure({ title, defaultOpen = false, open: held, onOpenChange, onClose, children, className }: DisclosureProps) {
  const [own, setOwn] = useState(defaultOpen)
  const open = held ?? own
  const setOpen = (next: boolean) => {
    if (held === undefined) setOwn(next)
    onOpenChange?.(next)
  }
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
