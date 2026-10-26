/**
 * A drop-down to search in: one choice from a long list, filtered as the person types, or searched
 * on the server (`onSearch`) for lists too long to send (users, records). Built on Popover and the
 * Command list; styled through the theme tokens (styles.css, "Combobox").
 */
import { useState, type ReactNode } from 'react'
import { CheckIcon, ChevronDownIcon, XIcon } from '@kition/tessera-icons/react'
import { useStrings } from './context'
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList, Popover, PopoverContent, PopoverTrigger } from './overlays'
import { ICON_STROKE, Spinner, type ControlSize } from './ui'

function join(...names: (string | undefined | false)[]) {
  return names.filter(Boolean).join(' ')
}

export type ComboboxOption<V extends string | number> = {
  value: V
  label: ReactNode
  /** The words a search matches; the label's text when it is a string. */
  text?: string
  /** Shown but not choosable (with why in its label). */
  disabled?: boolean
}

export type ComboboxProps<V extends string | number> = {
  value: V | undefined
  onChange: (value: V | undefined) => void
  options: readonly ComboboxOption<V>[]
  /** Search on the server: called with each query, and the options shown are the caller's. Without it, the options are filtered here. */
  onSearch?: (query: string) => void
  loading?: boolean
  placeholder?: string
  /** Shown when nothing matches. */
  emptyText?: ReactNode
  /** The control's accessible name. */
  label: string
  size?: ControlSize
  disabled?: boolean
  className?: string
  testId?: string
}

/** One choice from a long list, searched as the person types; the choice can be cleared. */
export function Combobox<V extends string | number>({ value, onChange, options, onSearch, loading, placeholder, emptyText, label, size = 'sm', disabled, className, testId }: ComboboxProps<V>) {
  const t = useStrings()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const chosen = options.find((option) => option.value === value)
  const textOf = (option: ComboboxOption<V>) => option.text ?? (typeof option.label === 'string' ? option.label : String(option.value))
  return (
    <span className={join('kui-combobox', className)} data-size={size} data-testid={testId}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" className="kui-combobox-trigger" role="combobox" aria-expanded={open} aria-label={label} disabled={disabled}>
            <span className={join('kui-combobox-value', !chosen && 'kui-combobox-placeholder')}>{chosen ? chosen.label : (placeholder ?? '')}</span>
            <ChevronDownIcon size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="kui-combobox-panel" align="start">
          <Command shouldFilter={!onSearch}>
            <CommandInput
              aria-label={label}
              placeholder={placeholder}
              value={query}
              onValueChange={(next) => {
                setQuery(next)
                onSearch?.(next)
              }}
            />
            <CommandList>
              {loading ? (
                <div className="kui-combobox-loading">
                  <Spinner size={16} label={t('loading')} />
                </div>
              ) : (
                <CommandEmpty>{emptyText ?? t('noMatches')}</CommandEmpty>
              )}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${textOf(option)} ${option.value}`}
                  disabled={option.disabled}
                  onSelect={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  <CheckIcon className="kui-combobox-check" data-shown={option.value === value || undefined} size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
                  <span>{option.label}</span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {chosen && !disabled ? (
        <button type="button" className="kui-combobox-clear" aria-label={t('clear')} onClick={() => onChange(undefined)}>
          <XIcon size={12} strokeWidth={ICON_STROKE} aria-hidden="true" />
        </button>
      ) : null}
    </span>
  )
}

export type MultiSelectProps<V extends string | number> = {
  values: readonly V[]
  onChange: (values: V[]) => void
  options: readonly ComboboxOption<V>[]
  /** Shown when nothing is chosen. */
  placeholder?: string
  /** The control's accessible name. */
  label: string
  size?: ControlSize
  disabled?: boolean
  className?: string
  testId?: string
}

/** Several choices from a list: the chosen ones in the field, toggled in a list (searchable once it is long). */
export function MultiSelect<V extends string | number>({ values, onChange, options, placeholder, label, size = 'sm', disabled, className, testId }: MultiSelectProps<V>) {
  const t = useStrings()
  const [open, setOpen] = useState(false)
  const chosen = options.filter((option) => values.includes(option.value))
  const textOf = (option: ComboboxOption<V>) => option.text ?? (typeof option.label === 'string' ? option.label : String(option.value))
  const toggle = (value: V) => onChange(values.includes(value) ? values.filter((item) => item !== value) : options.filter((option) => option.value === value || values.includes(option.value)).map((option) => option.value))
  return (
    <span className={join('kui-combobox', className)} data-size={size} data-testid={testId}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" className="kui-combobox-trigger" aria-haspopup="listbox" aria-expanded={open} aria-label={label} disabled={disabled}>
            <span className={join('kui-combobox-value', chosen.length === 0 && 'kui-combobox-placeholder')}>
              {chosen.length === 0 ? (placeholder ?? '') : chosen.length === options.length && options.length > 2 ? t('allChosen') : chosen.map(textOf).join(', ')}
            </span>
            <ChevronDownIcon size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="kui-combobox-panel" align="start">
          <Command>
            {options.length > 8 ? <CommandInput aria-label={label} placeholder={placeholder} /> : null}
            <CommandList aria-multiselectable="true">
              <CommandEmpty>{t('noMatches')}</CommandEmpty>
              {options.map((option) => (
                <CommandItem key={option.value} value={`${textOf(option)} ${option.value}`} disabled={option.disabled} aria-selected={values.includes(option.value)} onSelect={() => toggle(option.value)}>
                  <CheckIcon className="kui-combobox-check" data-shown={values.includes(option.value) || undefined} size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
                  <span>{option.label}</span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </span>
  )
}
