/**
 * Overlays for hosts and kit editors: modal dialogs, popovers, a switch, a side sheet, a confirm
 * dialog, and a command list. Modal, popover, and switch draw Radix's accessible primitives
 * (focus trap, Escape, outside press, positioning) in Tessera's style; the command list draws cmdk.
 * Styled only through the theme tokens (styles.css, "Overlays").
 */
import { Command as CommandPrimitive } from 'cmdk'
import { createContext, forwardRef, useCallback, useContext, useEffect, useRef, useState, type ComponentProps, type HTMLAttributes, type ReactNode } from 'react'
import { Dialog as DialogPrimitive, Popover as PopoverPrimitive, Switch as SwitchPrimitive } from 'radix-ui'
import { XIcon } from '@kition/tessera-icons/react'
import { useStrings } from './context'
import { useDialogFocus } from './hooks'
import { Button, ICON_STROKE } from './ui'

function join(...names: (string | undefined | false)[]) {
  return names.filter(Boolean).join(' ')
}

/* Modal */

export type ModalProps = ComponentProps<typeof DialogPrimitive.Root>

/** A modal dialog. Controlled with `open` and `onOpenChange`; Escape and an outside press close it. */
export function Modal(props: ModalProps) {
  return <DialogPrimitive.Root {...props} />
}

export const ModalTrigger = DialogPrimitive.Trigger
export const ModalClose = DialogPrimitive.Close

export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'none'

export type ModalContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
  /** Its widest: `xs` 320px to `4xl` 896px; `none` leaves the width to `className`. */
  size?: ModalSize
  /** No close button in the corner (the footer has its own way out). */
  hideClose?: boolean
  /** When false, an outside press does not close it (Escape still does). */
  dismissible?: boolean
  /** Keeps focus where it was instead of moving it into the dialog when it opens. */
  disableAutoFocus?: boolean
}

/** The dialog's panel, over a dimmed page: 12px radius, a hairline, the modal shadow. */
export function ModalContent({ size = 'lg', hideClose, dismissible = true, disableAutoFocus, className, children, onOpenAutoFocus, onPointerDownOutside, ...props }: ModalContentProps) {
  const t = useStrings()
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="kui-modal-overlay" />
      <DialogPrimitive.Content
        className={join('kui-modal', className)}
        data-size={size}
        onOpenAutoFocus={(event) => {
          if (disableAutoFocus) event.preventDefault()
          onOpenAutoFocus?.(event)
        }}
        onPointerDownOutside={(event) => {
          if (!dismissible) event.preventDefault()
          onPointerDownOutside?.(event)
        }}
        {...props}
      >
        {children}
        {hideClose ? null : (
          <DialogPrimitive.Close className="kui-modal-close" aria-label={t('close')}>
            <XIcon size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

/** The title and description at the top of a modal. */
export function ModalHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={join('kui-modal-header', className)} {...props} />
}

/** The actions at the bottom of a modal, right-aligned; full width on a narrow window. */
export function ModalFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={join('kui-modal-footer', className)} {...props} />
}

export function ModalTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={join('kui-modal-title', className)} {...props} />
}

export function ModalDescription({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={join('kui-modal-description', className)} {...props} />
}

/* Popover */

/** Floating content anchored to a trigger: filters, pickers, small forms. */
export function Popover(props: ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root {...props} />
}

export const PopoverTrigger = PopoverPrimitive.Trigger
export const PopoverAnchor = PopoverPrimitive.Anchor
export const PopoverClose = PopoverPrimitive.Close

/** The popover's panel: 12px radius, a hairline, the floating shadow; 288px wide unless `className` says otherwise. */
export function PopoverContent({ align = 'center', sideOffset = 4, className, ...props }: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content align={align} sideOffset={sideOffset} className={join('kui-popover-panel', className)} {...props} />
    </PopoverPrimitive.Portal>
  )
}

/* Switch */

export type SwitchProps = ComponentProps<typeof SwitchPrimitive.Root>

