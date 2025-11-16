'use client';

import { useAdmin } from '@/context/AdminContext';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserCheck, 
  Clock, 
  Activity, 
  Shield, 
  TrendingUp,
  AlertCircle,
  Brain,
  Stethoscope,
  Hospital,
  UserPlus,
  LucideIcon
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/Customs/ui/card';
import { Badge } from '../../components/Customs/ui/badge';
import { Skeleton } from '../../components/Customs/ui/skeleton';
import { Progress } from '../../components/Customs/ui/progress';
import { useTheme } from 'next-themes';
import { UserRole } from '@/types/auth';

export default function AdminDashboard() {
  const { admin, fetchAnalytics, fetchUsers } = useAdmin();
  const { theme } = useTheme();

  useEffect(() => {
    fetchAnalytics();
    fetchUsers({ limit: 1 }); // just to warm up
  }, [fetchAnalytics, fetchUsers]);

  const analytics = admin.analytics;
  const loading = admin.loadingAnalytics;

  if (!analytics && loading) {
    return <AnalyticsSkeleton />;
  }

  if (!analytics) {
    return <ErrorState />;
  }

  const roleData: { role: UserRole; icon: LucideIcon; color: string; bg: string }[] = [
    { role: 'user', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { role: 'doctor', icon: Stethoscope, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { role: 'nurse', icon: Shield, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30' },
    { role: 'hospital', icon: Hospital, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' },
    { role: 'ai', icon: Brain, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/30' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Admin Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time insights into your AI Medical Platform
          </p>
        </div>
        <Badge variant="default" className="text-sm px-3 py-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
          Live
        </Badge>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Users */}
        <StatCard
          title="Total Users"
          value={analytics.totalUsers.toLocaleString()}
          icon={Users}
          trend="+12.5%"
          color="from-blue-500 to-cyan-500"
          delay={0.1}
        />

        {/* Verified Users */}
        <StatCard
          title="Verified Users"
          value={analytics.verifiedUsers.toLocaleString()}
          icon={UserCheck}
          trend={`${((analytics.verifiedUsers / analytics.totalUsers) * 100).toFixed(1)}%`}
          color="from-emerald-500 to-teal-500"
          delay={0.2}
        />

        {/* Pending Requests */}
        <StatCard
          title="Pending Roles"
          value={analytics.pendingRoleRequests}
          icon={Clock}
          trend="Awaiting Review"
          color="from-amber-500 to-orange-500"
          delay={0.3}
          badge={analytics.pendingRoleRequests > 0 ? 'warning' : 'success'}
        />

        {/* Active Sessions */}
        <StatCard
          title="Active Sessions"
          value={analytics.activeSessions}
          icon={Activity}
          trend="Real-time"
          color="from-purple-500 to-pink-500"
          delay={0.4}
        />
      </div>

      {/* Role Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Roles Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of all registered users by role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {roleData.map((item, i) => {
                const Icon = item.icon;
                const count = analytics.usersByRole[item.role] || 0;
                const percentage = analytics.totalUsers > 0 
                  ? (count / analytics.totalUsers) * 100 
                  : 0;

                return (
                  <motion.div
                    key={item.role}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className={`${item.bg} p-5 rounded-2xl border border-gray-200 dark:border-gray-700`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-3 rounded-xl ${item.bg.replace('bg-', 'bg-opacity-20')}`}>
                        <Icon className={`w-6 h-6 ${item.color}`} />
                      </div>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {count}
                      </span>
                    </div>
                    <p className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                      {item.role === 'ai' ? 'AI Agents' : item.role + 's'}
                    </p>
                    <div className="mt-2">
                      <Progress value={percentage} className="h-2" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {percentage.toFixed(1)}%
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI System Health */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
      >
        {/* AI Load */}
        <Card className="col-span-1 lg:col-span-2 border-0 shadow-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/5 dark:to-purple-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              AI System Load
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Neural Processing</span>
                  <span className="font-medium">78%</span>
                </div>
                <Progress value={78} className="h-3" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Diagnosis Engine</span>
                  <span className="font-medium">62%</span>
                </div>
                <Progress value={62} className="h-3" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Image Analysis</span>
                  <span className="font-medium">91%</span>
                </div>
                <Progress value={91} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full text-left p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-3">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Add New Doctor</span>
            </button>
            <button className="w-full text-left p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span className="font-medium">Review Pending</span>
              <Badge variant="destructive" className="ml-auto">
                {analytics.pendingRoleRequests}
              </Badge>
            </button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

/* ———————————— Reusable Components ———————————— */

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color,
  delay,
  badge,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend: string;
  color: string;
  delay: number;
  badge?: 'warning' | 'success';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
    >
      <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/80 dark:bg-gray-900/80 backdrop-blur p-4">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-xl bg-gradient-to-br ${color} bg-opacity-10`}>
            <Icon className={`w-5 h-5 text-transparent bg-clip-text bg-gradient-to-br ${color}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-500" />
            {trend}
            {badge && (
              <Badge variant={badge === 'warning' ? 'destructive' : 'default'} className="ml-2 text-xs">
                {badge}
              </Badge>
            )}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-20 mt-2" />
          </Card>
        ))}
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Failed to Load Analytics
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        Please try again later or contact support.
      </p>
    </div>
  );
}