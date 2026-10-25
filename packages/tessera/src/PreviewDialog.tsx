/**
 * A dialog that previews its command while a person edits it (the Photo and Film designs'
 * `PreviewDialog`): a Preview check box, a strip under the fields, OK, and Cancel (Reset while Alt
 * is held, when the dialog can reset). It knows nothing of what a preview draws or how: the kit
 * gives it `begin`, `update`, and `end`, which reach the engine's worker through the kit's session.
 * Calls run one at a time and the latest draft wins; Cancel, Escape, OK, turning Preview off, and
 * unmounting each end an open preview exactly once.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import { useStrings } from './context'
import { Button, Dialog } from './ui'

/** What the strip says about the preview: nothing, a call in flight, or the last call's error. */
export type PreviewStatus = 'idle' | 'pending' | { error: string }

export type PreviewDialogPreview = {
  /** Starts the preview from the document, with the current draft. */
  begin: () => Promise<void> | void
  /** Shows the current draft in the open preview. */
  update: () => Promise<void> | void
  /** Drops the preview. */
  end: () => Promise<void> | void
  /**
   * The dialog's draft: a change of value (compared as JSON) runs `update`. Put in it anything else
   * the preview depends on, such as the document's revision, so a peer's change refreshes the
   * preview too; the kit's `update` may begin the preview again.
   */
  draft: unknown
  /** Drawn under the fields: a summary, a diff list, or a Play button for sound. */
  strip?: ReactNode
  /** The kit's own status (a job's progress, say). The dialog's own (pending while begin or update runs, the error when one fails) shows while this is idle or absent. */
  status?: PreviewStatus
}

export type PreviewDialogProps = {
  title: string
  /** Shows the Preview check box (on at first) when given; without it the dialog behaves as `Dialog`. */
  preview?: PreviewDialogPreview
  okLabel?: string
  okDisabled?: boolean
  /** Draws no OK: one button (Cancel, named by `cancelLabel`) for a dialog that only shows information. */
  hideOk?: boolean
  /**
   * Runs the command. The dialog does not close itself: once this resolves, the kit unmounts it
   * (unless `keepOpen`). A failure shows in the dialog and leaves it open, previewing again.
   */
  onOk: () => Promise<void> | void
  /** Cancel, Escape, or a press outside (when modal). The kit unmounts the dialog. Not while OK runs. */
  onCancel: () => void
  /** The Cancel button's label ("Done" in upstream's Find, "Close" for information). */
  cancelLabel?: string
  /** Alt turns Cancel into Reset, which calls this (restores the dialog's defaults). */
  onReset?: () => void
  /** OK runs without closing, and the preview stays open (upstream's Find). */
  keepOpen?: boolean
  /**
   * Blocks the page (the default). With `false` there is no backdrop: a press outside does not
   * cancel, Tab may leave the dialog, and the editor keeps its keys (to move the playhead under a
   * picture preview). Escape still cancels.
   */
  modal?: boolean
  children: ReactNode
  /** The dialog's Kit UI id. */
  uiId?: string
  /** The buttons' Kit UI ids; Reset is the Cancel button. */
  ids?: { ok?: string; cancel?: string; preview?: string }
  testId?: string
  /** Where the dialog sits (with `onMove`), as `Dialog`'s; absent: where the layout puts it. */
  position?: { x: number; y: number } | null
  /** Makes the dialog movable by its title, as `Dialog`'s (a kit keeps the place); absent, it does not move. */
  onMove?: (position: { x: number; y: number }) => void
}

function useLabels() {
  const t = useStrings()
  return {
    ok: t('previewDialogOk'),
    cancel: t('previewDialogCancel'),
    reset: t('previewDialogReset'),
    preview: t('previewDialogPreview'),
    pending: t('previewDialogPending'),
    off: (error: string) => t('previewDialogOff', { error }),
  }
}

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error))

/** A draft's identity for "did it change": its JSON, or the value itself when it has none. */
function draftKey(draft: unknown): unknown {
  try {
    return JSON.stringify(draft)
  } catch {
    return draft
  }
}

type Report = { status: (status: PreviewStatus) => void; beginFailed: (error: string) => void }

/**
 * The preview's calls, one at a time: a change while a call runs marks the preview stale, and one
 * update with the latest draft runs once the queue is empty. `end` waits for the call in flight.
 */
