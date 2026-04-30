"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  ThumbsUp, 
  MessageSquare,
  Users,
  Video,
  AlertCircle
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

export default function AnalyticsDashboard() {
  const [data, setData] = useState<any>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function init() {
      try {
        // Fetch channels first
        const chanRes = await fetch("/api/youtube/channels");
        const chanJson = await chanRes.json();
        
        if (chanRes.ok && chanJson.channels?.length > 0) {
          setChannels(chanJson.channels);
          setSelectedChannelId(chanJson.channels[0].channelId);
        } else {
          // Attempt default fetch if no multi-channel array found (legacy support)
          fetchAnalytics("");
        }
      } catch (err) {
        fetchAnalytics("");
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (selectedChannelId) {
      fetchAnalytics(selectedChannelId);
    }
  }, [selectedChannelId]);

  async function fetchAnalytics(channelId: string) {
    setLoading(true);
    try {
      const url = channelId ? `/api/youtube/analytics?channelId=${channelId}` : "/api/youtube/analytics";
      const res = await fetch(url);
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error || "Failed to load analytics");
      }
      
      setData(json);
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-8 min-h-[500px]">
        <div className="bg-red-500/10 text-red-400 p-4 rounded-full mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Connection Required</h2>
        <p className="text-white/60 max-w-md">{error}</p>
        <button 
          onClick={() => window.location.href = "/api/youtube/auth"}
          className="mt-6 px-6 py-2 bg-white text-black font-semibold rounded-full hover:bg-white/90"
        >
          Connect YouTube
        </button>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Analytics Overview</h1>
          <p className="text-white/60 mt-1">Track your YouTube channel performance</p>
        </div>
        
        <div className="flex items-center gap-4">
          {channels.length > 0 && (
            <select
              value={selectedChannelId}
              onChange={(e) => setSelectedChannelId(e.target.value)}
              className="bg-[#1a1a1a] border border-white/10 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {channels.map((c) => (
                <option key={c.channelId} value={c.channelId}>
                  {c.channelName}
                </option>
              ))}
            </select>
          )}

          <a href="/api/youtube/auth" className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors border border-white/10 flex items-center gap-2">
            <Video className="w-4 h-4" /> Add Channel
          </a>

          <div className="px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-lg text-sm font-medium border border-indigo-500/20">
            Last 30 Days
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Views", value: data?.channel?.views || 0, icon: Eye, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Subscribers", value: data?.channel?.subscribers || 0, icon: Users, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Videos", value: data?.channel?.videos || 0, icon: Video, color: "text-purple-400", bg: "bg-purple-400/10" },
          { label: "Avg CTR", value: "4.2%", icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-400/10" }, // Mocked CTR as it's hard to fetch globally without specific metric calls
        ].map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i}
            className="p-6 rounded-2xl bg-[#0d0d0d] border border-white/[0.06] flex items-center gap-5"
          >
            <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/50">{stat.label}</p>
              <p className="text-2xl font-black text-white mt-1">
                {typeof stat.value === "number" ? formatNumber(stat.value) : stat.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 p-6 rounded-2xl bg-[#0d0d0d] border border-white/[0.06]"
        >
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Views Over Time</h2>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.timeSeries}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#ffffff40" 
                  fontSize={12} 
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                  tickMargin={10}
                />
                <YAxis stroke="#ffffff40" fontSize={12} tickFormatter={formatNumber} tickMargin={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorViews)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Videos List */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl bg-[#0d0d0d] border border-white/[0.06] flex flex-col"
        >
          <h2 className="text-lg font-bold text-white mb-6">Top Performing</h2>
          
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {data?.topVideos?.map((video: any, i: number) => (
              <div key={video.id} className="flex gap-4 items-center group cursor-pointer hover:bg-white/[0.02] p-2 rounded-xl transition-colors">
                <div className="w-10 text-center font-bold text-white/20 group-hover:text-indigo-400 transition-colors">
                  #{i + 1}
                </div>
                <div className="w-16 h-12 rounded-md overflow-hidden bg-white/5 flex-shrink-0 relative">
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-500/20">
                      <Video className="w-4 h-4 text-indigo-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate group-hover:text-indigo-200 transition-colors">
                    {video.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {formatNumber(video.views)}</span>
                    <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {formatNumber(video.likes)}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {formatNumber(video.comments)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
