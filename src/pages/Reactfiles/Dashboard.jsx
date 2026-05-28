import '../CSS/Dashboard.css'
import { useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Sidebar } from '../../components/Sidebar'
import { useSessionExpiry } from '../../hooks/useSessionExpiry'
import { useBusinessData } from '../../hooks/useBusinessData'

export function Dashboard() {
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), [])
  useSessionExpiry(30)

  const { sales, reminders, loading } = useBusinessData(user.id)

  const today = new Date().toLocaleDateString()

  const { todaySales, todayProfit, totalProfit, totalRevenue, chartData, hasData } = useMemo(() => {
    const todaySales = sales.filter(s => s.date === today)
    const todayProfit = todaySales.reduce((sum, s) => sum + (s.profit || 0), 0)
    const totalProfit = sales.reduce((sum, s) => sum + (s.profit || 0), 0)
    const totalRevenue = sales.reduce((sum, s) => sum + (s.total_earned || 0), 0)
    const hasData = sales.length > 0

    const chartMap = {}
    sales.forEach(s => {
      if (!chartMap[s.date]) chartMap[s.date] = { date: s.date, profit: 0, revenue: 0 }
      chartMap[s.date].profit += s.profit || 0
      chartMap[s.date].revenue += s.total_earned || 0
    })
    const chartData = Object.values(chartMap).slice(-14)

    return { todaySales, todayProfit, totalProfit, totalRevenue, chartData, hasData }
  }, [sales, today])

  if (loading) return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content-area">
        <div style={styles.loadingWrap}>
          <div style={styles.loadingSpinner} />
          <p style={styles.loadingText}>Loading dashboard...</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content-area">

        {/* TOPBAR */}
        <header style={styles.topbar}>
          <div>
            <h2 style={styles.pageTitle}>Dashboard</h2>
            <p style={styles.pageSubtitle}>Welcome back, <strong style={{ color: '#fff' }}>{user.name}</strong></p>
          </div>
          <div style={styles.dateBadge}>
            {new Date().toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })}
          </div>
        </header>

        {/* REMINDERS */}
        {reminders.length > 0 && (
          <div style={styles.reminderBanner}>
            <span style={styles.reminderIcon}>🔔</span>
            <div>
              <p style={styles.reminderTitle}>Reminders</p>
              {reminders.map((r, i) => (
                <p key={i} style={styles.reminderItem}>• {r.reminder}</p>
              ))}
            </div>
          </div>
        )}

        {/* STAT CARDS */}
        <div style={styles.cardGrid}>
          <StatCard
            label="Today's Profit"
            value={`KES ${todayProfit.toLocaleString()}`}
            sub={todaySales.length > 0 ? `${todaySales.length} sale${todaySales.length !== 1 ? 's' : ''} today` : 'No sales today'}
            accent={todayProfit >= 0 ? '#10B981' : '#ff4444'}
            icon="📊"
          />
          <StatCard
            label="All-Time Profit"
            value={`KES ${totalProfit.toLocaleString()}`}
            sub={`Revenue: KES ${totalRevenue.toLocaleString()}`}
            accent={totalProfit >= 0 ? '#10B981' : '#ff4444'}
            icon="💰"
          />
          <StatCard
            label="Total Transactions"
            value={sales.length}
            sub="all time"
            accent="#3b82f6"
            icon="🧾"
          />
          <StatCard
            label="Today's Sales"
            value={todaySales.length}
            sub={todaySales.length > 0 ? `KES ${todaySales.reduce((s, x) => s + (x.total_earned || 0), 0).toLocaleString()} revenue` : 'No sales recorded'}
            accent="#a78bfa"
            icon="🛒"
          />
        </div>

        {/* CHART OR EMPTY STATE */}
        {hasData ? (
          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <h3 style={styles.chartTitle}>Profit Trend</h3>
              <span style={styles.chartSub}>Last 14 days</span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={60} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '13px' }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(val) => [`KES ${val.toLocaleString()}`, undefined]}
                />
                <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} name="Profit" dot={false} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={1.5} name="Revenue" dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
            <div style={styles.chartLegend}>
              <span style={{ ...styles.legendDot, background: '#10B981' }} /> Profit &nbsp;&nbsp;
              <span style={{ ...styles.legendDot, background: '#3b82f6' }} /> Revenue
            </div>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📈</div>
            <p style={styles.emptyTitle}>No sales data yet</p>
            <p style={styles.emptyText}>Record your first sale to start seeing your profit trends here.</p>
          </div>
        )}

        {/* PROFIT SUMMARY — only shown when there is actual data */}
        {hasData && (
          <div style={{
            ...styles.summaryBanner,
            background: totalProfit >= 0 ? '#0d2b1f' : '#2b0d0d',
            borderColor: totalProfit >= 0 ? '#10B981' : '#ff4444',
          }}>
            <span style={{ fontSize: '18px', marginRight: '10px' }}>
              {totalProfit >= 0 ? '✅' : '⚠️'}
            </span>
            <p style={{ color: totalProfit >= 0 ? '#10B981' : '#ff4444', margin: 0, fontSize: '14px' }}>
              {totalProfit >= 0 ? (
                <><strong>Your business is profitable!</strong> Total profit of KES {totalProfit.toLocaleString()}
                  {todayProfit > 0 && ` — KES ${todayProfit.toLocaleString()} earned today.`}</>
              ) : (
                <><strong>Costs are exceeding revenue.</strong> Review your stock costs and operational expenses.</>
              )}
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <p style={styles.cardLabel}>{label}</p>
        <span style={{ fontSize: '20px' }}>{icon}</span>
      </div>
      <p style={{ ...styles.cardValue, color: accent }}>{value}</p>
      <p style={styles.cardSub}>{sub}</p>
      <div style={{ ...styles.cardAccentBar, background: accent }} />
    </div>
  )
}

