import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, CreditCard, X, DollarSign, TrendingDown, History, Award, Wallet, ArrowDownRight } from 'lucide-react';
import Sidebar from "./Sidebar";
import './Dashboard.css';

const COLORS = ['#BCA89F', '#1C1917', '#A8A29E', '#44403C', '#E7E5E4', '#78716C'];

const formatNumber = (num, maxDecimals = 0) => {
  return Number(num || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals
  });
};

export default function Dashboard() {
  const [data, setData] = useState({
    kpis: {
      revenue: 0,
      profit: 0,
      payables: 0,
      totalCash: 0,
      totalBank: 0,
      totalBalance: 0,
      bankBalances: []
    },
    charts: { revenueTrend: [], topItems: [], categorySales: [] },
    recentSales: [],
    recentExpenses: []
  });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [chartFilter, setChartFilter] = useState('weekly');
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);

  const [isPnlModalOpen, setIsPnlModalOpen] = useState(false);
  const [pnlFilter, setPnlFilter] = useState('today');
  const [pnlViewMode, setPnlViewMode] = useState('profit');
  const [pnlData, setPnlData] = useState({ total_revenue: 0, total_cogs: 0, total_discounts_loss: 0, net_profit: 0 });
  const [pnlLoading, setPnlLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData(chartFilter);
  }, [chartFilter]);

  useEffect(() => {
    if (isPnlModalOpen) {
      fetchPnlData(pnlFilter);
    }
  }, [pnlFilter, isPnlModalOpen]);

  const fetchDashboardData = (filter) => {
    const token = localStorage.getItem('pos_token');
    fetch(`https://alifabrics-pos-backend-production.up.railway.app/api/dashboard/summary?filter=${filter}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(result => {
        if (result.error) {
          setFetchError(result.error);
        } else {
          setData(result);
        }
        setLoading(false);
      })
      .catch(err => {
        setFetchError("Failed to connect to the server.");
        setLoading(false);
      });
  };

  const fetchPnlData = (filter) => {
    setPnlLoading(true);
    const token = localStorage.getItem('pos_token');
    fetch(`https://alifabrics-pos-backend-production.up.railway.app/api/dashboard/pnl?filter=${filter}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(result => {
        if (!result.error) {
          setPnlData(result);
        }
        setPnlLoading(false);
      })
      .catch(err => {
        setPnlLoading(false);
      });
  };

  if (loading) {
    return <div className="loading-screen">Loading system metrics...</div>;
  }

  const maxMeters = data?.charts?.topItems?.length > 0
    ? Math.max(...data.charts.topItems.map(item => Number(item.total_meters)))
    : 1;

  const isProfit = (data?.kpis?.profit || 0) >= 0;

  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="dashboard-content">
        <header className="dashboard-header">
          <h1>Dashboard Overview</h1>
          <p>Real-time business performance indicators.</p>
          {fetchError && (
            <div className="error-banner">
              Error: {fetchError}
            </div>
          )}
        </header>

        <div className="kpi-grid">
          <KpiCard
            title="Today's Sale"
            value={`Rs. ${formatNumber(data?.kpis?.revenue)}`}
            icon={<DollarSign size={22} color="#1C1917" />}
            bgColor="#F5F5F5"
            onClick={() => setIsBalanceModalOpen(true)}
            isClickable={true}
          />
          <KpiCard
            title="Vendor Payables"
            value={`Rs. ${formatNumber(data?.kpis?.payables)}`}
            icon={<CreditCard size={22} color="#BCA89F" />}
            bgColor="#FAF8F7"
          />
          <KpiCard
            title={isProfit ? "Today's Profit" : "Today's Loss"}
            value={`Rs. ${formatNumber(Math.abs(data?.kpis?.profit || 0))}`}
            icon={isProfit ? <TrendingUp size={22} color="#10b981" /> : <TrendingDown size={22} color="#ef4444" />}
            bgColor={isProfit ? "#ecfdf5" : "#fef2f2"}
            valueColor={isProfit ? "#10b981" : "#ef4444"}
            onClick={() => { setPnlViewMode(isProfit ? 'profit' : 'loss'); setPnlFilter('today'); setIsPnlModalOpen(true); }}
            isClickable={true}
          />
        </div>

        <div className="charts-row">
          <div className="chart-container">
            <div className="chart-header-row">
              <h2>Revenue & Profit Trend</h2>
              <select
                className="filter-dropdown"
                value={chartFilter}
                onChange={(e) => setChartFilter(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="weekly">7 Days</option>
                <option value="monthly">30 Days</option>
                <option value="yearly">1 Year</option>
              </select>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.charts?.revenueTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                  <XAxis dataKey="date" tick={{ fill: '#78716C', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#78716C', fontSize: 12 }} width={80} tickFormatter={(tick) => formatNumber(tick)} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#1C1917', color: '#fff', borderRadius: '8px', border: 'none' }}
                    formatter={(value) => `Rs. ${formatNumber(value)}`}
                  />
                  <Line type="monotone" dataKey="daily_revenue" stroke="#1C1917" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Revenue" />
                  <Line type="monotone" dataKey="daily_profit" stroke="#BCA89F" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Profit" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-container">
            <div className="chart-header-row">
              <h2>Sales by Category</h2>
            </div>
            <div className="chart-wrapper pie-wrapper">
              {data?.charts?.categorySales && data.charts.categorySales.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.charts.categorySales.map(item => ({ ...item, value: Number(item.value) }))}
                      cx="50%"
                      cy="45%"
                      innerRadius="50%"
                      outerRadius="80%"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.charts.categorySales.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#1C1917', color: '#fff', borderRadius: '8px', border: 'none' }}
                      formatter={(value) => `Rs. ${formatNumber(value)}`}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="empty-state" style={{ marginTop: '40px' }}>No category data available.</p>
              )}
            </div>
          </div>
        </div>

        <div className="bottom-section">
          <div className="top-items-container">
            <div className="top-items-header">
              <Award size={20} color="#BCA89F" />
              <h2>Top Selling Fabrics</h2>
            </div>
            <div className="top-items-list">
              {data?.charts?.topItems && data.charts.topItems.length > 0 ? (
                data.charts.topItems.map((item, index) => (
                  <div className="top-item-minimal" key={index}>
                    <div className="top-item-minimal-info">
                      <span className="top-item-minimal-name">{index + 1}. {item.name}</span>
                      <span className="top-item-minimal-value">{formatNumber(item.total_meters, 2)}m</span>
                    </div>
                    <div className="top-item-minimal-bar-bg">
                      <div
                        className="top-item-minimal-bar-fill"
                        style={{ width: `${(Number(item.total_meters) / maxMeters) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state">No sales data yet.</p>
              )}
            </div>
          </div>

          <div className="feed-column">
            <div className="history-container">
              <div className="history-header">
                <History size={20} color="#78716C" />
                <h2>Recent Sales History</h2>
              </div>
              <div className="table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Sale ID</th>
                      <th>Date & Time</th>
                      <th>Gross Amount</th>
                      <th>Discount Allowed</th>
                      <th>Net Collected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.recentSales && data.recentSales.map((sale) => (
                      <tr key={sale.id}>
                        <td className="sale-id">#{sale.id}</td>
                        <td>{new Date(sale.sale_date).toLocaleString()}</td>
                        <td>Rs. {formatNumber(sale.total_amount)}</td>
                        <td className="discount-text">-Rs. {formatNumber(sale.discount)}</td>
                        <td className="net-total-text">Rs. {formatNumber(sale.net_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="history-container">
              <div className="history-header">
                <ArrowDownRight size={20} color="#ef4444" />
                <h2>Recent Vendor Payments</h2>
              </div>
              <div className="table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Date</th>
                      <th>Vendor</th>
                      <th>Method</th>
                      <th>Amount Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.recentExpenses && data.recentExpenses.length > 0 ? data.recentExpenses.map((expense) => (
                      <tr key={expense.id}>
                        <td className="sale-id">#{expense.id}</td>
                        <td>{new Date(expense.payment_date).toLocaleDateString()}</td>
                        <td>{expense.vendor_name}</td>
                        <td>{expense.method}</td>
                        <td className="discount-text">Rs. {formatNumber(expense.amount)}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5" className="empty-state" style={{ padding: '24px 0' }}>No recent payments.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isBalanceModalOpen && (
        <div className="modal-overlay" onClick={() => setIsBalanceModalOpen(false)}>
          <div className="modal-content balance-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Fund Distribution</h2>
              <button className="close-btn" onClick={() => setIsBalanceModalOpen(false)}>
                <X size={20} color="#78716C" />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #E2E8F0' }}>
                <p style={{ color: '#78716C', margin: '0 0 4px 0', fontSize: '14px' }}>Total System Balance</p>
                <h1 style={{ color: '#1C1917', margin: 0, fontSize: '32px' }}>
                  Rs. {formatNumber(data?.kpis?.totalBalance)}
                </h1>
              </div>
              <div className="balance-breakdown">
                <div className="balance-item">
                  <div className="balance-icon cash-icon">
                    <DollarSign size={24} color="#1C1917" />
                  </div>
                  <div className="balance-details" style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="balance-label">Cash in Hand</span>
                      <span className="balance-amount">Rs. {formatNumber(data?.kpis?.totalCash)}</span>
                    </div>
                  </div>
                </div>

                <div className="balance-item" style={{ alignItems: 'flex-start' }}>
                  <div className="balance-icon bank-icon">
                    <CreditCard size={24} color="#1C1917" />
                  </div>
                  <div className="balance-details" style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="balance-label">Total Bank Balance</span>
                      <span className="balance-amount">Rs. {formatNumber(data?.kpis?.totalBank)}</span>
                    </div>

                    {data?.kpis?.bankBalances && data.kpis.bankBalances.length > 0 && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {data.kpis.bankBalances.map((bank, index) => (
                          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                            <span style={{ color: '#475569' }}>{bank.bank_name} <span style={{ fontSize: '12px', color: '#94A3B8' }}>({bank.account_title})</span></span>
                            <span style={{ fontWeight: 600, color: '#0F172A' }}>Rs. {formatNumber(bank.balance)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPnlModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPnlModalOpen(false)}>
          <div className="modal-content pnl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{pnlViewMode === 'profit' ? 'Profit Report' : 'Loss Report'}</h2>
              <select
                className="filter-dropdown"
                value={pnlFilter}
                onChange={(e) => setPnlFilter(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="weekly">This Week</option>
                <option value="monthly">This Month</option>
                <option value="yearly">This Year</option>
              </select>
              <button className="close-btn" onClick={() => setIsPnlModalOpen(false)}>
                <X size={20} color="#78716C" />
              </button>
            </div>
            <div className="modal-body pnl-body">
              {pnlLoading ? (
                <p className="empty-state">Calculating...</p>
              ) : (
                <div className="pnl-simple-grid">
                  {pnlViewMode === 'profit' && (
                    <div className="pnl-simple-card profit-card">
                      <span className="pnl-label">Net Profit</span>
                      <span className={`pnl-amount ${pnlData.net_profit >= 0 ? 'text-green' : 'text-red'}`}>
                        Rs. {formatNumber(pnlData.net_profit)}
                      </span>
                    </div>
                  )}
                  {pnlViewMode === 'loss' && (
                    <div className="pnl-simple-card loss-card">
                      <span className="pnl-label">Loss (Discounts)</span>
                      <span className="pnl-amount text-red">
                        Rs. {formatNumber(pnlData.total_discounts_loss)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const KpiCard = ({ title, value, icon, bgColor, onClick, isClickable, valueColor }) => (
  <div
    className={`kpi-card ${isClickable ? 'clickable' : ''}`}
    onClick={onClick}
  >
    <div className="kpi-info">
      <p>{title}</p>
      <h3 style={{ color: valueColor || '#1C1917' }}>{value}</h3>
    </div>
    <div className="kpi-icon" style={{ backgroundColor: bgColor }}>
      {icon}
    </div>
  </div>
);