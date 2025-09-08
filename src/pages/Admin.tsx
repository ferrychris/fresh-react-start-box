import React, { useState } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Eye,
  MessageSquare,
  Flag,
  Settings,
  BarChart3,
  Calendar
} from 'lucide-react';
import { ProfileCompletionTester } from '../components/ProfileCompletionTester';

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = {
    totalUsers: 21694,
    totalRacers: 2847,
    totalRevenue: 485720,
    platformFees: 48572,
    pendingApprovals: 23,
    reportedContent: 7
  };

  const pendingRacers = [
    {
      id: 1,
      name: 'Alex Thompson',
      class: 'Sprint Car',
      location: 'Ohio',
      appliedDate: '2 days ago',
      documents: ['License', 'Insurance', 'ID'],
      followers: 234
    },
    {
      id: 2,
      name: 'Maria Santos',
      class: 'Drag Racing',
      location: 'California', 
      appliedDate: '1 week ago',
      documents: ['License', 'Insurance'],
      followers: 1547
    }
  ];

  const recentActivity = [
    { type: 'signup', user: 'John Doe', action: 'New fan registration', time: '2 hours ago' },
    { type: 'payment', user: 'Racing Fan #123', action: 'Subscribed to Jake Rodriguez', time: '4 hours ago' },
    { type: 'report', user: 'Anonymous', action: 'Reported inappropriate content', time: '6 hours ago' },
    { type: 'approval', user: 'Admin', action: 'Approved racer Mike Williams', time: '1 day ago' }
  ];

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Manage the OnlyRaceFans platform</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {stats.pendingApprovals} Pending
            </div>
            <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-600/20 rounded-lg">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div className="text-green-400 text-sm flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                +12.5%
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">{stats.totalUsers.toLocaleString()}</div>
            <div className="text-gray-400 text-sm">Total Users</div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-600/20 rounded-lg">
                <Users className="h-6 w-6 text-red-500" />
              </div>
              <div className="text-green-400 text-sm flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                +8.2%
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">{stats.totalRacers.toLocaleString()}</div>
            <div className="text-gray-400 text-sm">Active Racers</div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-600/20 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <div className="text-green-400 text-sm flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                +15.7%
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">${stats.totalRevenue.toLocaleString()}</div>
            <div className="text-gray-400 text-sm">Total Revenue</div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-600/20 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-500" />
              </div>
              <div className="text-green-400 text-sm flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                +15.7%
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">${stats.platformFees.toLocaleString()}</div>
            <div className="text-gray-400 text-sm">Platform Fees (10%)</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-900 p-1 rounded-lg">
          {['overview', 'approvals', 'content', 'users', 'profiles', 'analytics'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                activeTab === tab
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Revenue Chart */}
                <div className="bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Revenue Overview</h3>
                  <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                      <p>Revenue analytics chart</p>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 bg-gray-800 rounded-lg">
                        <div className={`p-2 rounded-lg ${
                          activity.type === 'signup' ? 'bg-blue-600/20' :
                          activity.type === 'payment' ? 'bg-green-600/20' :
                          activity.type === 'report' ? 'bg-red-600/20' : 'bg-purple-600/20'
                        }`}>
                          {activity.type === 'signup' && <Users className="h-4 w-4 text-blue-400" />}
                          {activity.type === 'payment' && <DollarSign className="h-4 w-4 text-green-400" />}
                          {activity.type === 'report' && <Flag className="h-4 w-4 text-red-400" />}
                          {activity.type === 'approval' && <CheckCircle className="h-4 w-4 text-purple-400" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.user}</p>
                          <p className="text-sm text-gray-400">{activity.action}</p>
                        </div>
                        <span className="text-sm text-gray-400">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'approvals' && (
              <div className="space-y-6">
                <div className="bg-gray-900 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Pending Racer Approvals</h3>
                    <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {pendingRacers.length} Pending
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {pendingRacers.map(racer => (
                      <div key={racer.id} className="bg-gray-800 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-semibold mb-1">{racer.name}</h4>
                            <p className="text-gray-400 mb-2">{racer.class} • {racer.location}</p>
                            <p className="text-sm text-gray-400">Applied {racer.appliedDate}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-400 mb-1">Followers</div>
                            <div className="font-semibold">{racer.followers}</div>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <div className="text-sm font-medium mb-2">Submitted Documents:</div>
                          <div className="flex space-x-2">
                            {racer.documents.map(doc => (
                              <span key={doc} className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-sm">
                                {doc}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex space-x-3">
                          <button className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors">
                            <CheckCircle className="inline h-4 w-4 mr-2" />
                            Approve
                          </button>
                          <button className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors">
                            <XCircle className="inline h-4 w-4 mr-2" />
                            Reject
                          </button>
                          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors">
                            <Eye className="inline h-4 w-4 mr-2" />
                            Review
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="space-y-6">
                <div className="bg-gray-900 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Content Moderation</h3>
                    <div className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {stats.reportedContent} Reports
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      {
                        id: 1,
                        content: 'Inappropriate language in video description',
                        racer: 'Mike Williams',
                        reporter: 'Anonymous User',
                        date: '2 hours ago',
                        status: 'pending'
                      },
                      {
                        id: 2,
                        content: 'Spam comments on multiple posts',
                        racer: 'Jake Rodriguez',
                        reporter: 'User #1234',
                        date: '1 day ago',
                        status: 'reviewing'
                      }
                    ].map(report => (
                      <div key={report.id} className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold mb-1">{report.content}</h4>
                            <p className="text-sm text-gray-400">
                              Reported against {report.racer} by {report.reporter}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            report.status === 'pending' ? 'bg-orange-600 text-white' : 'bg-blue-600 text-white'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">{report.date}</span>
                          <div className="flex space-x-2">
                            <button className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors">
                              Remove
                            </button>
                            <button className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors">
                              Dismiss
                            </button>
                            <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
                              Review
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profiles' && (
              <div className="space-y-6">
                <ProfileCompletionTester />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors text-left">
                  <AlertTriangle className="inline h-4 w-4 mr-2" />
                  Review Reports ({stats.reportedContent})
                </button>
                <button className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors text-left">
                  <Users className="inline h-4 w-4 mr-2" />
                  Approve Racers ({stats.pendingApprovals})
                </button>
                <button className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors text-left">
                  <MessageSquare className="inline h-4 w-4 mr-2" />
                  Send Announcement
                </button>
                <button className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors text-left">
                  <Settings className="inline h-4 w-4 mr-2" />
                  Platform Settings
                </button>
              </div>
            </div>

            {/* Platform Health */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Platform Health</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Server Status</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                    <span className="text-green-400 text-sm">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Payment System</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                    <span className="text-green-400 text-sm">Operational</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Video Streaming</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
                    <span className="text-yellow-400 text-sm">Slow</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Database</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                    <span className="text-green-400 text-sm">Healthy</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Signups */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Signups</h3>
              <div className="space-y-3">
                {[
                  { name: 'Racing Fan #4567', type: 'Fan', time: '2h ago' },
                  { name: 'Speed Enthusiast', type: 'Fan', time: '4h ago' },
                  { name: 'Track Master', type: 'Fan', time: '6h ago' },
                  { name: 'Alex Thompson', type: 'Racer', time: '1d ago' }
                ].map((signup, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">{signup.name}</div>
                      <div className="text-gray-400">{signup.type}</div>
                    </div>
                    <span className="text-gray-400">{signup.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Announcements */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-3">System Maintenance</h3>
              <p className="text-sm text-blue-100 mb-3">
                Scheduled maintenance window: Feb 20, 2:00-4:00 AM EST
              </p>
              <button className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-colors">
                <Calendar className="inline h-4 w-4 mr-2" />
                Schedule Notice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};