/** An on/off switch for a setting that applies at once. Controlled with `checked` and `onCheckedChange`. */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch({ className, ...props }, ref) {
  return (
    <SwitchPrimitive.Root ref={ref} className={join('kui-switch', className)} {...props}>
      <SwitchPrimitive.Thumb className="kui-switch-thumb" />
    </SwitchPrimitive.Root>
  )
})

/* Sheet */

export type SheetProps = {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  /** Actions at the bottom, right-aligned. */
  footer?: ReactNode
  /** With unsaved changes, closing (Escape, the backdrop, the close button) calls `onRequestClose` instead. */
  dirty?: boolean
  onRequestClose?: () => void
  /** Its width in pixels. */
  width?: number
  /** Test id of the sheet; its parts take `${testId}-backdrop`, `-header`, `-close`, `-footer`. */
  testId?: string
}

/** A panel that slides in from the right over a dimmed page, for editing one thing beside the work. */
export function Sheet({ open, onClose, title, children, footer, dirty = false, onRequestClose, width = 400, testId = 'sheet' }: SheetProps) {
  const t = useStrings()
  const [visible, setVisible] = useState(false)
  const close = useRef(() => {})
  close.current = () => {
    if (dirty && onRequestClose) onRequestClose()
    else onClose()
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close.current()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  if (!open) return null
  return <SheetPanel title={title} footer={footer} width={width} visible={visible} testId={testId} label={typeof title === 'string' ? title : t('sheet')} closeLabel={t('close')} onClose={() => close.current()}>{children}</SheetPanel>
}

function SheetPanel({ title, footer, width, visible, testId, label, closeLabel, onClose, children }: { title: ReactNode; footer?: ReactNode; width: number; visible: boolean; testId: string; label: string; closeLabel: string; onClose: () => void; children: ReactNode }) {
  const ref = useDialogFocus<HTMLElement>()
  return (
    <>
      <div data-testid={`${testId}-backdrop`} className="kui-sheet-backdrop" data-visible={visible || undefined} onClick={onClose} aria-hidden="true" />
      <aside data-testid={testId} ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={label} className="kui-sheet" data-visible={visible || undefined} style={{ width }}>
        <header data-testid={`${testId}-header`} className="kui-sheet-header">
          <div className="kui-sheet-title">{title}</div>
          <button type="button" data-testid={`${testId}-close`} className="kui-sheet-close" onClick={onClose} aria-label={closeLabel}>
            <XIcon size={16} strokeWidth={ICON_STROKE} aria-hidden="true" />
          </button>
        </header>
        <div className="kui-sheet-body">{children}</div>
        {footer ? (
          <div data-testid={`${testId}-footer`} className="kui-sheet-footer">
            {footer}
          </div>
        ) : null}
      </aside>
    </>
  )
}

/* Confirm */

export type ConfirmOptions = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  /** `danger` draws the confirm button as destructive and puts focus on Cancel. */
  variant?: 'default' | 'danger'
  /** `data-testid` of the dialog, for tests that target one confirm. */
  testId?: string
}

/** Asks, and resolves true when the person confirms; false on Cancel, Escape, or an outside press. */
export type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>

type ConfirmEntry = { id: number; options: ConfirmOptions; resolve: (value: boolean) => void }

const ConfirmContext = createContext<ConfirmFn | null>(null)

let nextConfirmId = 0

/** Lets `useConfirm` ask from anywhere inside it; asks queue and show one at a time. */
export function ConfirmProvider({ children }: { children?: ReactNode }) {
  const [current, setCurrent] = useState<ConfirmEntry | null>(null)
  const queue = useRef<ConfirmEntry[]>([])
  const showing = useRef<ConfirmEntry | null>(null)

  const confirm = useCallback<ConfirmFn>((options) => {
    const resolved = typeof options === 'string' ? { message: options } : options
    return new Promise<boolean>((resolve) => {
      const entry = { id: nextConfirmId++, options: resolved, resolve }
      if (showing.current === null) {
        showing.current = entry
        setCurrent(entry)
      } else {
        queue.current.push(entry)
      }
    })
  }, [])

  useEffect(
    () => () => {
      showing.current?.resolve(false)
      for (const entry of queue.current) entry.resolve(false)
      queue.current = []
      showing.current = null
    },
    [],
  )

  const settle = useCallback(
    (value: boolean) => {
      current?.resolve(value)
      const next = queue.current.shift() ?? null
      showing.current = next
      setCurrent(next)
    },
    [current],
  )

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {current ? <ConfirmDialog key={current.id} options={current.options} onSettle={settle} /> : null}
    </ConfirmContext.Provider>
  )
}

