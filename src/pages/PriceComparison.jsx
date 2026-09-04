import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PriceTabs from '../components/PriceTabs'
import { fetchInvoiceLinesForComparison, COMPARISON_FETCH_LIMIT } from '../lib/priceQueries'
import { buildComparisonGroups, collectVendorNames } from '../lib/priceNormalization'

const EMPTY_FILTERS = {
  itemName: '',
  maker: '',
  partNo: '',
  vendorName: '',
  dateFrom: '',
  dateTo: '',
}

export default function PriceComparison() {
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS)
  const [groups, setGroups] = useState([])
  const [truncated, setTruncated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchInvoiceLinesForComparison(appliedFilters)
      setTruncated(rows.length >= COMPARISON_FETCH_LIMIT)
      setGroups(buildComparisonGroups(rows))
    } catch (e) {
      console.error('価格比較データの取得に失敗しました:', e)
      setError('データの取得に失敗しました。時間をおいて再度お試しください。')
    } finally {
      setLoading(false)
    }
  }, [appliedFilters])

  useEffect(() => {
    load()
  }, [load])

  function handleSearch(e) {
    e.preventDefault()
    setAppliedFilters(filters)
  }

  function handleReset() {
    setFilters(EMPTY_FILTERS)
    setAppliedFilters(EMPTY_FILTERS)
  }

  // 業者名を列見出しにした「単価一覧」形式（品目名・メーカー・型番 × 業者ごとの単価）
  const vendorNames = useMemo(() => collectVendorNames(groups), [groups])

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
        品目名・メーカー・型番が完全一致する行を業者ごとの列にまとめ、行内で最安の単価を強調表示しています（表記ゆれは自動補正済み）。
        業者ごとに型番の付け方が異なる場合、同一部品でも別の行として扱われることがあります。
        校正費・返品などの行は比較対象から自動で除外しています。
      </p>

      {truncated && (
        <p className="warning-message">
          該当件数が多いため、直近{COMPARISON_FETCH_LIMIT.toLocaleString('ja-JP')}件までで集計しています。絞り込み条件を指定してください。
        </p>
      )}

      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <p>読み込み中...</p>
      ) : groups.length === 0 ? (
        <p>該当するデータがありません。</p>
      ) : (
        <div className="pivot-table-wrap">
          <table className="price-table pivot-table">
            <thead>
              <tr>
                <th>品目名</th>
                <th>メーカー</th>
                <th>型式・品番</th>
                {vendorNames.map((vendorName) => (
                  <th key={vendorName}>{vendorName}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={`${group.category} ${group.maker} ${group.partNo}`}>
                  <td title={group.remark || undefined}>{group.category}</td>
                  <td>{group.maker}</td>
                  <td className={group.suspectedOrderNo ? 'suspect' : ''}>{group.partNo}</td>
                  {vendorNames.map((vendorName) => {
                    const entry = group.priceByVendor.get(vendorName)
                    const isCheapest = vendorName === group.minVendor
                    return (
                      <td
                        key={vendorName}
                        className={`num${isCheapest ? ' cheapest' : ''}`}
                        title={entry?.invoice_date ?? undefined}
                      >
                        {entry ? formatNumber(entry.unit_price) : '-'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function formatNumber(value) {
  if (value === null || value === undefined) return ''
  return Number(value).toLocaleString('ja-JP')
}
