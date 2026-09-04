import { supabase } from './supabase'

export const PAGE_SIZE = 50
export const COMPARISON_FETCH_LIMIT = 5000

const SELECT_COLUMNS =
  'id, vendor_name, maker, part_no, item_name, quantity, unit, unit_price, amount, invoice_date'

const COMPARISON_SELECT_COLUMNS = 'vendor_name, maker, part_no, item_name, unit_price, invoice_date'

export async function fetchInvoiceLines({
  itemName,
  maker,
  partNo,
  vendorName,
  dateFrom,
  dateTo,
  sortBy,
  sortOrder,
  page,
}) {
  let query = supabase
    .from('shared_invoice_lines')
    .select(SELECT_COLUMNS, { count: 'exact' })

  if (itemName) query = query.ilike('item_name', `%${itemName}%`)
  if (maker) query = query.ilike('maker', `%${maker}%`)
  if (partNo) query = query.ilike('part_no', `%${partNo}%`)
  if (vendorName) query = query.ilike('vendor_name', `%${vendorName}%`)
  if (dateFrom) query = query.gte('invoice_date', dateFrom)
  if (dateTo) query = query.lte('invoice_date', dateTo)

  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw error
  return { rows: data ?? [], total: count ?? 0 }
}

// 価格比較（品目名・メーカー・型番でのグループ化）用に、絞り込み条件に合う行をまとめて取得する
export async function fetchInvoiceLinesForComparison({
  itemName,
  maker,
  partNo,
  vendorName,
  dateFrom,
  dateTo,
}) {
  let query = supabase.from('shared_invoice_lines').select(COMPARISON_SELECT_COLUMNS)

  if (itemName) query = query.ilike('item_name', `%${itemName}%`)
  if (maker) query = query.ilike('maker', `%${maker}%`)
  if (partNo) query = query.ilike('part_no', `%${partNo}%`)
  if (vendorName) query = query.ilike('vendor_name', `%${vendorName}%`)
  if (dateFrom) query = query.gte('invoice_date', dateFrom)
  if (dateTo) query = query.lte('invoice_date', dateTo)

  query = query.order('invoice_date', { ascending: false }).limit(COMPARISON_FETCH_LIMIT)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}