/** The `confirm` function of the nearest `ConfirmProvider`. */
export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error('useConfirm must be used inside <ConfirmProvider>')
  return confirm
}

function ConfirmDialog({ options, onSettle }: { options: ConfirmOptions; onSettle: (value: boolean) => void }) {
  const t = useStrings()
  const { title, message, confirmLabel, cancelLabel, variant = 'default', testId } = options
  const confirmRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const settled = useRef(false)
  const settleOnce = (value: boolean) => {
    if (settled.current) return
    settled.current = true
    onSettle(value)
  }

  // A destructive confirm focuses Cancel, so Enter does not destroy by accident.
  useEffect(() => {
    const target = variant === 'danger' ? cancelRef : confirmRef
    const id = setTimeout(() => target.current?.focus(), 0)
    return () => clearTimeout(id)
  }, [variant])

  return (
    <Modal open onOpenChange={(open) => (open ? undefined : settleOnce(false))}>
      <ModalContent hideClose disableAutoFocus size="sm" data-testid={testId}>
        <ModalHeader>
          <ModalTitle className={title ? undefined : 'kui-visually-hidden'}>{title ?? message}</ModalTitle>
          <ModalDescription data-testid="confirm-message">{message}</ModalDescription>
        </ModalHeader>
        <ModalFooter>
          <Button ref={cancelRef} data-testid="cancel-btn" variant="secondary" size="md" onClick={() => settleOnce(false)}>
            {cancelLabel ?? t('cancel')}
          </Button>
          <Button ref={confirmRef} data-testid="confirm-btn" variant={variant === 'danger' ? 'danger' : 'primary'} size="md" onClick={() => settleOnce(true)}>
            {confirmLabel ?? t('confirm')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

/* Command */

/** A searchable list of commands or choices (cmdk): type to filter, arrows and Enter to pick. */
export function Command({ className, ...props }: ComponentProps<typeof CommandPrimitive>) {
  return <CommandPrimitive className={join('kui-command', className)} {...props} />
}

export function CommandInput({ className, wrapClassName, ...props }: ComponentProps<typeof CommandPrimitive.Input> & { wrapClassName?: string }) {
  return (
    <div className={join('kui-command-input-wrap', wrapClassName)}>
      <CommandPrimitive.Input className={join('kui-input', className)} data-size="md" {...props} />
    </div>
  )
}

export function CommandList({ className, ...props }: ComponentProps<typeof CommandPrimitive.List>) {
  return <CommandPrimitive.List className={join('kui-command-list', className)} {...props} />
}

export function CommandEmpty({ className, ...props }: ComponentProps<typeof CommandPrimitive.Empty>) {
  return <CommandPrimitive.Empty className={join('kui-command-empty', className)} {...props} />
}

export function CommandGroup({ className, ...props }: ComponentProps<typeof CommandPrimitive.Group>) {
  return <CommandPrimitive.Group className={join('kui-command-group', className)} {...props} />
}

export function CommandSeparator({ className, ...props }: ComponentProps<typeof CommandPrimitive.Separator>) {
  return <CommandPrimitive.Separator className={join('kui-command-separator', className)} {...props} />
}

export function CommandItem({ className, ...props }: ComponentProps<typeof CommandPrimitive.Item>) {
  return <CommandPrimitive.Item className={join('kui-command-item', className)} {...props} />
}

/** A shortcut at the end of a command item. */
export function CommandShortcut({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={join('kui-command-shortcut', className)} {...props} />
}
