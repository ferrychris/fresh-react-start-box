import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DataPoint {
  date: string;
  value: number;
  label?: string;
}

interface AnalyticsChartProps {
  title: string;
  data: DataPoint[];
  type: 'line' | 'bar' | 'area';
  color?: string;
  height?: number;
  showTrend?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  title,
  data,
  type = 'line',
  color = '#FF6600',
  height = 200,
  showTrend = true,
  valuePrefix = '',
  valueSuffix = ''
}) => {
  // Calculate trend
  const trend = data.length >= 2 ? 
    ((data[data.length - 1].value - data[0].value) / data[0].value) * 100 : 0;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));

  // Generate SVG path for line chart
  const generatePath = () => {
    if (data.length === 0) return '';
    
    const width = 400;
    const chartHeight = height - 40;
    
    const points = data.map((point, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = chartHeight - ((point.value - minValue) / (maxValue - minValue)) * chartHeight;
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };

  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-400" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-400" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getTrendColor = () => {
    if (trend > 0) return 'text-green-400';
    if (trend < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {showTrend && (
          <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-sm font-semibold">
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div className="relative bg-gray-800 rounded-lg p-4" style={{ height }}>
        {data.length > 0 ? (
          <svg width="100%" height="100%" viewBox={`0 0 400 ${height - 40}`} className="overflow-visible">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Chart line/area */}
            {type === 'line' && (
              <path
                d={generatePath()}
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            
            {type === 'area' && (
              <>
                <path
                  d={`${generatePath()} L 400,${height - 40} L 0,${height - 40} Z`}
                  fill={`${color}20`}
                />
                <path
                  d={generatePath()}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                />
              </>
            )}
            
            {/* Data points */}
            {data.map((point, index) => {
              const x = (index / (data.length - 1)) * 400;
              const y = (height - 40) - ((point.value - minValue) / (maxValue - minValue)) * (height - 40);
              
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="4"
                  fill={color}
                  className="hover:r-6 transition-all cursor-pointer"
                >
                  <title>{`${point.date}: ${valuePrefix}${point.value}${valueSuffix}`}</title>
                </circle>
              );
            })}
          </svg>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No data available</p>
            </div>
          </div>
        )}
      </div>

      {/* Data Summary */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
        <div>
          <div className="text-gray-400">Current</div>
          <div className="font-semibold text-white">
            {valuePrefix}{data[data.length - 1]?.value || 0}{valueSuffix}
          </div>
        </div>
        <div>
          <div className="text-gray-400">Peak</div>
          <div className="font-semibold text-white">
            {valuePrefix}{maxValue}{valueSuffix}
          </div>
        </div>
        <div>
          <div className="text-gray-400">Average</div>
          <div className="font-semibold text-white">
            {valuePrefix}{Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length) || 0}{valueSuffix}
          </div>
        </div>
      </div>
    </div>
  );
};