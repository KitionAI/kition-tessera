/** @jsxRuntime automatic */
/**
 * Forms with state and validation for product screens: `Form` and `FormItem` keep the values and
 * check them against rules, `useForm` reaches them from outside (a modal's OK button submits), and
 * `useWatch` reads one as it changes. Also the controls such forms need beyond `forms.tsx`: a
 * number input, a date and time input, and a confirmation in a popover. Styled through the theme
 * tokens (styles.css, "Forms").
 */
import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react'
import { useStrings, type Strings } from './context'
import { Popover, PopoverContent, PopoverTrigger } from './overlays'
import { Button, ICON_STROKE, type ControlSize } from './ui'
import { CircleAlertIcon } from '@kition/tessera-icons/react'

function join(...names: (string | undefined | false)[]) {
  return names.filter(Boolean).join(' ')
}

type Values = Record<string, unknown>

/** A check on one field. Each kind that is set must pass; `message` replaces the default text. */
export type FormRule = {
  required?: boolean
  /** Least length of text, or least value of a number. */
  min?: number
  /** Most length of text, or most value of a number. */
  max?: number
  pattern?: RegExp
  type?: 'email' | 'url'
  /** Text of only spaces counts as empty. */
  whitespace?: boolean
  /** Returns the problem, or nothing when the value is fine; may read other fields from `form`. */
  validator?: (value: unknown, form: FormInstance) => string | undefined | void | Promise<string | undefined | void>
  message?: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isEmpty = (value: unknown, whitespace: boolean) =>
  value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0) || (whitespace && typeof value === 'string' && value.trim() === '')

/** The first rule `value` breaks, as a message; undefined when it passes them all. */
export async function checkRules(value: unknown, rules: readonly FormRule[], label: string, form: FormInstance, t: Strings): Promise<string | undefined> {
  for (const rule of rules) {
    const empty = isEmpty(value, Boolean(rule.whitespace))
    if (rule.required && empty) return rule.message ?? t('formRequired', { label })
    if (empty) continue
    if (rule.type === 'email' && !(typeof value === 'string' && EMAIL.test(value))) return rule.message ?? t('formEmail', { label })
    if (rule.type === 'url') {
      try {
        new URL(String(value))
      } catch {
        return rule.message ?? t('formUrl', { label })
      }
    }
    if (rule.pattern && !rule.pattern.test(String(value))) return rule.message ?? t('formPattern', { label })
    const size = typeof value === 'number' ? value : String(value).length
    if (rule.min !== undefined && size < rule.min) return rule.message ?? t(typeof value === 'number' ? 'formMinValue' : 'formMinLength', { label, min: rule.min })
    if (rule.max !== undefined && size > rule.max) return rule.message ?? t(typeof value === 'number' ? 'formMaxValue' : 'formMaxLength', { label, max: rule.max })
    if (rule.validator) {
      const problem = await rule.validator(value, form)
      if (problem) return problem
    }
  }
  return undefined
}

/** Thrown by `validateFields` when a field fails: every failing field's message, by name. */
export class FormValidationError extends Error {
  constructor(readonly errors: Readonly<Record<string, string>>) {
    super(Object.values(errors)[0] ?? 'Invalid form')
  }
}

type Registration = { rules: () => readonly FormRule[]; label: () => string; dependencies: readonly string[] }

/** A form's values and errors, reachable from outside it (`useForm`). */
export type FormInstance<T extends object = Values> = {
  getFieldValue: (name: string) => unknown
  getFieldsValue: () => T
  setFieldValue: (name: string, value: unknown) => void
  setFieldsValue: (values: Partial<T>) => void
  /** Back to the initial values, without errors. */
  resetFields: () => void
  /** Checks every field; resolves with the values, or rejects with a `FormValidationError`. */
  validateFields: () => Promise<T>
  /** Checks every field, then calls the form's `onFinish` with the values when they pass. */
  submit: () => void
}

class FormStore {
  values: Values = {}
  initial: Values = {}
  errors: Record<string, string | undefined> = {}
  submitted = false
  initialized = false
  version = 0
  onFinish?: (values: Values) => void
  onValuesChange?: (changed: Values, values: Values) => void
  strings?: Strings
  readonly fields = new Map<string, Registration>()
  readonly listeners = new Set<() => void>()
  readonly instance: FormInstance