function previewRunner(api: () => PreviewDialogPreview | undefined, report: Report) {
  let open = false
  // Whether the kit's preview exists: a begin went through and no end has run since.
  let started = false
  let stale = false
  let pending = 0
  let tail: Promise<void> = Promise.resolve()
  const enqueue = (task: () => Promise<void>): Promise<void> => {
    pending += 1
    tail = tail.then(task).finally(() => {
      pending -= 1
      if (pending === 0 && stale && open) {
        stale = false
        void enqueue(update)
      }
    })
    return tail
  }
  const update = async () => {
    if (!open || !started) return
    report.status('pending')
    try {
      await api()?.update()
      report.status('idle')
    } catch (error) {
      report.status({ error: errorText(error) })
    }
  }
  const begin = async () => {
    if (!open) return
    // Begin reads the latest draft, so changes made before it are in it.
    stale = false
    report.status('pending')
    try {
      await api()?.begin()
      started = true
      report.status('idle')
    } catch (error) {
      report.status('idle')
      if (open) {
        open = false
        report.beginFailed(errorText(error))
      }
    }
  }
  return {
    isOpen: () => open,
    begin() {
      if (open) return
      open = true
      void enqueue(begin)
    },
    change() {
      if (!open) return
      if (pending > 0) stale = true
      else void enqueue(update)
    },
    end(): Promise<void> {
      if (!open) return tail
      open = false
      stale = false
      return enqueue(async () => {
        if (!started) return
        started = false
        try {
          await api()?.end()
        } catch {
          // Nothing is left to show; the preview's own error does not stop the dialog closing.
        }
        report.status('idle')
      })
    },
  }
}

type Runner = ReturnType<typeof previewRunner>

const FOCUSABLE = 'button, input, select, textarea, a[href], [tabindex]'

/** The controls Tab reaches, in order: enabled, in the tab order, and drawn. */
function focusables(root: Element) {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((element) => !(element as HTMLButtonElement).disabled && element.tabIndex >= 0 && !element.hidden && element.getClientRects().length > 0)
}

/** Places whose Enter is their own: a rename field, menus, lists, combo boxes, popovers, open pop-ups, and anything marked. */
const OWN_ENTER = '.kui-rename, [role="menu"], [role="combobox"], [role="listbox"], .kui-popover, [data-kui-own-enter], [aria-expanded="true"]'

/** Whether Enter in `target` means OK: a one-line field drawn in the dialog, not a button, a checkbox or radio button, a menu, or a multi-line field. */
function entersOk(target: EventTarget | null, dialog: Element | null | undefined) {
  if (!(target instanceof HTMLInputElement)) return false
  // A field a portal draws elsewhere (a popover's) is not the dialog's, even though its keys reach it.
  if (!dialog?.contains(target) || target.closest(OWN_ENTER)) return false
  return !['button', 'submit', 'reset', 'file', 'image', 'checkbox', 'radio'].includes(target.type)
}

/** Keys an input method is composing with (WebKit gives Enter confirming a candidate `isComposing` false and keyCode 229). */
const composing = (event: KeyboardEvent) => event.isComposing || event.keyCode === 229

