/**
 * Data display for product screens (consoles, settings, admin): a table with pagination, a
 * description list, tags, alerts, empty and result states, skeletons, avatars, breadcrumbs, and a
 * divider. Their APIs follow the shapes product teams know from Ant Design (`columns` and
 * `dataSource`, `items`), so screens move over without being rewritten; they draw only through the
 * theme tokens (styles.css, "Data display").
 */
import { useEffect, useMemo, useState, type CSSProperties, type HTMLAttributes, type Key, type ReactNode } from 'react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  CircleXIcon,
  InboxIcon,
  InfoIcon,
  TriangleAlertIcon,
  XIcon,
} from '@kition/tessera-icons/react'
import { useStrings } from './context'
import { ICON_STROKE, Spinner } from './ui'

function join(...names: (string | undefined | false)[]) {
  return names.filter(Boolean).join(' ')
}

/* Tag */

/** A status tone: `success` (done, active), `warning` (pending), `danger` (failed), `info` (in progress), `neutral`. */
export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

/** A short status or category label on a soft tint of its tone. */
export function Tag({ tone = 'neutral', className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return <span className={join('kui-tag', className)} data-tone={tone} {...props} />
}

/* Alert */

export type AlertProps = {
  tone?: Exclude<Tone, 'neutral'>
  title: ReactNode
  description?: ReactNode
  /** A button or link at the end (Retry, Upgrade). */
  action?: ReactNode
  /** Shows a close button that calls it. */
  onClose?: () => void
  className?: string
  testId?: string
}

const TONE_ICONS = { info: InfoIcon, success: CircleCheckIcon, warning: TriangleAlertIcon, danger: CircleXIcon } as const

/** A message in the page: what happened or what to know, in its tone, with an optional action. */
export function Alert({ tone = 'info', title, description, action, onClose, className, testId }: AlertProps) {
  const t = useStrings()
  const Icon = TONE_ICONS[tone]
  return (
    <div className={join('kui-alert', className)} data-tone={tone} role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'} data-testid={testId}>
      <Icon className="kui-alert-icon" size={16} strokeWidth={ICON_STROKE} aria-hidden="true" />
      <div className="kui-alert-text">
        <div className="kui-alert-title">{title}</div>
        {description ? <div className="kui-alert-description">{description}</div> : null}
      </div>
      {action ? <div className="kui-alert-action">{action}</div> : null}
      {onClose ? (
        <button type="button" className="kui-alert-close" aria-label={t('close')} onClick={onClose}>
          <XIcon size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}

/* Empty and Result */

export type EmptyProps = {
  title?: ReactNode
  description?: ReactNode
  /** Replaces the inbox drawing (an icon of the situation). */
  image?: ReactNode
  /** Actions under the text (Create, Retry). */
  children?: ReactNode
  className?: string
}

/** Nothing to show yet: a quiet drawing, what is missing, and what to do about it. */
export function Empty({ title, description, image, children, className }: EmptyProps) {
  const t = useStrings()
  return (
    <div className={join('kui-empty', className)}>
      <div className="kui-empty-image" aria-hidden="true">
        {image ?? <InboxIcon size={32} strokeWidth={ICON_STROKE} />}
      </div>
      <div className="kui-empty-title">{title ?? t('noData')}</div>
      {description ? <div className="kui-empty-description">{description}</div> : null}
      {children ? <div className="kui-empty-actions">{children}</div> : null}
    </div>
  )
}

export type ResultStatus = 'success' | 'info' | 'warning' | 'error' | 'forbidden' | 'notFound'

const RESULT_ICONS = { success: CircleCheckIcon, info: InfoIcon, warning: TriangleAlertIcon, error: CircleXIcon, forbidden: CircleAlertIcon, notFound: CircleAlertIcon } as const

/** The outcome of a whole page or flow (paid, access denied, page not found), with what to do next. */
export function Result({ status = 'info', title, description, extra, className }: { status?: ResultStatus; title: ReactNode; description?: ReactNode; extra?: ReactNode; className?: string }) {
  const Icon = RESULT_ICONS[status]
  return (
    <div className={join('kui-result', className)} data-status={status}>
      <Icon className="kui-result-icon" size={48} strokeWidth={ICON_STROKE} aria-hidden="true" />
      <h2 className="kui-result-title">{title}</h2>
      {description ? <p className="kui-result-description">{description}</p> : null}
      {extra ? <div className="kui-result-extra">{extra}</div> : null}
    </div>
  )
}

/* Skeleton */

/** A placeholder in the shape of content that is loading; `lines` draws a paragraph. */
export function Skeleton({ width, height = 16, lines, className }: { width?: number | string; height?: number | string; lines?: number; className?: string }) {
  if (lines && lines > 1) {
    return (
      <div className={join('kui-skeleton-lines', className)} aria-hidden="true">
        {Array.from({ length: lines }, (_, index) => (
          <span key={index} className="kui-skeleton" style={{ height, width: index === lines - 1 ? '60%' : '100%' }} />
        ))}
      </div>
    )
  }
  return <span className={join('kui-skeleton', className)} style={{ width, height }} aria-hidden="true" />
}

/* Avatar */

/** A person's picture, or their initial on a tint when there is none. */
export function Avatar({ src, name, size = 28, className }: { src?: string; name: string; size?: number; className?: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  return (
    <span className={join('kui-avatar', className)} style={{ width: size, height: size, fontSize: Math.round(size * 0.45) }} title={name}>
      {src ? <img src={src} alt={name} /> : <span aria-label={name}>{initial}</span>}
    </span>
  )
}

/* Breadcrumb */

export type BreadcrumbItem = { key?: Key; title: ReactNode }

/** Where the page sits: its parents (links in `title`) and then itself. */
export function Breadcrumb({ items, className }: { items: readonly BreadcrumbItem[]; className?: string }) {
  const t = useStrings()
  return (
    <nav className={join('kui-breadcrumb', className)} aria-label={t('breadcrumb')}>
      <ol>
        {items.map((item, index) => (
          <li key={item.key ?? index} aria-current={index === items.length - 1 ? 'page' : undefined}>
            {item.title}
            {index < items.length - 1 ? (
              <ChevronRightIcon className="kui-breadcrumb-separator" size={12} strokeWidth={ICON_STROKE} aria-hidden="true" />
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/* Divider */

/** A hairline between sections, with an optional label in it. */
export function Divider({ children, className }: { children?: ReactNode; className?: string }) {
  if (!children) return <hr className={join('kui-divider', className)} />
  return (
    <div className={join('kui-divider', className)} role="separator">
      <span>{children}</span>
    </div>
  )
}

/* Descriptions */

export type DescriptionItem = { key?: Key; label: ReactNode; children: ReactNode; /** Columns it spans. */ span?: number }

/** Labelled values of one record (an order, a user), laid out in `columns` columns. */
export function Descriptions({ items, columns = 3, title, className }: { items: readonly DescriptionItem[]; columns?: number; title?: ReactNode; className?: string }) {
  return (
    <section className={join('kui-descriptions', className)}>
      {title ? <h3 className="kui-descriptions-title">{title}</h3> : null}
      <dl style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {items.map((item, index) => (
          <div key={item.key ?? index} className="kui-descriptions-item" style={item.span ? { gridColumn: `span ${Math.min(item.span, columns)}` } : undefined}>
            <dt>{item.label}</dt>
            <dd>{item.children}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/* Pagination */

export type PaginationProps = {
  page: number
  pageSize: number
  total: number
  onChange: (page: number, pageSize: number) => void
  /** Offers these page sizes; without it the size is fixed. */
  pageSizeOptions?: readonly number[]
  className?: string
}

/** The pages of a long list: the range shown, page buttons, and an optional page size. */
export function Pagination({ page, pageSize, total, onChange, pageSizeOptions, className }: PaginationProps) {
  const t = useStrings()
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1
  const last = Math.min(total, page * pageSize)
  return (
    <nav className={join('kui-pagination', className)} aria-label={t('pagination')}>
      <span className="kui-pagination-range">{t('paginationRange', { first, last, total })}</span>
      <button type="button" className="kui-pagination-step" aria-label={t('previousPage')} disabled={page <= 1} onClick={() => onChange(page - 1, pageSize)}>
        <ChevronLeftIcon size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
      </button>
      {pageList(page, pages).map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} className="kui-pagination-gap" aria-hidden="true">
            …
          </span>
        ) : (
          <button key={item} type="button" className="kui-pagination-page" aria-current={item === page ? 'page' : undefined} aria-label={t('pageNumber', { page: item })} onClick={() => onChange(item, pageSize)}>
            {item}
          </button>
        ),
      )}
      <button type="button" className="kui-pagination-step" aria-label={t('nextPage')} disabled={page >= pages} onClick={() => onChange(page + 1, pageSize)}>
        <ChevronRightIcon size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
      </button>
      {pageSizeOptions && pageSizeOptions.length > 1 ? (
        <span className="kui-select" data-size="sm">
          <select aria-label={t('pageSize')} value={pageSize} onChange={(event) => onChange(1, Number(event.target.value))}>
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {t('perPage', { size })}
              </option>
            ))}
          </select>
        </span>
      ) : null}
    </nav>
  )
}

/** Page numbers to show: the first, the last, and the current one with its neighbours; `gap` between runs. */
export function pageList(page: number, pages: number): (number | 'gap')[] {
  const shown = new Set([1, pages, page - 1, page, page + 1].filter((item) => item >= 1 && item <= pages))
  const sorted = [...shown].sort((a, b) => a - b)
  const out: (number | 'gap')[] = []
  for (const item of sorted) {
    const previous = out[out.length - 1]
    if (typeof previous === 'number' && item - previous === 2) out.push(previous + 1)
    else if (typeof previous === 'number' && item - previous > 2) out.push('gap')
    out.push(item)
  }
  return out
}

/* Table */

export type TableColumn<T> = {
  key?: Key
  title?: ReactNode
  /** The record's field this column shows (a path for nested values); `render` receives it. */
  dataIndex?: string | readonly (string | number)[]
  render?: (value: any, record: T, index: number) => ReactNode
  width?: number | string
  align?: 'left' | 'center' | 'right'
  /** One line, cut with an ellipsis (the whole text shows on hover). */
  ellipsis?: boolean
  /** Stays in view while the table scrolls sideways. Give pinned columns a numeric `width`. */
  fixed?: 'left' | 'right'
  className?: string
}

export type TablePagination = { defaultPageSize?: number; pageSizeOptions?: readonly number[]; /** Offers `pageSizeOptions` (10, 20, 50, 100 by default). */ showSizeChanger?: boolean }

export type TableProps<T> = {
  columns: readonly TableColumn<T>[]
  dataSource: readonly T[] | undefined
  /** The field that identifies a record, or a function of it. */
  rowKey: string | ((record: T) => Key)
  loading?: boolean
  /** Pages of `defaultPageSize` rows (10 by default); `false` shows every row. */
  pagination?: TablePagination | false
  /** `small`: 36px rows for dense screens; `middle` (default): 44px. */
  size?: 'small' | 'middle'
  /** Shown when there are no rows (an `Empty`). */
  emptyText?: ReactNode
  /** Keeps the header in view while the page scrolls. */
  sticky?: boolean
  /** The table's least width; it scrolls sideways in a narrower container. */
  scrollX?: number | string
  onRow?: (record: T, index: number) => HTMLAttributes<HTMLTableRowElement>
  /** Caption above the table, for its accessible name. */
  caption?: ReactNode
  className?: string
  testId?: string
}

const DEFAULT_PAGE_SIZES = [10, 20, 50, 100] as const

/** The value at `path` in `record` (a field name or a path of names and indexes). */
export function valueAt(record: unknown, path: TableColumn<unknown>['dataIndex']): unknown {
  if (path === undefined) return undefined
  const steps = typeof path === 'string' ? [path] : path
  let value: unknown = record
  for (const step of steps) {
    if (value == null) return undefined
    value = (value as Record<string | number, unknown>)[step]
  }
  return value
}

/** Sticky offsets of pinned columns, from their numeric widths. */
function pinOffsets<T>(columns: readonly TableColumn<T>[]): (CSSProperties | undefined)[] {
  const offsets: (CSSProperties | undefined)[] = columns.map(() => undefined)
  let left = 0
  columns.forEach((column, index) => {
    if (column.fixed !== 'left') return
    offsets[index] = { left }
    left += typeof column.width === 'number' ? column.width : 0
  })
  let right = 0
  for (let index = columns.length - 1; index >= 0; index -= 1) {
    const column = columns[index]
    if (column.fixed !== 'right') continue
    offsets[index] = { right }
    right += typeof column.width === 'number' ? column.width : 0
  }
  return offsets
}

/**
 * Records in rows and columns: `columns` say what each shows (`dataIndex`, `render`), `dataSource`
 * holds the records. Pages through long lists, shows a spinner while loading and `emptyText` when
 * empty, and can pin columns and the header.
 */
export function Table<T>({ columns, dataSource, rowKey, loading, pagination, size = 'middle', emptyText, sticky, scrollX, onRow, caption, className, testId }: TableProps<T>) {
  const t = useStrings()
  const rows = dataSource ?? []
  const paged = pagination !== false
  const [pageSize, setPageSize] = useState(pagination ? (pagination.defaultPageSize ?? 10) : 10)
  const [page, setPage] = useState(1)
  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  // A shorter list (a filter, a delete) keeps the page inside it.
  useEffect(() => {
    if (page > pages) setPage(pages)
  }, [page, pages])
  const visible = paged ? rows.slice((Math.min(page, pages) - 1) * pageSize, Math.min(page, pages) * pageSize) : rows
  const offsets = useMemo(() => pinOffsets(columns), [columns])
  const keyOf = (record: T, index: number): Key => (typeof rowKey === 'function' ? rowKey(record) : ((record as Record<string, Key>)[rowKey] ?? index))
  const cellClass = (column: TableColumn<T>) => join(column.className, column.ellipsis && 'kui-table-ellipsis', column.fixed && 'kui-table-pinned')
  return (
    <div className={join('kui-table', className)} data-size={size} data-sticky={sticky || undefined} data-testid={testId}>
      <div className="kui-table-scroll" aria-busy={loading || undefined}>
        <table style={scrollX !== undefined ? { minWidth: scrollX } : undefined}>
          {caption ? <caption>{caption}</caption> : null}
          <colgroup>
            {columns.map((column, index) => (
              <col key={column.key ?? index} style={column.width !== undefined ? { width: column.width } : undefined} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={column.key ?? index} scope="col" className={cellClass(column)} style={{ textAlign: column.align, ...offsets[index] }} data-fixed={column.fixed}>
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr className="kui-table-empty">
                <td colSpan={columns.length}>{loading ? <div className="kui-table-placeholder" /> : (emptyText ?? <Empty />)}</td>
              </tr>
            ) : (
              visible.map((record, rowIndex) => {
                const index = paged ? (Math.min(page, pages) - 1) * pageSize + rowIndex : rowIndex
                return (
                  <tr key={keyOf(record, index)} {...onRow?.(record, index)}>
                    {columns.map((column, columnIndex) => {
                      const value = valueAt(record, column.dataIndex)
                      const content = column.render ? column.render(value, record, index) : (value as ReactNode)
                      return (
                        <td
                          key={column.key ?? columnIndex}
                          className={cellClass(column)}
                          style={{ textAlign: column.align, ...offsets[columnIndex] }}
                          data-fixed={column.fixed}
                          title={column.ellipsis && (typeof content === 'string' || typeof content === 'number') ? String(content) : undefined}
                        >
                          {content}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        {loading ? (
          <div className="kui-table-loading">
            <Spinner size={20} label={t('loading')} />
          </div>
        ) : null}
      </div>
      {paged && rows.length > pageSize ? (
        <Pagination
          page={Math.min(page, pages)}
          pageSize={pageSize}
          total={rows.length}
          pageSizeOptions={pagination && pagination.showSizeChanger ? (pagination.pageSizeOptions ?? DEFAULT_PAGE_SIZES) : undefined}
          onChange={(next, size) => {
            setPage(next)
            setPageSize(size)
          }}
        />
      ) : null}
    </div>
  )
}