  constructor() {
    this.instance = {
      getFieldValue: (name) => this.values[name],
      getFieldsValue: () => ({ ...this.values }),
      setFieldValue: (name, value) => this.change({ [name]: value }, false),
      setFieldsValue: (values) => this.change(values as Values, false),
      resetFields: () => {
        this.values = { ...this.initial }
        this.errors = {}
        this.submitted = false
        this.notify()
      },
      validateFields: () => this.validateAll(),
      submit: () => {
        void this.validateAll().then(
          (values) => this.onFinish?.(values),
          () => undefined,
        )
      },
    }
  }

  init(values: Values | undefined) {
    if (this.initialized) return
    this.initialized = true
    this.initial = { ...values }
    this.values = { ...values }
  }

  notify() {
    this.version += 1
    for (const listener of this.listeners) listener()
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** Sets values; a change the person made re-checks the field once the form was submitted, and the fields that depend on it. */
  change(changed: Values, byPerson: boolean) {
    this.values = { ...this.values, ...changed }
    this.notify()
    if (byPerson) {
      this.onValuesChange?.(changed, { ...this.values })
      if (!this.submitted) return
      const names = Object.keys(changed)
      for (const [name, field] of this.fields) {
        if (names.includes(name) || field.dependencies.some((dependency) => names.includes(dependency))) void this.validate(name)
      }
    }
  }

  async validate(name: string) {
    const field = this.fields.get(name)
    if (!field || !this.strings) return undefined
    const problem = await checkRules(this.values[name], field.rules(), field.label(), this.instance, this.strings)
    if (this.errors[name] !== problem) {
      this.errors = { ...this.errors, [name]: problem }
      this.notify()
    }
    return problem
  }

  async validateAll(): Promise<Values> {
    this.submitted = true
    const problems: Record<string, string> = {}
    for (const name of this.fields.keys()) {
      const problem = await this.validate(name)
      if (problem) problems[name] = problem
    }
    if (Object.keys(problems).length) {
      this.notify()
      throw new FormValidationError(problems)
    }
    return { ...this.values }
  }
}

const stores = new WeakMap<FormInstance, FormStore>()

/** A form instance to pass to `Form` and use outside it (`form.submit()`, `form.resetFields()`). */
export function useForm<T extends object = Values>(): FormInstance<T> {
  const [store] = useState(() => new FormStore())
  stores.set(store.instance, store)
  return store.instance as unknown as FormInstance<T>
}

/** One field's value, updated as it changes. */
export function useWatch<V = unknown>(name: string, form: FormInstance<any>): V | undefined {
  const store = stores.get(form)
  return useSyncExternalStore(
    store?.subscribe ?? (() => () => undefined),
    () => store?.values[name] as V | undefined,
    () => undefined,
  )
}

const FormContext = createContext<{ store: FormStore; layout: FormLayout; disabled: boolean } | null>(null)

export type FormLayout = 'vertical' | 'inline'

export type FormProps<T extends object> = {
  form?: FormInstance<T>
  /** The values it starts with (read once). */
  initialValues?: Partial<T>
  /** Called with the values when the person submits and every field passes. */
  onFinish?: (values: T) => void
  onValuesChange?: (changed: Partial<T>, values: T) => void
  /** `vertical` (default): labels above controls; `inline`: fields in a row (filters). */
  layout?: FormLayout
  disabled?: boolean
  className?: string
  id?: string
  children: ReactNode
}

/** A form that keeps its fields' values and checks them before `onFinish`. */
export function Form<T extends object = Values>({ form, initialValues, onFinish, onValuesChange, layout = 'vertical', disabled = false, className, id, children }: FormProps<T>) {
  const t = useStrings()
  const own = useForm<T>()
  const store = stores.get((form ?? own) as FormInstance)!
  store.init(initialValues as Values | undefined)
  store.strings = t
  store.onFinish = onFinish as ((values: Values) => void) | undefined
  store.onValuesChange = onValuesChange as ((changed: Values, values: Values) => void) | undefined
  const submit = (event: FormEvent) => {
    event.preventDefault()
    store.instance.submit()
  }
  return (
    <FormContext.Provider value={{ store, layout, disabled }}>
      <form id={id} className={join('kui-form', className)} data-layout={layout} noValidate onSubmit={submit}>
        {children}
      </form>
    </FormContext.Provider>
  )
}

export type FormItemProps = {
  /** The field's name in the values; without it the item only lays out a label and a control. */
  name?: string
  label?: ReactNode
  rules?: readonly FormRule[]
  /** Help under the control (replaced by the error while there is one). */
  extra?: ReactNode
  /** Marks the label as required (implied by a `required` rule). */
  required?: boolean
  /** The control's prop that holds the value: `checked` for a check box or switch. */
  valuePropName?: string
  /** The control's prop that reports a change: `onCheckedChange` for a switch. */
  trigger?: string
  /** The value from what the control reports (an event's `target.value` or `checked`, or the value itself, by default). */
  getValueFromEvent?: (...args: any[]) => unknown
  /** Fields whose changes re-check this one (a confirmation of a password). */
  dependencies?: readonly string[]
  /** Kept in the values but not drawn. */
  hidden?: boolean
  className?: string
  /** One control element. */
  children: ReactNode
}

const fromEvent = (first: unknown) => {
  if (first && typeof first === 'object' && 'target' in first) {
    const target = (first as { target: HTMLInputElement }).target
    return target.type === 'checkbox' ? target.checked : target.value
  }
  return first
}

const textOf = (node: ReactNode): string => (typeof node === 'string' || typeof node === 'number' ? String(node) : Array.isArray(node) ? node.map(textOf).join('') : isValidElement<{ children?: ReactNode }>(node) ? textOf(node.props.children) : '')

/** A labelled control bound to one field of the form around it, with its rules and error. */
export function FormItem({ name, label, rules = [], extra, required, valuePropName = 'value', trigger = 'onChange', getValueFromEvent = fromEvent, dependencies = [], hidden, className, children }: FormItemProps) {
  const context = useContext(FormContext)
  const id = useId()
  const latest = useRef({ rules, label })
  latest.current = { rules, label }
  const store = context?.store
  useSyncExternalStore(store?.subscribe ?? (() => () => undefined), () => store?.version ?? 0, () => 0)
  const dependsOn = dependencies.join('\n')
  useEffect(() => {
    if (!store || !name) return undefined
    store.fields.set(name, { rules: () => latest.current.rules, label: () => textOf(latest.current.label) || name, dependencies: dependsOn ? dependsOn.split('\n') : [] })
    return () => {
      store.fields.delete(name)
    }
  }, [store, name, dependsOn])
  if (hidden) return null
  const error = store && name ? store.errors[name] : undefined
  const noteId = `${id}-note`
  const note = error ?? extra
  const control = Children.only(children) as ReactElement<Record<string, unknown>>
  const bound =
    store && name && isValidElement(control)
      ? cloneElement(control, {
          id: (control.props.id as string | undefined) ?? id,
          [valuePropName]: store.values[name] ?? (valuePropName === 'value' ? '' : false),
          [trigger]: (...args: unknown[]) => {
            store.change({ [name]: getValueFromEvent(...args) }, true)
            ;(control.props[trigger] as ((...args: unknown[]) => void) | undefined)?.(...args)
          },
          disabled: (control.props.disabled as boolean | undefined) ?? (context.disabled || undefined),
          'aria-invalid': error ? true : undefined,
          'aria-required': rules.some((rule) => rule.required) || undefined,
          'aria-describedby': note ? noteId : undefined,
        })
      : isValidElement(control) && control.props.id === undefined
        ? cloneElement(control, { id })
        : control
  const mark = required ?? rules.some((rule) => rule.required)
  return (
    <div className={join('kui-form-field', className)} data-invalid={error ? true : undefined}>
      {label ? (
        <label className="kui-form-label" htmlFor={(isValidElement(control) && (control.props.id as string | undefined)) || id} data-required={mark || undefined}>
          {label}
        </label>
      ) : null}
      {bound}
      {note ? (
        <p id={noteId} className="kui-form-note" role={error ? 'alert' : undefined}>
          {note}
        </p>
      ) : null}
    </div>
  )
}

/* NumberInput */

export type NumberInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'onChange' | 'type' | 'min' | 'max' | 'step'> & {
  /** Optional inside a `FormItem`, which supplies it. */
  value?: number | null | ''
  onChange?: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  /** Decimals kept when the field is left. */
  precision?: number
  size?: ControlSize
  invalid?: boolean
}

/** A field for a number, empty as `null`; arrows step it, and it rounds to `precision` when left. */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput({ value, onChange, min, max, step = 1, precision, size = 'sm', invalid, className, onBlur, ...props }, ref) {
  const given = value === undefined || value === '' ? null : value
  const [text, setText] = useState(given === null ? '' : String(given))
  // A value set from outside (a reset, a loaded record) replaces the text; the person's own typing
  // ("1." on the way to "1.5") stays.
  useEffect(() => {
    setText((current) => {
      const typed = current.trim() === '' ? null : Number(current.replace(',', '.'))
      return typed === given ? current : given === null ? '' : String(given)
    })
  }, [given])
  const commit = (raw: string) => {
    const trimmed = raw.trim().replace(',', '.')
    if (trimmed === '') return onChange?.(null)
    const number = Number(trimmed)
    if (Number.isFinite(number)) onChange?.(number)
  }
  return (
    <input
      ref={ref}
      type="number"
      inputMode="decimal"
      className={join('kui-input', 'kui-number-input', className)}
      data-size={size}
      aria-invalid={invalid || undefined}
      min={min}
      max={max}
      step={step}
      value={text}
      onChange={(event) => {
        setText(event.target.value)
        commit(event.target.value)
      }}
      onBlur={(event) => {
        if (text.trim() !== '') {
          let number = Number(text.replace(',', '.'))
          if (Number.isFinite(number)) {
            if (min !== undefined) number = Math.max(min, number)
            if (max !== undefined) number = Math.min(max, number)
            if (precision !== undefined) number = Number(number.toFixed(precision))
            setText(String(number))
            onChange?.(number)
          }
        }
        onBlur?.(event)
      }}
      {...props}
    />
  )
})