export function PreviewDialog({
  title,
  preview,
  okLabel,
  okDisabled = false,
  hideOk = false,
  onOk,
  onCancel,
  cancelLabel,
  onReset,
  keepOpen = false,
  modal = true,
  children,
  uiId,
  ids,
  testId = 'preview-dialog',
  position,
  onMove,
}: PreviewDialogProps) {
  const labels = useLabels()
  const latest = useRef({ preview, onOk, onCancel, onReset, okDisabled, hideOk, keepOpen, labels })
  useLayoutEffect(() => {
    latest.current = { preview, onOk, onCancel, onReset, okDisabled, hideOk, keepOpen, labels }
  })
  const [previewOn, setPreviewOn] = useState(true)
  const [status, setStatus] = useState<PreviewStatus>('idle')
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [alt, setAlt] = useState(false)
  const [okRequest, setOkRequest] = useState(0)
  const runner = useRef<Runner | null>(null)
  const mounted = useRef(false)
  const running = useRef(false)
  const done = useRef(false)
  const closed = useRef(false)
  const body = useRef<HTMLDivElement>(null)
  const hasPreview = preview !== undefined

  // The preview's life: begun on open (Preview is on at first), ended on unmount.
  useEffect(() => {
    mounted.current = true
    if (!hasPreview) return () => {
      mounted.current = false
    }
    const report: Report = {
      status: (next) => mounted.current && setStatus(next),
      beginFailed: (error) => {
        if (!mounted.current) return
        setPreviewOn(false)
        // A failed OK's error stays in view when the preview cannot begin again after it.
        setNotice((shown) => shown ?? latest.current.labels.off(error))
      },
    }
    const current = previewRunner(() => latest.current.preview, report)
    runner.current = current
    current.begin()
    return () => {
      mounted.current = false
      runner.current = null
      void current.end()
    }
  }, [hasPreview])

  // A new draft updates the preview (the same draft drawn again does not).
  const key = draftKey(preview?.draft)
  const shownKey = useRef(key)
  useEffect(() => {
    if (Object.is(shownKey.current, key)) return
    shownKey.current = key
    runner.current?.change()
  }, [key])

  // Focus: the first field on open, Tab kept inside (when modal), and back to where it was on close.
  const trapsTab = useRef(modal)
  trapsTab.current = modal
  useLayoutEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const dialog = body.current?.closest<HTMLElement>('[role="dialog"]') ?? null
    const first = body.current ? focusables(body.current)[0] : undefined
    ;(first ?? dialog?.querySelector<HTMLElement>('.kui-dialog-actions .kui-button[data-variant="primary"]'))?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !dialog || !trapsTab.current) return
      const all = focusables(dialog)
      if (!all.length) return
      const active = document.activeElement
      if (event.shiftKey && (active === all[0] || !dialog.contains(active))) {
        event.preventDefault()
        all[all.length - 1].focus()
      } else if (!event.shiftKey && (active === all[all.length - 1] || !dialog.contains(active))) {
        event.preventDefault()
        all[0].focus()
      }
    }
    dialog?.addEventListener('keydown', onKey)
    return () => {
      dialog?.removeEventListener('keydown', onKey)
      // Only when the focus went nowhere else (lesson 2): never pull it from another field.
      const active = document.activeElement
      if ((!active || active === document.body || dialog?.contains(active)) && opener?.isConnected) opener.focus()
    }
  }, [])

  // Alt held turns Cancel into Reset.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => setAlt(event.type === 'keydown' ? event.altKey || event.key === 'Alt' : event.altKey && event.key !== 'Alt')
    const onBlur = () => setAlt(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  const cancel = useCallback(() => {
    // While OK runs, its outcome decides: the dialog closes, or stays open with the error.
    if (closed.current || running.current) return
    closed.current = true
    void runner.current?.end()
    latest.current.onCancel()
  }, [])

  const onEscape = useCallback(
    (event: KeyboardEvent) => {
      // A field that used Escape itself (to revert its text) keeps the dialog open.
      // So does an input method's Escape while it composes.
      if (!event.defaultPrevented && !composing(event)) cancel()
    },
    [cancel],
  )

  const ok = useCallback(async () => {
    const props = latest.current
    if (props.hideOk || props.okDisabled || running.current || done.current || closed.current) return
    running.current = true
    setBusy(true)
    const current = runner.current
    const wasOpen = current?.isOpen() ?? false
    try {
      if (!props.keepOpen) await current?.end()
      await props.onOk()
      if (!props.keepOpen) done.current = true
      if (mounted.current) setNotice(null)
    } catch (error) {
      if (mounted.current) setNotice(errorText(error))
      // The dialog stays open, so its preview shows again.
      if (!props.keepOpen && wasOpen && mounted.current && !closed.current && runner.current === current) current?.begin()
    } finally {
      running.current = false
      if (mounted.current) setBusy(false)
    }
  }, [])

  // Enter in a field asks for OK; it runs once the field's own Enter (a commit) has been drawn.
  useEffect(() => {
    if (okRequest) void ok()
  }, [okRequest, ok])

  const onKeyDownCapture = (event: ReactKeyboardEvent) => {
    if (event.key !== 'Enter' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || composing(event.nativeEvent)) return
    if (entersOk(event.target, body.current?.closest('[role="dialog"]'))) setOkRequest((count) => count + 1)
  }

  const togglePreview = (on: boolean) => {
    setPreviewOn(on)
    if (on) {
      setNotice(null)
      runner.current?.begin()
    } else {
      void runner.current?.end()
    }
  }

  const resets = alt && onReset !== undefined
  const onCancelClick = (event: ReactMouseEvent) => {
    if (onReset && (resets || event.altKey)) onReset()
    else cancel()
  }

  const shownStatus = preview?.status && preview.status !== 'idle' ? preview.status : status
  const statusLine =
    shownStatus === 'idle' ? null : shownStatus === 'pending' ? (
      <div className="kui-preview-status" data-status="pending" role="status" data-testid={`${testId}-status`}>
        {labels.pending}
      </div>
    ) : (
      <div className="kui-preview-status" data-status="error" role="alert" data-testid={`${testId}-status`}>
        {shownStatus.error}
      </div>
    )

  return (
    <Dialog
      title={title}
      onClose={cancel}
      onEscape={onEscape}
      modal={modal}
      uiId={uiId}
      testId={testId}
      position={position}
      onMove={onMove}
      actions={
        <>
          {preview ? (
            <label className="kui-checkbox kui-preview-toggle">
              <input type="checkbox" checked={previewOn} onChange={(event) => togglePreview(event.target.checked)} data-kit-ui-id={ids?.preview ?? 'control:dialog.preview'} data-testid={`${testId}-preview`} />
              {labels.preview}
            </label>
          ) : null}
          <Button onClick={onCancelClick} disabled={busy} data-kit-ui-id={ids?.cancel ?? 'control:dialog.cancel'} data-testid={`${testId}-cancel`}>
            {resets ? labels.reset : (cancelLabel ?? labels.cancel)}
          </Button>
          {hideOk ? null : (
            <Button variant="primary" disabled={okDisabled || busy} onClick={() => void ok()} data-kit-ui-id={ids?.ok ?? 'control:dialog.ok'} data-testid={`${testId}-ok`}>
              {okLabel ?? labels.ok}
            </Button>
          )}
        </>
      }
    >
      <div ref={body} className="kui-preview-fields" onKeyDownCapture={onKeyDownCapture}>
        {children}
      </div>
      {preview && previewOn && (preview.strip !== undefined || statusLine) ? (
        <div className="kui-preview-strip" data-testid={`${testId}-strip`}>
          {preview.strip}
          {statusLine}
        </div>
      ) : null}
      {notice ? (
        <div className="kui-dialog-notice" role="alert" data-testid={`${testId}-notice`}>
          {notice}
        </div>
      ) : null}
    </Dialog>
  )
}
