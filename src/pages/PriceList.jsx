import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PriceTabs from '../components/PriceTabs'
import { fetchInvoiceLines, PAGE_SIZE } from '../lib/priceQueries'

const EMPTY_FILTERS = {
  itemName: '',
  maker: '',
  partNo: '',
  vendorName: '',
  dateFrom: '',
  dateTo: '',
}

export default function PriceList() {
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS)
  const [sort, setSort] = useState({ by: 'invoice_date', order: 'desc' })
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchInvoiceLines({
        ...appliedFilters,
        sortBy: sort.by,
        sortOrder: sort.order,
        page,
      })
      setRows(result.rows)
      setTotal(result.total)
    } catch (e) {
      console.error('単価表データの取得に失敗しました:', e)
      setError('データの取得に失敗しました。時間をおいて再度お試しください。')
    } finally {
      setLoading(false)
    }
  }, [appliedFilters, sort, page])

  useEffect(() => {
    load()
  }, [load])

  function handleSearch(e) {
    e.preventDefault()
    setPage(0)
    setAppliedFilters(filters)
  }

  function handleReset() {
    setFilters(EMPTY_FILTERS)
    setAppliedFilters(EMPTY_FILTERS)
    setPage(0)
  }

  function toggleSort(column) {
    setPage(0)
    setSort((prev) =>
      prev.by === column
        ? { by: column, order: prev.order === 'asc' ? 'desc' : 'asc' }
        : { by: column, order: 'asc' },
    )
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="price-list-page">
      <header className="price-list-header">
        <h1>単価表</h1>
        <Link to="/">ダッシュボードへ戻る</Link>
      </header>

      <PriceTabs />

      <form className="price-filters" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="品目名で検索"
          value={filters.itemName}
          onChange={(e) => setFilters((f) => ({ ...f, itemName: e.target.value }))}
        />
        <input
          type="text"
          placeholder="メーカーで検索"
          value={filters.maker}
          onChange={(e) => setFilters((f) => ({ ...f, maker: e.target.value }))}
        />
        <input
          type="text"
          placeholder="型式・品番で検索"
          value={filters.partNo}
          onChange={(e) => setFilters((f) => ({ ...f, partNo: e.target.value }))}
        />
        <input
          type="text"
          placeholder="業者名で検索"
          value={filters.vendorName}
          onChange={(e) => setFilters((f) => ({ ...f, vendorName: e.target.value }))}
        />
        <label className="date-field">
          期間(from)
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
          />
        </label>
        <label className="date-field">
          期間(to)
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
          />
        </label>
        <button type="submit">検索</button>
        <button type="button" onClick={handleReset}>
          条件クリア
        </button>
      </form>

      <p className="price-list-note">
        業者ごとに型式・品番の記載方法が異なるため、同一部品の自動判定は行っていません。品目名・メーカーで検索し、目視で比較してください。
      </p>

      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <p>読み込み中...</p>
      ) : rows.length === 0 ? (
        <p>該当するデータがありません。</p>
      ) : (
        <>
          <table className="price-table">
            <thead>
              <tr>
                <SortableHeader label="請求日" column="invoice_date" sort={sort} onSort={toggleSort} />
                <th>業者名</th>
                <th>メーカー</th>
                <th>型式・品番</th>
                <th>品目名</th>
                <SortableHeader label="単価" column="unit_price" sort={sort} onSort={toggleSort} />
                <th>数量</th>
                <th>単位</th>
                <th>金額</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.invoice_date}</td>
                  <td>{row.vendor_name}</td>
                  <td>{row.maker}</td>
                  <td>{row.part_no}</td>
                  <td>{row.item_name}</td>
                  <td className="num">{formatNumber(row.unit_price)}</td>
                  <td className="num">{formatNumber(row.quantity)}</td>
                  <td>{row.unit}</td>
                  <td className="num">{formatNumber(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="price-pagination">
            <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              前へ
            </button>
            <span>
              {page + 1} / {totalPages}（全{total}件）
            </span>
            <button
              type="button"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              次へ
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function SortableHeader({ label, column, sort, onSort }) {
  const active = sort.by === column
  return (
    <th className="sortable" onClick={() => onSort(column)}>
      {label}
      {active ? (sort.order === 'asc' ? ' ▲' : ' ▼') : ''}
    </th>
  )
}

function formatNumber(value) {
  if (value === null || value === undefined) return ''
  return Number(value).toLocaleString('ja-JP')
}