/* DateTimeInput */

export type DateTimeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'onChange' | 'type'> & {
  /** Local date (`2026-10-25`) or date and time (`2026-10-25T14:30`); empty is `null`. */
  /** Optional inside a `FormItem`, which supplies it. */
  value?: string | null
  onChange?: (value: string | null) => void
  /** Asks for a time too. */
  withTime?: boolean
  size?: ControlSize
  invalid?: boolean
}

/** A date, or a date and time, from the platform's picker; cleared to `null`. */
export const DateTimeInput = forwardRef<HTMLInputElement, DateTimeInputProps>(function DateTimeInput({ value, onChange, withTime, size = 'sm', invalid, className, ...props }, ref) {
  return (
    <input
      ref={ref}
      type={withTime ? 'datetime-local' : 'date'}
      className={join('kui-input', 'kui-date-input', className)}
      data-size={size}
      aria-invalid={invalid || undefined}
      value={value ?? ''}
      onChange={(event) => onChange?.(event.target.value === '' ? null : event.target.value)}
      {...props}
    />
  )
})

/* Popconfirm */

export type PopconfirmProps = {
  title: ReactNode
  description?: ReactNode
  onConfirm: () => void
  okText?: string
  cancelText?: string
  /** Draws OK as a destructive button. */
  danger?: boolean
  /** Lets the trigger act without asking. */
  disabled?: boolean
  /** The button that asks. */
  children: ReactElement
}

/** Asks "are you sure?" next to the button that does something, before it does. */
export function Popconfirm({ title, description, onConfirm, okText, cancelText, danger, disabled, children }: PopconfirmProps) {
  const t = useStrings()
  const [open, setOpen] = useState(false)
  if (disabled) return children
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="kui-popconfirm" align="end" role="alertdialog" aria-label={typeof title === 'string' ? title : undefined}>
        <div className="kui-popconfirm-body">
          <CircleAlertIcon className="kui-popconfirm-icon" data-danger={danger || undefined} size={16} strokeWidth={ICON_STROKE} aria-hidden="true" />
          <div>
            <div className="kui-popconfirm-title">{title}</div>
            {description ? <div className="kui-popconfirm-description">{description}</div> : null}
          </div>
        </div>
        <div className="kui-popconfirm-actions">
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
            {cancelText ?? t('cancel')}
          </Button>
          <Button
            size="sm"
            variant={danger ? 'danger' : 'primary'}
            onClick={() => {
              setOpen(false)
              onConfirm()
            }}
          >
            {okText ?? t('confirm')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
