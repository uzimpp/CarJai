"use client";
import type { BrandDataPoint } from "@/types/admin";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

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

export default TopBrandsChart;