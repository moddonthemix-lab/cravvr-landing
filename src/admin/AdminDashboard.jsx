import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  fetchWaitlistEntries,
  updateWaitlistEntry,
  updateWaitlistEntries,
  deleteWaitlistEntry,
  insertWaitlistEntry,
  fetchAdminUsers,
  updateAdminUserProfile,
  deleteAdminUser,
  fetchAdminAllOrders,
  fetchAdminCustomersForTestOrder,
  fetchAdminTrucksForTestOrder,
  fetchTruckAvailableMenuSample,
  createAdminTestOrder,
  fetchAdminDashboardStats,
  fetchProfileNamesByIds,
  fetchTruckNamesByIds,
} from '../services/admin';
import { useAuth } from '../components/auth/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Icons } from '../components/common/Icons';
import LoadingSplash from '../components/common/LoadingSplash';
import MarketingPage from '../components/admin/MarketingPage';
import PlaybookPage from '../components/admin/PlaybookPage';
import { DashboardTabBar } from '@/components/ui/dashboard-sidebar';
import AdminNavBar from '../components/admin/AdminNavBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// Chart colors
const CHART_COLORS = ['#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#fecdd3'];

// AdminLogin shim — Clerk owns the actual sign-in flow now. RequireAdmin
// upstream of this dashboard redirects unauthenticated users to home and
// opens Clerk's modal via openAuth(). This fallback is reached only if the
// guard is bypassed; we just kick the user back through the same path.
const AdminLogin = () => {
  const { openAuth } = useAuth();
  React.useEffect(() => { openAuth('login'); }, [openAuth]);
  return <LoadingSplash size="full" tagline="REDIRECTING" />;
};

