import React, { useState, useEffect } from 'react';
import {
  Phone,
  Globe,
  TrendingUp,
  Clock,
  Users,
  MapPin,
  BarChart3,
  Eye,
  MousePointer,
  Timer,
  ExternalLink,
  Calendar,
  Target,
  Activity,
  Smartphone,
  Monitor
} from 'lucide-react';
import { AnalyticsChart } from './AnalyticsChart';

interface PhoneMetrics {
  totalCalls: number;
  avgDuration: string;
  peakHours: string;
  conversionRate: number;
  callSources: Array<{
    source: string;
    calls: number;
    percentage: number;
  }>;
  recentCalls: Array<{
    id: string;
    duration: string;
    source: string;
    timestamp: string;
    converted: boolean;
  }>;
}

interface WebsiteMetrics {
  pageViews: number;
  uniqueVisitors: number;
  avgSessionDuration: string;
  bounceRate: number;
  conversionRate: number;
  trafficSources: Array<{
    source: string;
    visitors: number;
    percentage: number;
  }>;
  topPages: Array<{
    page: string;
    views: number;
    avgTime: string;
  }>;
}

interface TrackingDashboardProps {
  trackId: string;
  timeframe?: '7d' | '30d' | '90d';
}

export const TrackingDashboard: React.FC<TrackingDashboardProps> = ({
  trackId,
  timeframe = '30d'
}) => {
  const [phoneMetrics, setPhoneMetrics] = useState<PhoneMetrics | null>(null);
  const [websiteMetrics, setWebsiteMetrics] = useState<WebsiteMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadTrackingData();
  }, [trackId, timeframe]);

  const loadTrackingData = async () => {
    try {
      // Simulate API calls to tracking services
      // In production, these would connect to actual tracking APIs
      
      const mockPhoneMetrics: PhoneMetrics = {
        totalCalls: 247,
        avgDuration: '4:32',
        peakHours: '2-4 PM',
        conversionRate: 23.5,
        callSources: [
          { source: 'Google Ads', calls: 89, percentage: 36 },
          { source: 'Website', calls: 67, percentage: 27 },
          { source: 'Social Media', calls: 45, percentage: 18 },
          { source: 'Direct', calls: 46, percentage: 19 }
        ],
        recentCalls: [
          { id: '1', duration: '5:23', source: 'Google Ads', timestamp: '2h ago', converted: true },
          { id: '2', duration: '2:15', source: 'Website', timestamp: '4h ago', converted: false },
          { id: '3', duration: '8:45', source: 'Social Media', timestamp: '6h ago', converted: true }
        ]
      };

      const mockWebsiteMetrics: WebsiteMetrics = {
        pageViews: 15420,
        uniqueVisitors: 8934,
        avgSessionDuration: '3:45',
        bounceRate: 34.2,
        conversionRate: 12.8,
        trafficSources: [
          { source: 'Organic Search', visitors: 3574, percentage: 40 },
          { source: 'Direct', visitors: 2680, percentage: 30 },
          { source: 'Social Media', visitors: 1787, percentage: 20 },
          { source: 'Paid Ads', visitors: 893, percentage: 10 }
        ],
        topPages: [
          { page: '/track-profile', views: 5420, avgTime: '4:23' },
          { page: '/events', views: 3210, avgTime: '2:45' },
          { page: '/schedule', views: 2890, avgTime: '3:12' }
        ]
      };

      setPhoneMetrics(mockPhoneMetrics);
      setWebsiteMetrics(mockWebsiteMetrics);
    } catch (error) {
      console.error('Error loading tracking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const phoneChartData = [
    { date: '2025-01-01', value: 23 },
    { date: '2025-01-02', value: 31 },
    { date: '2025-01-03', value: 28 },
    { date: '2025-01-04', value: 45 },
    { date: '2025-01-05', value: 38 },
    { date: '2025-01-06', value: 52 },
    { date: '2025-01-07', value: 41 }
  ];

  const websiteChartData = [
    { date: '2025-01-01', value: 1420 },
    { date: '2025-01-02', value: 1680 },
    { date: '2025-01-03', value: 1523 },
    { date: '2025-01-04', value: 1890 },
    { date: '2025-01-05', value: 1745 },
    { date: '2025-01-06', value: 2100 },
    { date: '2025-01-07', value: 1967 }
  ];

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-800 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Tracking & Analytics</h2>
          <select
            value={timeframe}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-600/20">
                <Phone className="h-5 w-5 text-blue-400" />
              </div>
              <div className="text-green-400 text-sm">+15.7%</div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{phoneMetrics?.totalCalls}</div>
            <div className="text-sm text-gray-400">Total Calls</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-green-600/20">
                <Timer className="h-5 w-5 text-green-400" />
              </div>
              <div className="text-green-400 text-sm">+8.3%</div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{phoneMetrics?.avgDuration}</div>
            <div className="text-sm text-gray-400">Avg Call Duration</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-purple-600/20">
                <Eye className="h-5 w-5 text-purple-400" />
              </div>
              <div className="text-green-400 text-sm">+12.1%</div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{websiteMetrics?.pageViews.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Page Views</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-orange-600/20">
                <Users className="h-5 w-5 text-orange-400" />
              </div>
              <div className="text-green-400 text-sm">+9.4%</div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{websiteMetrics?.uniqueVisitors.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Unique Visitors</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-900 p-1 rounded-lg">
        {['overview', 'phone', 'website', 'conversion'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
              activeTab === tab
                ? 'bg-fedex-orange text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Phone Analytics */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Phone className="h-5 w-5 mr-2 text-blue-400" />
              Phone Analytics
            </h3>
            <AnalyticsChart
              title="Daily Call Volume"
              data={phoneChartData}
              type="line"
              color="#3B82F6"
              height={200}
            />
          </div>

          {/* Website Analytics */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Globe className="h-5 w-5 mr-2 text-purple-400" />
              Website Analytics
            </h3>
            <AnalyticsChart
              title="Daily Page Views"
              data={websiteChartData}
              type="area"
              color="#8B5CF6"
              height={200}
            />
          </div>
        </div>
      )}

      {activeTab === 'phone' && phoneMetrics && (
        <div className="space-y-6">
          {/* Call Sources */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Call Sources</h3>
            <div className="space-y-4">
              {phoneMetrics.callSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-purple-500' : 'bg-orange-500'
                    }`}></div>
                    <span className="text-white">{source.source}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">{source.calls} calls</div>
                    <div className="text-sm text-gray-400">{source.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Calls */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Calls</h3>
            <div className="space-y-3">
              {phoneMetrics.recentCalls.map(call => (
                <div key={call.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${call.converted ? 'bg-green-600/20' : 'bg-gray-600/20'}`}>
                      <Phone className={`h-4 w-4 ${call.converted ? 'text-green-400' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Duration: {call.duration}</div>
                      <div className="text-sm text-gray-400">Source: {call.source}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">{call.timestamp}</div>
                    <div className={`text-xs font-semibold ${call.converted ? 'text-green-400' : 'text-gray-400'}`}>
                      {call.converted ? 'Converted' : 'No conversion'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900 rounded-xl p-6">
              <h4 className="font-semibold text-white mb-3">Peak Hours</h4>
              <div className="text-2xl font-bold text-blue-400 mb-1">{phoneMetrics.peakHours}</div>
              <div className="text-sm text-gray-400">Highest call volume</div>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6">
              <h4 className="font-semibold text-white mb-3">Conversion Rate</h4>
              <div className="text-2xl font-bold text-green-400 mb-1">{phoneMetrics.conversionRate}%</div>
              <div className="text-sm text-gray-400">Calls to bookings</div>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6">
              <h4 className="font-semibold text-white mb-3">Avg Duration</h4>
              <div className="text-2xl font-bold text-purple-400 mb-1">{phoneMetrics.avgDuration}</div>
              <div className="text-sm text-gray-400">Per call</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'website' && websiteMetrics && (
        <div className="space-y-6">
          {/* Traffic Sources */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Traffic Sources</h3>
            <div className="space-y-4">
              {websiteMetrics.trafficSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${
                      index === 0 ? 'bg-green-500' :
                      index === 1 ? 'bg-blue-500' :
                      index === 2 ? 'bg-purple-500' : 'bg-orange-500'
                    }`}></div>
                    <span className="text-white">{source.source}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">{source.visitors.toLocaleString()}</div>
                    <div className="text-sm text-gray-400">{source.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Pages */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Pages</h3>
            <div className="space-y-3">
              {websiteMetrics.topPages.map((page, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-purple-600/20">
                      <Globe className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">{page.page}</div>
                      <div className="text-sm text-gray-400">Avg time: {page.avgTime}</div>
                    </div>
                  </div>
                  <div className="text-white font-semibold">{page.views.toLocaleString()} views</div>
                </div>
              ))}
            </div>
          </div>

          {/* Website Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900 rounded-xl p-6">
              <h4 className="font-semibold text-white mb-3">Session Duration</h4>
              <div className="text-2xl font-bold text-purple-400 mb-1">{websiteMetrics.avgSessionDuration}</div>
              <div className="text-sm text-gray-400">Average time on site</div>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6">
              <h4 className="font-semibold text-white mb-3">Bounce Rate</h4>
              <div className="text-2xl font-bold text-orange-400 mb-1">{websiteMetrics.bounceRate}%</div>
              <div className="text-sm text-gray-400">Single page visits</div>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6">
              <h4 className="font-semibold text-white mb-3">Conversion Rate</h4>
              <div className="text-2xl font-bold text-green-400 mb-1">{websiteMetrics.conversionRate}%</div>
              <div className="text-sm text-gray-400">Visitors to inquiries</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'conversion' && (
        <div className="space-y-6">
          {/* Conversion Funnel */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Conversion Funnel</h3>
            <div className="space-y-4">
              {[
                { stage: 'Website Visitors', count: websiteMetrics?.uniqueVisitors || 0, percentage: 100 },
                { stage: 'Contact Page Views', count: Math.round((websiteMetrics?.uniqueVisitors || 0) * 0.25), percentage: 25 },
                { stage: 'Phone Calls', count: phoneMetrics?.totalCalls || 0, percentage: 12 },
                { stage: 'Event Bookings', count: Math.round((phoneMetrics?.totalCalls || 0) * 0.235), percentage: 3 }
              ].map((stage, index) => (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-blue-600' :
                        index === 1 ? 'bg-purple-600' :
                        index === 2 ? 'bg-orange-600' : 'bg-green-600'
                      }`}>
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                      <span className="text-white font-semibold">{stage.stage}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">{stage.count.toLocaleString()}</div>
                      <div className="text-sm text-gray-400">{stage.percentage}%</div>
                    </div>
                  </div>
                  {index < 3 && (
                    <div className="absolute left-6 top-full w-0.5 h-4 bg-gray-600"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Optimization Recommendations */}
          <div className="bg-gray-900 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Optimization Recommendations</h3>
            <div className="space-y-4">
              <div className="bg-blue-600/20 border border-blue-600/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">📞 Phone Optimization</h4>
                <p className="text-gray-300 text-sm mb-3">
                  Your phone conversion rate is {phoneMetrics?.conversionRate}%. Industry average is 20-30%.
                </p>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Train staff on effective call handling</li>
                  <li>• Implement call scripts for common inquiries</li>
                  <li>• Add call recording for quality improvement</li>
                </ul>
              </div>

              <div className="bg-purple-600/20 border border-purple-600/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">🌐 Website Optimization</h4>
                <p className="text-gray-300 text-sm mb-3">
                  Your bounce rate is {websiteMetrics?.bounceRate}%. Target is under 40%.
                </p>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Improve page load speeds</li>
                  <li>• Add clear call-to-action buttons</li>
                  <li>• Optimize mobile experience</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Compliance Notice */}
      <div className="bg-yellow-600/20 border border-yellow-600/50 rounded-xl p-4">
        <div className="flex items-center space-x-2 text-yellow-400 text-sm">
          <Activity className="h-4 w-4" />
          <span className="font-semibold">Privacy Compliance:</span>
          <span>All tracking complies with GDPR, CCPA, and applicable privacy laws. User consent is obtained before data collection.</span>
        </div>
      </div>
    </div>
  );
};