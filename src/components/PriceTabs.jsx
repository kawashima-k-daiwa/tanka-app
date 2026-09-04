import { NavLink } from 'react-router-dom'

export default function PriceTabs() {
  return (
    <nav className="price-tabs">
      <NavLink to="/prices" end className={({ isActive }) => (isActive ? 'active' : '')}>
        明細一覧
      </NavLink>
      <NavLink to="/prices/compare" className={({ isActive }) => (isActive ? 'active' : '')}>
        価格比較
      </NavLink>
    </nav>
  )
}
