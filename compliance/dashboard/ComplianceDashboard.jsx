import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle, XCircle, TrendingUp, TrendingDown, Users, Shield, Activity, Globe, Clock, AlertTriangle } from 'lucide-react';

const ComplianceDashboard = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [activeTab, setActiveTab] = useState('overview');
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 12847,
    verifiedUsers: 10234,
    pendingKYC: 892,
    blockedUsers: 47,
    dailyTransactions: 3421,
    riskAlerts: 23,
    complianceRate: 98.7,
    avgRiskScore: 0.32
  });

  // Mock data for charts
  const riskTrendData = [
    { time: '00:00', low: 245, medium: 89, high: 12, critical: 2 },
    { time: '04:00', low: 267, medium: 92, high: 15, critical: 3 },
    { time: '08:00', low: 412, medium: 124, high: 23, critical: 5 },
    { time: '12:00', low: 523, medium: 156, high: 31, critical: 7 },
    { time: '16:00', low: 489, medium: 143, high: 28, critical: 6 },
    { time: '20:00', low: 378, medium: 108, high: 19, critical: 4 },
    { time: '24:00', low: 298, medium: 95, high: 14, critical: 3 }
  ];

  const jurisdictionData = [
    { name: 'United States', users: 4532, compliant: 4421 },
    { name: 'European Union', users: 3218, compliant: 3156 },
    { name: 'United Kingdom', users: 1847, compliant: 1823 },
    { name: 'Hong Kong', users: 1563, compliant: 1549 },
    { name: 'Singapore', users: 1287, compliant: 1273 },
    { name: 'Others', users: 400, compliant: 392 }
  ];

  const kycStatusData = [
    { name: 'Verified', value: 10234, color: '#10b981' },
    { name: 'Pending', value: 892, color: '#f59e0b' },
    { name: 'Expired', value: 234, color: '#ef4444' },
    { name: 'Not Started', value: 1487, color: '#6b7280' }
  ];

  const recentAlerts = [
    { id: 1, type: 'high-risk', user: '0x742d...3e8f', message: 'High-risk transaction pattern detected', time: '2 min ago', severity: 'critical' },
    { id: 2, type: 'sanctions', user: '0x9a1b...7c2d', message: 'Potential sanctions list match', time: '15 min ago', severity: 'high' },
    { id: 3, type: 'velocity', user: '0x3f4e...9d1a', message: 'Transaction velocity limit exceeded', time: '1 hour ago', severity: 'medium' },
    { id: 4, type: 'kyc-expired', user: '0x8b2c...4f6e', message: 'KYC verification expired', time: '3 hours ago', severity: 'low' },
    { id: 5, type: 'jurisdiction', user: '0x5d7a...2b9c', message: 'Access from restricted jurisdiction', time: '5 hours ago', severity: 'high' }
  ];

  const transactionVolume = [
    { hour: '0', volume: 125000, transactions: 89 },
    { hour: '4', volume: 98000, transactions: 67 },
    { hour: '8', volume: 234000, transactions: 156 },
    { hour: '12', volume: 456000, transactions: 289 },
    { hour: '16', volume: 523000, transactions: 334 },
    { hour: '20', volume: 378000, transactions: 245 },
    { hour: '24', volume: 189000, transactions: 123 }
  ];

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'medium': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'low': return <CheckCircle className="w-5 h-5 text-blue-600" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {change && (
          <span className={`text-sm font-medium flex items-center ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Compliance Dashboard</h1>
        <p className="text-gray-600">Real-time monitoring and compliance analytics for Yizhen platform</p>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6 flex gap-2">
        {['24h', '7d', '30d', '90d'].map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === range 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          change={12.5}
          icon={Users}
          color="text-blue-600"
        />
        <StatCard
          title="Verified Users"
          value={stats.verifiedUsers.toLocaleString()}
          change={8.3}
          icon={CheckCircle}
          color="text-green-600"
        />
        <StatCard
          title="Compliance Rate"
          value={`${stats.complianceRate}%`}
          change={2.1}
          icon={Shield}
          color="text-purple-600"
        />
        <StatCard
          title="Risk Alerts"
          value={stats.riskAlerts}
          change={-15.2}
          icon={AlertCircle}
          color="text-red-600"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {['overview', 'users', 'transactions', 'alerts', 'reports'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Score Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={riskTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
                labelStyle={{ color: '#111827', fontWeight: '600' }}
              />
              <Legend wrapperStyle={{ fontSize: '14px' }} />
              <Area type="monotone" dataKey="low" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.8} />
              <Area type="monotone" dataKey="medium" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.8} />
              <Area type="monotone" dataKey="high" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.8} />
              <Area type="monotone" dataKey="critical" stackId="1" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.8} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* KYC Status Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">KYC Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={kycStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {kycStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {kycStatusData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-medium text-gray-900">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Jurisdiction Compliance */}
      <div className="mt-6 bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Jurisdiction Compliance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={jurisdictionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Legend />
            <Bar dataKey="users" fill="#6366f1" name="Total Users" />
            <Bar dataKey="compliant" fill="#10b981" name="Compliant Users" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Alerts */}
      <div className="mt-6 bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Alerts</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
        </div>
        <div className="space-y-3">
          {recentAlerts.map(alert => (
            <div key={alert.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="flex items-start space-x-3">
                {getSeverityIcon(alert.severity)}
                <div>
                  <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">User: {alert.user} • {alert.time}</p>
                </div>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Review</button>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction Volume */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Volume</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={transactionVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="hour" stroke="#6b7280" fontSize={12} />
              <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={12} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="volume" stroke="#6366f1" strokeWidth={2} name="Volume ($)" />
              <Line yAxisId="right" type="monotone" dataKey="transactions" stroke="#10b981" strokeWidth={2} name="Count" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-between group">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">Run Compliance Report</span>
              </div>
              <span className="text-blue-600 group-hover:translate-x-1 transition-transform">→</span>
            </button>
            <button className="w-full text-left p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center justify-between group">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-900">Review Pending KYC</span>
              </div>
              <span className="text-purple-600 group-hover:translate-x-1 transition-transform">→</span>
            </button>
            <button className="w-full text-left p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-between group">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-gray-900">Investigate High Risk Users</span>
              </div>
              <span className="text-red-600 group-hover:translate-x-1 transition-transform">→</span>
            </button>
            <button className="w-full text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center justify-between group">
              <div className="flex items-center space-x-3">
                <Activity className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Update Risk Parameters</span>
              </div>
              <span className="text-green-600 group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-sm p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">System Status</h3>
            <p className="text-blue-100">All compliance systems operational</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold">99.95%</div>
              <div className="text-sm text-blue-100">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">2.1s</div>
              <div className="text-sm text-blue-100">Avg. Check Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">3.2%</div>
              <div className="text-sm text-blue-100">False Positive Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboard;
