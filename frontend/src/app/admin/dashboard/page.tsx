"use client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,        
  Pie,          
  Cell,          
  Legend,
  type PieLabelRenderProps,
  BarChart, 
  Bar,
} from 'recharts';

interface DashboardStats {
  totalUsers: number;
  activeCars: number;
  soldCars: number;
  pendingReports: number;
  totalBuyers: number;    
  totalSellers: number;   
}

interface RecentReport {
  id: number;
  type: "user" | "car";
  targetId: number;
  reason: string;
  reportedBy: string;
  createdAt: string;
  status: "pending" | "resolved" | "dismissed";
}

interface ChartDataPoint {
  date: string;
  value: number;
}

interface BrandDataPoint {
  brand: string;
  count: number;
}

const TopBrandsChart = ({ data }: { data: BrandDataPoint[] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-gray-500">
        No brand data
      </div>
    );
  }

  const COLORS = [
    '#880808', // 1. Darkest Maroon
    '#991a1a',
    '#aa2b2b',
    '#bb3d3d',
    '#cc4e4e', // 5.
    '#dd5f5f',
    '#ee7070',
    '#ff8181',
    '#ff9292',
    '#ffa3a3'  // 10. Lightest Red
  ];

  return (
    <div className="h-96 w-full"> {/* (hegiht 384px) */}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical" 
          margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            type="number" 
            allowDecimals={false} 
            tick={{ fontSize: 12, fill: '#6b7280' }} 
          />
          <YAxis
            type="category"
            dataKey="brand" 
            width={80} 
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <Tooltip
            contentStyle={{ borderRadius: '8px', boxShadow: 'var(--shadow-md)', border: 'none' }}
            formatter={(value: number) => [value, 'Cars']}
          />
          <Bar dataKey="count">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const DonutChartComponent = ({ buyers, sellers }: { buyers: number, sellers: number }) => {
  const data = [
    { name: 'Buyers', value: buyers },
    { name: 'Sellers', value: sellers },
  ];
  const COLORS = ['#880808', '#B03A2E']; 

  const total = buyers + sellers;
  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No user data
      </div>
    );
  }

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }: PieLabelRenderProps) => {
    if (percent === undefined || value === undefined || midAngle === undefined || innerRadius === undefined || outerRadius === undefined || cx === undefined || cy === undefined) {
      return null;
    };
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle! * RADIAN);
    const y = cy + radius * Math.sin(-midAngle! * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs sm:text-sm font-bold"
      >
        {`${value!} (${(percent! * 100).toFixed(0)}%)`}
      </text>
    );
  }
  
  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius="80%"
            innerRadius="40%"
            fill="#8884d8"
            dataKey="value"
            paddingAngle={5}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => [value, 'Users']} />
          <Legend 
            iconType="circle" 
            wrapperStyle={{ 
              paddingTop: '20px',
              paddingBottom: '20px',
              fontSize: '14px' 
            }} 
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const CarStatusDonutChart = ({ active, sold }: { active: number, sold: number }) => {
  const data = [
    { name: 'Active', value: active }, 
    { name: 'Sold', value: sold },  
  ];
  const COLORS = ['#16A34A', '#2563EB']; 

  const total = active + sold; 
  if (total === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-gray-500"> 
        No car data
      </div>
    );
  }

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }: PieLabelRenderProps) => {
    if (percent === undefined || value === undefined || midAngle === undefined || innerRadius === undefined || outerRadius === undefined || cx === undefined || cy === undefined) {
      return null;
    };
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle! * RADIAN);
    const y = cy + radius * Math.sin(-midAngle! * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs sm:text-sm font-bold"
      >
        {`${value!} (${(percent! * 100).toFixed(0)}%)`}
      </text>
    );
  }
  
  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius="80%"
            innerRadius="40%"
            fill="#8884d8"
            dataKey="value"
            paddingAngle={5}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => [value, 'Cars']} />
          <Legend 
            iconType="circle" 
            wrapperStyle={{ 
              paddingTop: '20px',
              paddingBottom: '20px',
              fontSize: '14px' 
            }} 
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function AdminDashboard() {
  const { adminUser } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeCars: 0,
    soldCars: 0,
    pendingReports: 0,
    totalBuyers: 0,     
    totalSellers: 0,   
  });
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [topBrandsData, setTopBrandsData] = useState<BrandDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [statsResponse, chartResponse, brandsResponse] = await Promise.all([
          fetch("/admin/dashboard/stats"),
          fetch("/admin/dashboard/chart?period=30d"),
          fetch("/admin/dashboard/top-brands"),
        ]);
        if (!statsResponse.ok) {
          throw new Error("Failed to fetch stats");
        }
        if (!chartResponse.ok) {
          throw new Error("Failed to fetch chart data");
        }
        if (!brandsResponse.ok) { 
          throw new Error("Failed to fetch top brands data");
        }
        const statsData: DashboardStats = await statsResponse.json();
        const chartData: ChartDataPoint[] = await chartResponse.json();
        const brandsData: BrandDataPoint[] = await brandsResponse.json();
        
        setStats(statsData);
        setChartData(chartData);
        setTopBrandsData(brandsData);

        setRecentReports([
          {
            id: 1,
            type: "user",
            targetId: 2345,
            reason: "Suspicious listing behavior",
            reportedBy: "buyer_123",
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            status: "pending",
          },
          {
            id: 2,
            type: "car",
            targetId: 5678,
            reason: "Potential price manipulation",
            reportedBy: "buyer_456",
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            status: "pending",
          },
          {
            id: 3,
            type: "user",
            targetId: 3456,
            reason: "Fraudulent profile information",
            reportedBy: "buyer_789",
            createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            status: "pending",
          },
          {
            id: 4,
            type: "car",
            targetId: 6789,
            reason: "Misleading vehicle description",
            reportedBy: "buyer_012",
            createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            status: "pending",
          },
          {
            id: 5,
            type: "user",
            targetId: 4567,
            reason: "Suspicious transaction patterns",
            reportedBy: "buyer_345",
            createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            status: "pending",
          },
        ]);

      }catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setStats({
          totalUsers: 0,
          activeCars: 0,
          soldCars: 0,
          pendingReports: 0,
          totalBuyers: 0,     
          totalSellers: 0,
        });
        setChartData([]);
        setTopBrandsData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Calculate max value for chart scaling
  const maxChartValue = Math.max(...chartData.map((d) => d.value), 1);

  return (
    <div className="p-(--space-s-m) max-w-[1536px] mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-3 bold">Dashboard</h1>
      </div>
      {/* Main Content */}
      <main>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-(--space-m) mb-(--space-l)">
          {/* Pending Reports */}
          <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m)">
            <div className="flex items-center justify-between">
              <div>
                <p className="text--1 text-gray-600 mb-1">Pending Reports</p>
                <p className="text-3xl font-bold text-gray-900">
                  {isLoading ? "..." : stats.pendingReports}
                </p>
                <Link
                  href="/admin/reports"
                  className="text-sm text-maroon hover:underline mt-1 inline-block"
                >
                  View all →
                </Link>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <svg
                  className="w-8 h-8 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                  />
                </svg>
              </div>
            </div>
          </div>

          
          {/* Active Cars */}
          <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m)">
            <div className="flex items-center justify-between">
              <div>
                <p className="text--1 text-gray-600 mb-1">Active Cars</p>
                <p className="text-3xl font-bold text-gray-900">
                  {isLoading ? "..." : stats.activeCars}
                </p>
                <Link
                  href="/admin/cars"
                  className="text-sm text-maroon hover:underline mt-1 inline-block"
                >
                  View all →
                </Link>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg
                  className="w-8 h-8 text-green-600"
                  viewBox="0 0 24.00 24.00"
                  fill="none"
                >
                  <path
                    d="M3 8L5.72187 10.2682C5.90158 10.418 6.12811 10.5 6.36205 10.5H17.6379C17.8719 10.5 18.0984 10.418 18.2781 10.2682L21 8M6.5 14H6.51M17.5 14H17.51M8.16065 4.5H15.8394C16.5571 4.5 17.2198 4.88457 17.5758 5.50772L20.473 10.5777C20.8183 11.1821 21 11.8661 21 12.5623V18.5C21 19.0523 20.5523 19.5 20 19.5H19C18.4477 19.5 18 19.0523 18 18.5V17.5H6V18.5C6 19.0523 5.55228 19.5 5 19.5H4C3.44772 19.5 3 19.0523 3 18.5V12.5623C3 11.8661 3.18166 11.1821 3.52703 10.5777L6.42416 5.50772C6.78024 4.88457 7.44293 4.5 8.16065 4.5ZM7 14C7 14.2761 6.77614 14.5 6.5 14.5C6.22386 14.5 6 14.2761 6 14C6 13.7239 6.22386 13.5 6.5 13.5C6.77614 13.5 7 13.7239 7 14ZM18 14C18 14.2761 17.7761 14.5 17.5 14.5C17.2239 14.5 17 14.2761 17 14C17 13.7239 17.2239 13.5 17.5 13.5C17.7761 13.5 18 13.7239 18 14Z"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Sold Cars */}
          <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m)">
            <div className="flex items-center justify-between">
              <div>
                <p className="text--1 text-gray-600 mb-1">Sold Cars</p>
                <p className="text-3xl font-bold text-gray-900">
                  {isLoading ? "..." : stats.soldCars}
                </p>
                <Link
                  href="/admin/cars"
                  className="text-sm text-maroon hover:underline mt-1 inline-block"
                >
                  View all →
                </Link>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Users */}
          <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m)">
            <div className="flex items-center justify-between">
              <div>
                <p className="text--1 text-gray-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">
                  {isLoading ? "..." : stats.totalUsers.toLocaleString()}
                </p>
                <Link
                  href="/admin/users"
                  className="text-sm text-maroon hover:underline mt-1 inline-block"
                >
                  View all →
                </Link>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-6.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* --- Row 1: Activity Chart & User Roles --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-(--space-m) mb-(--space-l)">
          
          {/* Col 1.1: Activity Chart (Line) */}
          <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m) h-[450px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-1 font-bold text-gray-900">
                Activity Overview (Last 30 Days)
              </h2>
            </div>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon"></div>
              </div>
            ) : (
              <div className="h-80 w-full bg-gray-50 rounded-xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                  >
                    <defs>
                    <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#880808" stopOpacity={0.3}/> 
                      <stop offset="95%" stopColor="#880808" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(dateStr) =>
                        new Date(dateStr).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }
                      interval={4}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <YAxis 
                      allowDecimals={false} 
                      tick={{ fontSize: 12, fill: '#6b7280' }} 
                    />
                    <Tooltip
                      contentStyle={{ 
                        borderRadius: '8px', 
                        boxShadow: 'var(--shadow-md)', 
                        border: 'none' 
                      }}
                      labelFormatter={(dateStr) =>
                        new Date(dateStr).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                        })
                      }
                      formatter={(value: number) => [value, 'Logins']}
                    />
                    <Area
                      type="monotone"
                      dataKey="value" 
                      stroke="#880808" 
                      strokeWidth={2.5}
                      fill="url(#areaColor)" 
                      dot={{ r: 2, fill: '#880808' }}    
                      activeDot={{ r: 4, fill: '#880808' }} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-2 text-center">
              Daily activity trends
            </p>
          </div>

          {/* Col 1.2: User Roles (Donut) */}
          <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m) h-[450px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-1 font-bold text-gray-900">
                User Roles
              </h2>
            </div>
            {isLoading ? (
              <div className="h-96 flex items-center justify-center bg-gray-50 rounded-xl">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon"></div>
              </div>
            ) : (
              <DonutChartComponent 
                buyers={stats.totalBuyers} 
                sellers={stats.totalSellers} 
              />
            )}
            <p className="text-sm text-gray-500 mt-2 text-center">
              Buyer vs. Seller distribution
            </p>
          </div>
        </div>

        {/* --- Row 2: Top Brands & Car Status --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-(--space-m) mb-(--space-l)">

          {/* Col 2.1: Car Status (Donut) */}
          <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m) h-[450px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-1 font-bold text-gray-900">
                Car Status
              </h2>
            </div>
            {isLoading ? (
                <div className="h-96 flex items-center justify-center bg-gray-50 rounded-xl">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon"></div>
                </div>
            ) : (
              <CarStatusDonutChart 
                active={stats.activeCars} 
                sold={stats.soldCars} 
              />
            )}
            <p className="text-sm text-gray-500 mt-2 text-center">
              Active vs. Sold listings
            </p>
          </div>

          {/* Col 2.2: Top 10 Brands (Bar) */}
          <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m) h-[450px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-1 font-bold text-gray-900">
                Top 10 Brands
              </h2>
            </div>
            {isLoading ? (
              <div className="h-96 flex items-center justify-center bg-gray-50 rounded-xl">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon"></div>
              </div>
            ) : (
              <TopBrandsChart data={topBrandsData} />
            )}
            <p className="text-sm text-gray-500 mt-2 text-center">
              Top 10 active listings by brand
            </p>
          </div>

        </div>


        <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m) mt-(--space-l)">
            {/* Recent Reports */}
          <div className="bg-white rounded-3xl shadow-[var(--shadow-md)] p-(--space-m)">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-1 font-bold text-gray-900">Recent Reports</h2>
              <Link
                href="/admin/reports"
                className="text-sm text-maroon hover:underline"
              >
                View all →
              </Link>
            </div>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon"></div>
              </div>
            ) : recentReports.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <p>No recent reports</p>
              </div>
            ) : (
              <div className="space-y-(--space-s) max-h-64 overflow-y-auto">
                {recentReports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/admin/reports?id=${report.id}`}
                    className="flex items-start gap-(--space-s) p-(--space-s) bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div
                      className={`p-2 rounded-full flex-shrink-0 ${
                        report.type === "user" ? "bg-red-100" : "bg-orange-100"
                      }`}
                    >
                      {report.type === "user" ? (
                        <svg
                          className="w-5 h-5 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-orange-600"
                          viewBox="0 0 24.00 24.00"
                          fill="none"
                        >
                          <path
                            d="M3 8L5.72187 10.2682C5.90158 10.418 6.12811 10.5 6.36205 10.5H17.6379C17.8719 10.5 18.0984 10.418 18.2781 10.2682L21 8M6.5 14H6.51M17.5 14H17.51M8.16065 4.5H15.8394C16.5571 4.5 17.2198 4.88457 17.5758 5.50772L20.473 10.5777C20.8183 11.1821 21 11.8661 21 12.5623V18.5C21 19.0523 20.5523 19.5 20 19.5H19C18.4477 19.5 18 19.0523 18 18.5V17.5H6V18.5C6 19.0523 5.55228 19.5 5 19.5H4C3.44772 19.5 3 19.0523 3 18.5V12.5623C3 11.8661 3.18166 11.1821 3.52703 10.5777L6.42416 5.50772C6.78024 4.88457 7.44293 4.5 8.16065 4.5ZM7 14C7 14.2761 6.77614 14.5 6.5 14.5C6.22386 14.5 6 14.2761 6 14C6 13.7239 6.22386 13.5 6.5 13.5C6.77614 13.5 7 13.7239 7 14ZM18 14C18 14.2761 17.7761 14.5 17.5 14.5C17.2239 14.5 17 14.2761 17 14C17 13.7239 17.2239 13.5 17.5 13.5C17.7761 13.5 18 13.7239 18 14Z"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-0 font-medium text-gray-900 truncate">
                          {report.type === "user"
                            ? `User #${report.targetId}`
                            : `Car #${report.targetId}`}
                        </p>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            report.status === "pending"
                              ? "bg-orange-100 text-orange-800"
                              : report.status === "resolved"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>
                      <p className="text--1 text-gray-600 truncate">
                        {report.reason}
                      </p>
                      <p className="text--2 text-gray-500 mt-1">
                        Reported by {report.reportedBy} •{" "}
                        {formatTimeAgo(report.createdAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