// Dashboard Overview Component with REAL data
const DashboardOverview = ({ stats, recentActivity, chartData, loading, onRefresh }) => {
  const statCards = [
    { label: 'Total Users', value: stats.totalUsers?.toLocaleString() || '0', change: 'All time', trend: 'neutral', icon: Icons.users },
    { label: 'Food Trucks', value: stats.totalTrucks?.toLocaleString() || '0', change: 'Registered', trend: 'neutral', icon: Icons.trucks },
    { label: 'Total Reviews', value: stats.totalReviews?.toLocaleString() || '0', change: 'All time', trend: 'neutral', icon: Icons.star },
    { label: 'Check-ins', value: stats.totalCheckIns?.toLocaleString() || '0', change: 'All time', trend: 'neutral', icon: Icons.orders },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading} className="gap-2 shrink-0">
          <span className="h-4 w-4">{Icons.refresh}</span>
          {loading ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((stat, index) => (
          <div key={index} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0"><span className="h-5 w-5">{stat.icon}</span></div>
            <div className="min-w-0 flex flex-col">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <span className={cn('text-2xl font-bold tracking-tight tabular-nums leading-tight', loading && 'opacity-60')}>{stat.value}</span>
              <span className="text-xs text-muted-foreground mt-0.5">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row - Using Real Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Activity (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
          {chartData.dailyActivity.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.dailyActivity}>
                <defs>
                  <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="checkIns" stroke="#e11d48" strokeWidth={2} fill="url(#colorActivity)" name="Check-ins" />
                <Area type="monotone" dataKey="reviews" stroke="#3b82f6" strokeWidth={2} fill="transparent" name="Reviews" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground text-center">
              <p>No activity data yet. Data will appear as users interact with the app.</p>
            </div>
          )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Trucks by Cuisine</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
          {chartData.cuisineBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={chartData.cuisineBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                  {chartData.cuisineBreakdown.map((entry, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Trucks']} contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground text-center">
              <p>No food trucks registered yet.</p>
            </div>
          )}
          </CardContent>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">User Registrations (Last 12 Months)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
          {chartData.userGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="users" fill="#e11d48" radius={[4, 4, 0, 0]} name="New Users" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground text-center">
              <p>No user registration data yet.</p>
            </div>
          )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">User Types</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
          {chartData.userTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={chartData.userTypes} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {chartData.userTypes.map((entry, index) => (
                    <Cell key={index} fill={index === 0 ? '#e11d48' : '#3b82f6'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground text-center">
              <p>No users registered yet.</p>
            </div>
          )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="overflow-hidden mb-6">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Activity ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Food Truck</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
              <tr key={activity.id || index} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium tabular-nums">#{activity.id?.slice(0, 8) || `ACT-${index + 1}`}</td>
                <td className="px-4 py-3">{activity.customer_name || 'Guest'}</td>
                <td className="px-4 py-3">{activity.truck_name || 'Unknown'}</td>
                <td className="px-4 py-3">
                  <Badge variant={activity.type === 'review' ? 'warning' : 'positive'}>
                    {activity.type === 'review' ? 'Review' : 'Check-in'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{activity.type === 'review' ? `${activity.rating} stars` : `+${activity.points || 10} pts`}</td>
                <td className="px-4 py-3 text-muted-foreground tabular-nums">{activity.created_at ? format(new Date(activity.created_at), 'MMM dd, HH:mm') : 'N/A'}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No activity yet. Check-ins and reviews will appear here as users interact with the app.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </CardContent>
      </Card>
    </div>
  );
};

// Waitlist Management Component
const WaitlistManagement = () => {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [stats, setStats] = useState({ total: 0, lovers: 0, trucks: 0, thisWeek: 0 });

  // Fetch waitlist entries
  const fetchWaitlist = async () => {
    setLoading(true);
    try {
      const data = await fetchWaitlistEntries();
      setEntries(data);
      const total = data.length;
      const lovers = data.filter(e => e.type === 'lover').length;
      const trucks = data.filter(e => e.type === 'truck').length;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const thisWeek = data.filter(e => new Date(e.created_at) > weekAgo).length;
      setStats({ total, lovers, trucks, thisWeek });
    } catch (err) {
      console.error('Error fetching waitlist:', err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const filteredEntries = entries.filter(entry => {
    const matchesSearch =
      (entry.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || entry.type === filterType;
    const matchesStatus = filterStatus === 'all' || entry.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleStatusChange = async (id, newStatus) => {
    try {
      const updates = { status: newStatus };
      if (newStatus === 'invited') updates.invited_at = new Date().toISOString();
      if (newStatus === 'converted') updates.converted_at = new Date().toISOString();
      await updateWaitlistEntry(id, updates);
      fetchWaitlist();
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Error updating status: ' + err.message, 'error');
    }
  };

  const handleTypeChange = async (id, newType) => {
    try {
      await updateWaitlistEntry(id, { type: newType });
      fetchWaitlist();
      showToast('User type updated', 'success');
    } catch (err) {
      console.error('Error updating type:', err);
      showToast('Error updating type: ' + err.message, 'error');
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedEntries.length === 0) return;

    try {
      const updates = { status: newStatus };
      if (newStatus === 'invited') updates.invited_at = new Date().toISOString();
      if (newStatus === 'converted') updates.converted_at = new Date().toISOString();
      await updateWaitlistEntries(selectedEntries, updates);
      setSelectedEntries([]);
      fetchWaitlist();
    } catch (err) {
      console.error('Error bulk updating:', err);
      showToast('Error updating entries: ' + err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: 'Delete Entry',
      message: 'Are you sure you want to delete this entry?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await deleteWaitlistEntry(id);
      fetchWaitlist();
    } catch (err) {
      console.error('Error deleting entry:', err);
      showToast('Error deleting entry: ' + err.message, 'error');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Type', 'Status', 'Signed Up', 'Invited At', 'Converted At'];
    const rows = filteredEntries.map(e => [
      e.name,
      e.email,
      e.type,
      e.status,
      new Date(e.created_at).toLocaleDateString(),
      e.invited_at ? new Date(e.invited_at).toLocaleDateString() : '',
      e.converted_at ? new Date(e.converted_at).toLocaleDateString() : ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waitlist-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = async () => {
    if (!importFile) return;

    setImporting(true);
    setImportResults(null);

    try {
      const text = await importFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));

      const nameIdx = headers.findIndex(h => h === 'name' || h === 'full name');
      const emailIdx = headers.findIndex(h => h === 'email' || h === 'email address');
      const typeIdx = headers.findIndex(h => h === 'type' || h === 'user type');

      if (emailIdx === -1) {
        throw new Error('CSV must have an "email" column');
      }

      let imported = 0;
      let skipped = 0;
      let errors = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const email = values[emailIdx];
        const name = nameIdx >= 0 ? values[nameIdx] : email.split('@')[0];
        let type = typeIdx >= 0 ? values[typeIdx]?.toLowerCase() : 'lover';

        // Normalize type
        if (type === 'food lover' || type === 'customer' || type === 'eater') type = 'lover';
        if (type === 'truck owner' || type === 'owner' || type === 'truck') type = 'truck';
        if (type !== 'lover' && type !== 'truck') type = 'lover';

        if (!email || !email.includes('@')) {
          skipped++;
          continue;
        }

        const result = await insertWaitlistEntry({ name, email, type });
        if (result.ok) imported++;
        else if (result.code === '23505') skipped++;
        else errors++;
      }

      setImportResults({ imported, skipped, errors });
      fetchWaitlist();
    } catch (err) {
      console.error('Import error:', err);
      showToast('Error importing CSV: ' + err.message, 'error');
    } finally {
      setImporting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedEntries.length === filteredEntries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(filteredEntries.map(e => e.id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedEntries.includes(id)) {
      setSelectedEntries(selectedEntries.filter(e => e !== id));
    } else {
      setSelectedEntries([...selectedEntries, id]);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Waitlist Management</h1>
          <p className="text-sm text-muted-foreground">Review and convert pending signups.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
            <span className="h-4 w-4">{Icons.download}</span>
            Export CSV
          </Button>
          <Button size="sm" onClick={() => setShowImportModal(true)} className="gap-2">
            <span className="h-4 w-4">{Icons.upload}</span>
            Import CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0"><span className="h-5 w-5">{Icons.users}</span></div>
          <div className="min-w-0 flex flex-col">
            <span className="text-2xl font-bold tracking-tight tabular-nums leading-tight">{stats.total}</span>
            <span className="text-xs text-muted-foreground">Total Signups</span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-positive/10 text-positive shrink-0"><span className="h-5 w-5">{Icons.trendUp}</span></div>
          <div className="min-w-0 flex flex-col">
            <span className="text-2xl font-bold tracking-tight tabular-nums leading-tight">{stats.thisWeek}</span>
            <span className="text-xs text-muted-foreground">This Week</span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-warning/10 text-warning shrink-0 text-lg">🍔</div>
          <div className="min-w-0 flex flex-col">
            <span className="text-2xl font-bold tracking-tight tabular-nums leading-tight">{stats.lovers}</span>
            <span className="text-xs text-muted-foreground">Food Lovers</span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-info/10 text-info shrink-0 text-lg">🚚</div>
          <div className="min-w-0 flex flex-col">
            <span className="text-2xl font-bold tracking-tight tabular-nums leading-tight">{stats.trucks}</span>
            <span className="text-xs text-muted-foreground">Truck Owners</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-0 sm:max-w-xs">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">{Icons.search}</span>
          <Input
            type="search"
            placeholder="Search by name or email…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="lover">Food Lovers</SelectItem>
            <SelectItem value="truck">Truck Owners</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="invited">Invited</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
          </SelectContent>
        </Select>
        {selectedEntries.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-sm w-full">
            <span className="font-medium">{selectedEntries.length} selected</span>
            <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('invited')}>Mark Invited</Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('converted')}>Mark Converted</Button>
          </div>
        )}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  className="rounded border-input"
                  checked={selectedEntries.length === filteredEntries.length && filteredEntries.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Signed Up</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Loading waitlist entries…
                </td>
              </tr>
            ) : filteredEntries.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No waitlist entries found.
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="rounded border-input"
                      checked={selectedEntries.includes(entry.id)}
                      onChange={() => toggleSelect(entry.id)}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">{entry.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{entry.email}</td>
                  <td className="px-4 py-3">
                    <Select value={entry.type} onValueChange={(v) => handleTypeChange(entry.id, v)}>
                      <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lover">🍔 Food Lover</SelectItem>
                        <SelectItem value="truck">🚚 Truck Owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Select value={entry.status} onValueChange={(v) => handleStatusChange(entry.id, v)}>
                      <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="invited">Invited</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">{new Date(entry.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)} title="Delete" className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8">
                      <span className="h-4 w-4">{Icons.trash}</span>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </Card>

      {/* Import Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload a CSV file with waitlist entries. Required column: <strong>email</strong>. Optional: <strong>name</strong>, <strong>type</strong>.
            </p>
            <div className="rounded-lg border border-dashed border-border bg-muted/40 p-6 text-center">
              <input type="file" accept=".csv" onChange={(e) => setImportFile(e.target.files[0])} id="csv-upload" className="sr-only" />
              <label htmlFor="csv-upload" className="flex flex-col items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                <span className="h-5 w-5">{Icons.upload}</span>
                {importFile ? importFile.name : 'Choose CSV file'}
              </label>
            </div>
            {importResults && (
              <div className="rounded-lg border border-info/30 bg-info/10 p-4 text-sm space-y-1">
                <p>✅ Imported: <strong>{importResults.imported}</strong></p>
                <p>⏭️ Skipped (duplicates): <strong>{importResults.skipped}</strong></p>
                {importResults.errors > 0 && <p>❌ Errors: <strong>{importResults.errors}</strong></p>}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportModal(false)}>Cancel</Button>
            <Button onClick={handleImportCSV} disabled={!importFile || importing} className="gap-2">
              {importing ? <><span className="h-4 w-4 animate-spin">{Icons.loader}</span>Importing…</> : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Users Management Component with Email Invite
const UsersManagement = ({ onViewAs }) => {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('customer');
  const [inviteName, setInviteName] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');

  // Fetch users from Supabase profiles table with customer/owner details
  const fetchUsers = async () => {
    setLoading(true);
    try {
      setUsers(await fetchAdminUsers());
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleInviteUser = async () => {
    if (!inviteEmail || !inviteName) {
      showToast('Please enter both name and email', 'error');
      return;
    }

    setInviting(true);
    setInviteSuccess('');

    try {
      // Invitations now live in Clerk — use Clerk Dashboard → Users → Invite.
      // Wiring a Clerk-Backend-API-backed invite flow here would need a new
      // edge function. Stubbed until that's built.
      throw new Error('User invitations have moved. Invite via Clerk Dashboard → Users → Invite, then set role in Supabase profiles.role.');

    } catch (err) {
      console.error('Error inviting user:', err);
      showToast('Error sending invitation: ' + err.message, 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser({ ...user });
    setEditMode(true);
    setShowModal(true);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setEditMode(false);
    setShowModal(true);
  };

  const handleSaveUser = async () => {
    setSaving(true);
    try {
      await updateAdminUserProfile(selectedUser.id, {
        name: selectedUser.name,
        role: selectedUser.role,
        phone: selectedUser.role === 'customer' ? selectedUser.phone : undefined,
      });
      setUsers(users.map(u => u.id === selectedUser.id ? selectedUser : u));
      setShowModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error saving user:', err);
      showToast('Error saving user: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    const confirmed = await confirm({
      title: 'Delete User',
      message: 'Are you sure you want to delete this user? This will remove their profile and all associated data.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await deleteAdminUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
      showToast('Error deleting user: ' + err.message, 'error');
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users Management</h1>
          <p className="text-sm text-muted-foreground">Manage user accounts, roles, and invitations.</p>
        </div>
        <Button size="sm" onClick={() => setShowInviteModal(true)} className="gap-2 shrink-0">
          <span className="h-4 w-4">{Icons.mail}</span>
          Invite User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-0 sm:max-w-xs">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">{Icons.search}</span>
          <Input type="search" placeholder="Search users…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="customer">Customers</SelectItem>
            <SelectItem value="owner">Owners</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Loading users…
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Points</th>
                <th className="px-4 py-3">Subscription</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{getInitials(user.name)}</div>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm font-semibold truncate">{user.name || 'No name'}</span>
                        <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col leading-tight">
                      <span>{user.phone || 'No phone'}</span>
                    </div>
                  </td>
                  <td>
                    <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'owner' ? 'info' : 'secondary'}>{user.role || 'customer'}</Badge>
                  </td>
                  <td>{user.role === 'customer' ? (user.points || 0) : '-'}</td>
                  <td>{user.role === 'owner' ? (user.subscription_type || 'free') : '-'}</td>
                  <td>{user.created_at ? format(new Date(user.created_at), 'MMM dd, yyyy') : 'N/A'}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewUser(user)} title="View"><span className="h-4 w-4">{Icons.eye}</span></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditUser(user)} title="Edit"><span className="h-4 w-4">{Icons.edit}</span></Button>
                      {user.role === 'customer' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onViewAs?.(user)} title="View As Customer"><span className="h-4 w-4">{Icons.user}</span></Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteUser(user.id)} title="Delete"><span className="h-4 w-4">{Icons.trash}</span></Button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-sm text-muted-foreground">
                    {searchTerm || filterRole !== 'all' ? 'No users match your filters.' : 'No users yet. Invite users to get started.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        )}
      </Card>

      {/* Invite User Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite New User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {inviteSuccess && (
              <div className="flex items-center gap-2 rounded-lg border border-positive/30 bg-positive/10 px-4 py-3 text-sm text-positive">
                {inviteSuccess}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Full Name *</Label>
                <Input type="text" value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Enter user's full name" required />
              </div>
              <div className="space-y-1.5">
                <Label>Email Address *</Label>
                <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Enter email address" required />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="owner">Food Truck Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              The user will receive an email with a link to set up their account.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>Cancel</Button>
            <Button onClick={handleInviteUser} disabled={inviting || !inviteEmail || !inviteName}>
              {inviting ? 'Sending…' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details/Edit Modal */}
      <Dialog open={showModal && !!selectedUser} onOpenChange={(v) => { if (!v) setShowModal(false); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editMode ? 'Edit User' : 'User Details'}</DialogTitle></DialogHeader>
          {selectedUser && (editMode ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input type="text" value={selectedUser.name || ''} onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })} placeholder="Enter full name" required />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={selectedUser.email || ''} disabled />
                <p className="text-xs text-muted-foreground">Email cannot be changed (linked to auth)</p>
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input type="tel" value={selectedUser.phone || ''} onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })} placeholder="Enter phone number" />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={selectedUser.role || 'customer'} onValueChange={(v) => setSelectedUser({ ...selectedUser, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">{getInitials(selectedUser.name)}</div>
                <div>
                  <div className="font-semibold">{selectedUser.name || 'No name'}</div>
                  <Badge variant={selectedUser.role === 'admin' ? 'destructive' : selectedUser.role === 'owner' ? 'info' : 'secondary'} className="mt-1">{selectedUser.role || 'customer'}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Email', value: selectedUser.email },
                  { label: 'Phone', value: selectedUser.phone || 'Not provided' },
                  { label: 'Joined', value: selectedUser.created_at ? format(new Date(selectedUser.created_at), 'MMM dd, yyyy') : 'N/A' },
                  ...(selectedUser.role === 'customer' ? [{ label: 'Points', value: selectedUser.points || 0 }] : []),
                  ...(selectedUser.role === 'owner' ? [{ label: 'Subscription', value: selectedUser.subscription_type || 'free' }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg border border-border bg-muted/30 p-3">
                    <span className="block text-xs text-muted-foreground mb-1">{label}</span>
                    <span className="font-semibold text-sm">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            {editMode && (
              <Button onClick={handleSaveUser} disabled={saving || !selectedUser?.name}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


// Analytics Component - Real Data Only
const AnalyticsPage = ({ stats, chartData }) => {
  const metrics = [
    { label: 'Total Users',    value: (stats.totalUsers   || 0).toLocaleString(), icon: Icons.users,    tone: 'primary' },
    { label: 'Food Trucks',    value: (stats.totalTrucks  || 0).toLocaleString(), icon: Icons.truck,    tone: 'info'    },
    { label: 'Total Reviews',  value: (stats.totalReviews || 0).toLocaleString(), icon: Icons.star,     tone: 'warning' },
    { label: 'Check-ins',      value: (stats.totalCheckIns|| 0).toLocaleString(), icon: Icons.mapPin,   tone: 'positive'},
  ];

  const TONE = {
    primary:  'bg-primary/10 text-primary',
    info:     'bg-info/10 text-info',
    warning:  'bg-warning/10 text-warning',
    positive: 'bg-positive/10 text-positive',
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-5 flex items-center gap-3">
              <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg shrink-0', TONE[m.tone])}>
                <span className="h-5 w-5">{m.icon}</span>
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-bold tracking-tight tabular-nums">{m.value}</div>
                <div className="text-xs text-muted-foreground">{m.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Daily Activity (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {chartData.dailyActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData.dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="checkIns" stroke="#e11d48" strokeWidth={2} dot={false} name="Check-ins" />
                  <Line type="monotone" dataKey="reviews"  stroke="#3b82f6" strokeWidth={2} dot={false} name="Reviews" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                No activity data yet. Charts will populate as users interact with the app.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Trucks by Cuisine</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {chartData.cuisineBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={chartData.cuisineBreakdown} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {chartData.cuisineBreakdown.map((entry, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                No food truck data yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Orders Management Component
const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        setOrders(await fetchAdminAllOrders({ limit: 50 }));
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusVariant = (status) => {
    switch (status) {
      case 'completed': return 'positive';
      case 'pending': return 'warning';
      case 'preparing': return 'info';
      case 'ready': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Orders Management</h1>
        <Badge variant="secondary" className="tabular-nums">{orders.length} orders</Badge>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <CardContent className="py-16 text-center text-sm text-muted-foreground">Loading orders…</CardContent>
        ) : orders.length === 0 ? (
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No orders found. Create a test order in Settings → Developer Settings.
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Truck</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{order.order_number}</code>
                  </td>
                  <td className="px-4 py-3">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{order.profiles?.name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground truncate">{order.profiles?.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{order.food_trucks?.name || 'Unknown Truck'}</td>
                  <td className="px-4 py-3 tabular-nums" title={order.order_items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}>
                    {order.order_items?.length || 0} items
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums">${parseFloat(order.total || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                    {order.created_at ? format(new Date(order.created_at), 'MMM dd, yyyy HH:mm') : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </Card>
    </div>
  );
};

// Settings Component
const SettingsPage = ({ adminEmail, devSettings, onUpdateDevSettings }) => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState({
    siteName: 'Cravvr',
    siteDescription: 'The map-first food truck app',
    contactEmail: 'support@cravvr.com',
    commissionRate: 0,
    minOrderAmount: 10,
    enableNotifications: true,
    maintenanceMode: false,
  });
  const [creatingTestUser, setCreatingTestUser] = useState(false);
  const [creatingTestOrder, setCreatingTestOrder] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedTruckId, setSelectedTruckId] = useState('');

  // Fetch customers and trucks for test order creation
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customerData, truckData] = await Promise.all([
          fetchAdminCustomersForTestOrder({ limit: 30 }),
          fetchAdminTrucksForTestOrder(),
        ]);
        setCustomers(customerData);
        setTrucks(truckData);
      } catch (err) {
        console.error('Error fetching test order data:', err);
      }
    };
    fetchData();
  }, []);

  const handleCreateTestCustomer = async () => {
    setCreatingTestUser(true);
    try {
      // Test users now live in Clerk. Create one via Clerk Dashboard →
      // Users → Create (or the API). The webhook will sync a customers row
      // automatically. Wiring server-side creation here would need a new
      // edge function calling Clerk's Backend API.
      throw new Error('Test user creation has moved. Add a user via Clerk Dashboard → Users → Create.');
    } catch (err) {
      console.error('Error creating test customer:', err);
      showToast('Error creating test customer: ' + err.message, 'error');
    } finally {
      setCreatingTestUser(false);
    }
  };

  const handleCreateTestOrder = async () => {
    if (!selectedCustomerId || !selectedTruckId) {
      showToast('Please select both a customer and a truck', 'error');
      return;
    }

    setCreatingTestOrder(true);
    try {
      const menuItems = await fetchTruckAvailableMenuSample(selectedTruckId, { limit: 3 });

      if (menuItems.length === 0) {
        showToast('No menu items found for this truck. Add some menu items first.', 'error');
        setCreatingTestOrder(false);
        return;
      }

      // Calculate order totals
      const subtotal = menuItems.reduce((sum, item) => sum + (parseFloat(item.price) || 9.99), 0);
      const tax = subtotal * 0.0825; // 8.25% tax
      const total = subtotal + tax;
      const orderNumber = `TEST-${Date.now()}`;

      await createAdminTestOrder({
        customerId: selectedCustomerId,
        truckId: selectedTruckId,
        orderNumber,
        subtotal,
        tax,
        total,
        items: menuItems,
      });

      const truckName = trucks.find(t => t.id === selectedTruckId)?.name || 'Unknown Truck';
      const customerName = customers.find(c => c.id === selectedCustomerId)?.name || 'Unknown Customer';

      showToast(
        `Test order created!\nOrder #${orderNumber}\nCustomer: ${customerName}\nTruck: ${truckName}\nItems: ${menuItems.length}\nTotal: $${total.toFixed(2)}`,
        'success'
      );
    } catch (err) {
      console.error('Error creating test order:', err);
      showToast('Error creating test order: ' + err.message, 'error');
    } finally {
      setCreatingTestOrder(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Admin Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Logged in as</Label>
              <Input type="text" value={adminEmail} disabled />
            </div>
            <div className="space-y-1.5">
              <Label>Admin Access</Label>
              <p className="rounded-lg bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                Admin access is managed via the database. Set <code>role = 'admin'</code> in the <code>profiles</code> table to grant admin access.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">General Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Site Name</Label>
              <Input type="text" value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Site Description</Label>
              <Textarea value={settings.siteDescription} onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Contact Email</Label>
              <Input type="email" value={settings.contactEmail} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Business Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Commission Rate (%)</Label>
              <Input type="number" value={settings.commissionRate} onChange={(e) => setSettings({ ...settings, commissionRate: parseFloat(e.target.value) || 0 })} />
              <p className="text-xs text-muted-foreground">0% = No commission on pickup orders</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Feature Toggles</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="toggle-notifications">Enable Push Notifications</Label>
              <Switch
                id="toggle-notifications"
                checked={settings.enableNotifications}
                onCheckedChange={(v) => setSettings({ ...settings, enableNotifications: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="toggle-maintenance">Maintenance Mode</Label>
                <p className="text-xs text-muted-foreground">Site will show maintenance page</p>
              </div>
              <Switch
                id="toggle-maintenance"
                checked={settings.maintenanceMode}
                onCheckedChange={(v) => setSettings({ ...settings, maintenanceMode: v })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 text-muted-foreground">{Icons.code}</span>
              <CardTitle className="text-base">Developer Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">These settings are for local development and testing only.</p>

            <div className="flex items-start justify-between gap-4">
              <div>
                <Label htmlFor="toggle-skip-review">Skip Order Requirement for Reviews</Label>
                <p className="text-xs text-muted-foreground mt-1">Allow users to write reviews without completing an order first</p>
              </div>
              <Switch
                id="toggle-skip-review"
                checked={devSettings?.skipReviewOrderRequirement || false}
                onCheckedChange={(v) => onUpdateDevSettings?.({ skipReviewOrderRequirement: v })}
              />
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <Label>Test User Management</Label>
              <Button variant="outline" size="sm" onClick={handleCreateTestCustomer} disabled={creatingTestUser} className="gap-2">
                {creatingTestUser ? 'Creating…' : 'Create Test Customer'}
              </Button>
              <p className="text-xs text-muted-foreground">Creates a test customer. Confirm in Supabase Auth to enable login.</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <Label>Create Test Order (Completed)</Label>
              <p className="text-xs text-muted-foreground">Create a completed order so the customer can write reviews</p>
              <div className="space-y-2">
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger><SelectValue placeholder="Select Customer…" /></SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name || c.email}{c.role === 'admin' ? ' (Admin)' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedTruckId} onValueChange={setSelectedTruckId}>
                  <SelectTrigger><SelectValue placeholder="Select Truck…" /></SelectTrigger>
                  <SelectContent>
                    {trucks.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleCreateTestOrder} disabled={creatingTestOrder || !selectedCustomerId || !selectedTruckId}>
                  {creatingTestOrder ? 'Creating Order…' : 'Create Completed Order'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This creates an order with status "completed" including menu items from the selected truck
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Main Admin Dashboard Component
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, loading: authLoading, signOut, startViewingAs, devSettings, updateDevSettings } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrucks: 0,
    totalReviews: 0,
    totalCheckIns: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [chartData, setChartData] = useState({
    dailyActivity: [],
    cuisineBreakdown: [],
    userGrowth: [],
    userTypes: [],
  });
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [initialAuthDone, setInitialAuthDone] = useState(false);

  // Track when initial auth check completes
  useEffect(() => {
    if (!authLoading && !initialAuthDone) {
      setInitialAuthDone(true);
    }
  }, [authLoading, initialAuthDone]);

  // Fetch all dashboard data from real tables - OPTIMIZED
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Run all independent queries in parallel for speed
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const oneYearAgo = subDays(new Date(), 365).toISOString();

      const {
        usersResult,
        trucksResult,
        reviewsResult,
        checkInsResult,
        recentCheckInsResult,
        recentReviewsResult,
        checkInsLast30Result,
        reviewsLast30Result,
        usersWithDatesResult,
      } = await fetchAdminDashboardStats({
        thirtyDaysAgoIso: thirtyDaysAgo,
        oneYearAgoIso: oneYearAgo,
      });

      // Process user roles
      const userRoles = usersResult.data || [];
      const customerCount = userRoles.filter(u => u.role === 'customer').length;
      const ownerCount = userRoles.filter(u => u.role === 'owner').length;

      // Process cuisine breakdown
      const trucksCuisine = trucksResult.data || [];
      const cuisineCounts = {};
      trucksCuisine.forEach(t => {
        const cuisine = t.cuisine || 'Other';
        cuisineCounts[cuisine] = (cuisineCounts[cuisine] || 0) + 1;
      });
      const cuisineBreakdown = Object.entries(cuisineCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // Get customer and truck names for recent activity
      const recentCheckIns = recentCheckInsResult.data || [];
      const recentReviews = recentReviewsResult.data || [];

      // Collect IDs for batch lookup
      const customerIds = [...new Set([
        ...recentCheckIns.map(c => c.customer_id),
        ...recentReviews.map(r => r.customer_id)
      ].filter(Boolean))];
      const truckIds = [...new Set([
        ...recentCheckIns.map(c => c.truck_id),
        ...recentReviews.map(r => r.truck_id)
      ].filter(Boolean))];

      // Batch fetch names
      const [profileNames, truckNames] = await Promise.all([
        fetchProfileNamesByIds(customerIds),
        fetchTruckNamesByIds(truckIds),
      ]);

      const profilesMap = {};
      profileNames.forEach(p => { profilesMap[p.id] = p.name; });
      const trucksMap = {};
      truckNames.forEach(t => { trucksMap[t.id] = t.name; });

      // Build recent activity
      const activity = [
        ...recentCheckIns.map(ci => ({
          id: ci.id,
          customer_name: profilesMap[ci.customer_id] || 'Guest',
          truck_name: trucksMap[ci.truck_id] || 'Unknown',
          points: ci.points_earned || 10,
          created_at: ci.created_at,
          type: 'check_in'
        })),
        ...recentReviews.map(r => ({
          id: r.id,
          customer_name: profilesMap[r.customer_id] || 'Guest',
          truck_name: trucksMap[r.truck_id] || 'Unknown',
          rating: r.rating,
          created_at: r.created_at,
          type: 'review'
        }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

      // Aggregate daily activity from fetched data (no more 30 queries!)
      const checkInsLast30 = checkInsLast30Result.data || [];
      const reviewsLast30 = reviewsLast30Result.data || [];

      const dailyActivity = [];
      for (let i = 29; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const displayDate = format(date, 'MMM dd');
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        const dayCheckIns = checkInsLast30.filter(c => {
          const d = new Date(c.created_at);
          return d >= dayStart && d <= dayEnd;
        }).length;

        const dayReviews = reviewsLast30.filter(r => {
          const d = new Date(r.created_at);
          return d >= dayStart && d <= dayEnd;
        }).length;

        dailyActivity.push({
          date: displayDate,
          checkIns: dayCheckIns,
          reviews: dayReviews,
        });
      }

      // Aggregate user growth from fetched data (no more 12 queries!)
      const usersWithDates = usersWithDatesResult.data || [];
      const userGrowth = [];
      for (let i = 11; i >= 0; i--) {
        const date = subDays(new Date(), i * 30);
        const monthStr = format(date, 'MMM');
        const endDate = endOfDay(date);

        // Count users created up to this point
        const usersUpToDate = usersWithDates.filter(u =>
          new Date(u.created_at) <= endDate
        ).length;

        // Add base count for users created before our range
        const baseCount = (usersResult.count || 0) - usersWithDates.length;

        userGrowth.push({
          month: monthStr,
          users: baseCount + usersUpToDate,
        });
      }

      setStats({
        totalUsers: usersResult.count || 0,
        totalTrucks: trucksResult.count || 0,
        totalReviews: reviewsResult.count || 0,
        totalCheckIns: checkInsResult.count || 0,
      });

      setRecentActivity(activity);

      setChartData({
        dailyActivity,
        cuisineBreakdown,
        userGrowth,
        userTypes: customerCount + ownerCount > 0 ? [
          { name: 'Customers', value: customerCount },
          { name: 'Owners', value: ownerCount },
        ] : [],
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setStats({ totalUsers: 0, totalTrucks: 0, totalReviews: 0, totalCheckIns: 0 });
      setRecentActivity([]);
      setChartData({ dailyActivity: [], cuisineBreakdown: [], userGrowth: [], userTypes: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch once when user becomes admin and we haven't fetched yet
    if (user && isAdmin && !hasFetched) {
      setHasFetched(true);
      fetchDashboardData();
    }
  }, [user, isAdmin, hasFetched]);

  const handleLogout = async () => {
    await signOut();
  };

  // Show loading only during INITIAL auth check (not on tab return)
  if (authLoading && !initialAuthDone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-background to-rose-100/40 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-md shadow-primary/30">
              C
            </span>
            <span className="text-xl font-bold tracking-tight">Cravvr Admin</span>
          </div>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  // Show access denied if user is logged in but not admin (including when profile is null/missing)
  if (user && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-background to-rose-100/40 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl space-y-4">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-md shadow-primary/30">
                C
              </span>
              <span className="text-xl font-bold tracking-tight">Cravvr Admin</span>
            </div>
            <p className="text-sm text-muted-foreground">Access Denied</p>
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <span className="h-4 w-4 shrink-0 mt-0.5">{Icons.alertCircle}</span>
            {!profile
              ? 'Your admin profile is not set up. Please contact support to configure your account.'
              : 'You do not have admin privileges. Please contact support if you believe this is an error.'}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
          >
            Sign Out & Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <AdminLogin onLoginSuccess={() => {}} />;
  }

const handleViewAs = async (targetUser) => {
    await startViewingAs(targetUser);
    // Navigate to home page to view as customer
    window.location.href = '/';
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardOverview stats={stats} recentActivity={recentActivity} chartData={chartData} loading={loading} onRefresh={fetchDashboardData} />;
      case 'waitlist':
        return <WaitlistManagement />;
      case 'users':
        return <UsersManagement onViewAs={handleViewAs} />;
      case 'trucks':
        // Truck management has moved to /admin/trucks (richer UI, audit log, soft delete).
        // This case is kept only as a defensive fallback if the navigate() above is bypassed.
        return (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-3">
            <p className="text-sm text-muted-foreground">Truck management has moved.</p>
            <Button size="sm" onClick={() => navigate('/admin/trucks')}>Open truck manager</Button>
          </div>
        );
      case 'orders':
        return <OrdersManagement />;
      case 'analytics':
        return <AnalyticsPage stats={stats} chartData={chartData} />;
      case 'marketing':
        return <MarketingPage />;
      case 'playbook':
        return <PlaybookPage />;
      case 'settings':
        return <SettingsPage adminEmail={user?.email} devSettings={devSettings} onUpdateDevSettings={updateDevSettings} />;
      default:
        return <DashboardOverview stats={stats} recentActivity={recentActivity} chartData={chartData} loading={loading} onRefresh={fetchDashboardData} />;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminNavBar activeId={currentPage} onLocalNavigate={setCurrentPage} />
      <main className="px-3 py-4 sm:px-6 lg:py-6">
        {renderPage()}
      </main>
    </div>
  );
};

export default AdminDashboard;