const styles = {
  topbar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '28px', paddingBottom: '20px',
    borderBottom: '1px solid #1e293b',
  },
  pageTitle: { fontSize: '22px', fontWeight: '700', color: '#f1f5f9', margin: 0 },
  pageSubtitle: { fontSize: '13px', color: '#64748b', margin: '4px 0 0', fontWeight: 400 },
  dateBadge: {
    background: '#1e293b', color: '#94a3b8', fontSize: '12px',
    padding: '6px 12px', borderRadius: '20px', fontWeight: '500',
  },
  loadingWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '60vh', gap: '16px',
  },
  loadingSpinner: {
    width: '32px', height: '32px', borderRadius: '50%',
    border: '3px solid #1e293b', borderTop: '3px solid #10B981',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: { color: '#64748b', fontSize: '14px', margin: 0 },
  reminderBanner: {
    display: 'flex', gap: '12px', alignItems: 'flex-start',
    background: '#1a1500', border: '1px solid #78350f',
    borderRadius: '12px', padding: '14px 16px', marginBottom: '24px',
  },
  reminderIcon: { fontSize: '18px', flexShrink: 0, marginTop: '1px' },
  reminderTitle: { color: '#FFA500', fontWeight: '600', fontSize: '13px', margin: '0 0 6px' },
  reminderItem: { color: '#94a3b8', fontSize: '13px', margin: '2px 0' },
  cardGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px', marginBottom: '24px',
  },
  card: {
    background: '#0f172a', border: '1px solid #1e293b',
    borderRadius: '14px', padding: '18px 20px', position: 'relative', overflow: 'hidden',
  },
  cardLabel: {
    color: '#64748b', fontSize: '11px', fontWeight: '600',
    letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0,
  },
  cardValue: { fontSize: '26px', fontWeight: '700', margin: '6px 0 4px', letterSpacing: '-0.5px' },
  cardSub: { color: '#475569', fontSize: '12px', margin: 0 },
  cardAccentBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', opacity: 0.5 },
  chartCard: {
    background: '#0f172a', border: '1px solid #1e293b',
    borderRadius: '14px', padding: '20px 20px 12px', marginBottom: '24px',
  },
  chartHeader: { display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '16px' },
  chartTitle: { color: '#f1f5f9', fontSize: '15px', fontWeight: '600', margin: 0 },
  chartSub: { color: '#475569', fontSize: '12px' },
  chartLegend: {
    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
    fontSize: '12px', color: '#475569', marginTop: '8px',
  },
  legendDot: {
    display: 'inline-block', width: '8px', height: '8px',
    borderRadius: '50%', marginRight: '4px',
  },
  emptyState: {
    background: '#0f172a', border: '1px dashed #1e293b',
    borderRadius: '14px', padding: '48px 24px', marginBottom: '24px', textAlign: 'center',
  },
  emptyIcon: { fontSize: '40px', marginBottom: '12px' },
  emptyTitle: { color: '#f1f5f9', fontSize: '16px', fontWeight: '600', margin: '0 0 8px' },
  emptyText: {
    color: '#475569', fontSize: '13px', margin: '0 auto',
    maxWidth: '320px', lineHeight: '1.6',
  },
  summaryBanner: {
    display: 'flex', alignItems: 'flex-start', gap: '4px',
    border: '1px solid', borderRadius: '12px',
    padding: '14px 16px', marginBottom: '24px',
  },
}