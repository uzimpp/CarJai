"use client";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
  type PieLabelRenderProps,
} from "recharts";

const UserRolesDonut = ({ buyers, sellers }: { buyers: number, sellers: number }) => {
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
    if (value === 0) {
      return null; 
    }
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
            outerRadius="90%"
            innerRadius="30%"
            fill="#8884d8"
            dataKey="value"
            paddingAngle={5}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number, name: string) => [value, name]} />
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

export default UserRolesDonut;