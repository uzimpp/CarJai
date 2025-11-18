"use client";
import type { ChartDataPoint } from "@/types/admin";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const ActivityAreaChart = ({ data }: { data: ChartDataPoint[] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 w-full bg-gray-50 rounded-xl p-4 flex items-center justify-center text-gray-500">
        No activity data
      </div>
    );
  }

  return (
    <div className="h-80 w-full bg-gray-50 rounded-xl p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#880808" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#880808" stopOpacity={0} />
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
            tick={{ fontSize: 12, fill: "#6b7280" }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: "#6b7280" }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              boxShadow: "var(--shadow-md)",
              border: "none",
            }}
            labelFormatter={(dateStr) =>
              new Date(dateStr).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })
            }
            formatter={(value: number) => [value, "Logins"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#880808"
            strokeWidth={2.5}
            fill="url(#areaColor)"
            dot={{ r: 2, fill: "#880808" }}
            activeDot={{ r: 4, fill: "#880808" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ActivityAreaChart;