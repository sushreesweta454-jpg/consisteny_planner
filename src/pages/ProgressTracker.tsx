import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Calendar, Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Session {
  task: string;
  duration: number;
  created_at: string;
}

const COLORS = ["hsl(172,66%,50%)", "hsl(262,60%,58%)", "hsl(38,92%,50%)", "hsl(142,71%,45%)", "hsl(0,72%,51%)", "hsl(200,80%,55%)"];

const ProgressTracker = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [tab, setTab] = useState<"month" | "week">("month");

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const { data } = await supabase
        .from("study_sessions")
        .select("task, duration, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (data) setSessions(data);
    };
    fetchAll();
  }, [user]);

  // Daily aggregation
  const dailyMap = useMemo(() => {
    const m: Record<string, number> = {};
    sessions.forEach((s) => {
      const day = s.created_at.split("T")[0];
      m[day] = (m[day] || 0) + s.duration;
    });
    return m;
  }, [sessions]);

  // Calendar heatmap data
  const calendarData = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: { date: string; hours: number; dayOfWeek: number; day: number }[] = [];

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dt = new Date(year, month, d);
      const dateStr = dt.toISOString().split("T")[0];
      days.push({
        date: dateStr,
        hours: (dailyMap[dateStr] || 0) / 3600,
        dayOfWeek: dt.getDay(),
        day: d,
      });
    }
    return { days, startOffset: firstDay.getDay() };
  }, [viewMonth, dailyMap]);

  const maxHours = useMemo(() => Math.max(1, ...calendarData.days.map((d) => d.hours)), [calendarData]);

  // Weekly data
  const weeklyData = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return labels.map((label, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      return { day: label, hours: Math.round(((dailyMap[dateStr] || 0) / 3600) * 10) / 10, date: dateStr };
    });
  }, [dailyMap]);

  const weekTotal = useMemo(() => weeklyData.reduce((sum, d) => sum + d.hours, 0), [weeklyData]);
  const weekAvg = Math.round((weekTotal / 7) * 10) / 10;
  const bestDay = useMemo(() => weeklyData.reduce((best, d) => (d.hours > best.hours ? d : best), weeklyData[0]), [weeklyData]);

  // Subject distribution
  const subjectData = useMemo(() => {
    const m: Record<string, number> = {};
    sessions.forEach((s) => {
      m[s.task] = (m[s.task] || 0) + s.duration;
    });
    const total = Object.values(m).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, secs]) => ({
        name,
        value: Math.round((secs / total) * 100),
        hours: Math.round((secs / 3600) * 10) / 10,
      }));
  }, [sessions]);

  // Sessions for selected date
  const selectedSessions = useMemo(() => {
    if (!selectedDate) return [];
    return sessions.filter((s) => s.created_at.startsWith(selectedDate));
  }, [selectedDate, sessions]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const heatColor = (hours: number) => {
    if (hours === 0) return "bg-secondary/40";
    const intensity = Math.min(hours / maxHours, 1);
    if (intensity < 0.25) return "bg-warning/20";
    if (intensity < 0.5) return "bg-warning/40";
    if (intensity < 0.75) return "bg-warning/60";
    return "bg-warning/90";
  };

  const today = new Date().toISOString().split("T")[0];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-bold font-display flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-primary" /> Progress Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">Track consistency, performance & subject distribution</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["month", "week"] as const).map((t) => (
          <Button key={t} variant={tab === t ? "default" : "outline"} size="sm" onClick={() => setTab(t)} className="capitalize">
            {t}
          </Button>
        ))}
      </div>

      {/* Calendar Heatmap */}
      {tab === "month" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold font-display flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {monthNames[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-xs text-muted-foreground text-center py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: calendarData.startOffset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {calendarData.days.map((d) => (
              <div
                key={d.date}
                onClick={() => setSelectedDate(selectedDate === d.date ? null : d.date)}
                className={`aspect-square rounded-md flex flex-col items-center justify-center cursor-pointer transition-all text-xs
                  ${heatColor(d.hours)}
                  ${d.date === today ? "ring-2 ring-primary" : ""}
                  ${selectedDate === d.date ? "ring-2 ring-accent" : ""}
                  hover:ring-1 hover:ring-primary/50`}
              >
                <span className="font-medium">{d.day}</span>
                {d.hours > 0 && <span className="text-[9px] text-foreground/70">{d.hours.toFixed(1)}h</span>}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 justify-end">
            <span className="text-[10px] text-muted-foreground">Less</span>
            {["bg-secondary/40", "bg-warning/20", "bg-warning/40", "bg-warning/60", "bg-warning/90"].map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
            <span className="text-[10px] text-muted-foreground">More</span>
          </div>
        </motion.div>
      )}

      {/* Selected date detail */}
      {selectedDate && selectedSessions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
          <h3 className="text-sm font-semibold font-display mb-2">Sessions on {selectedDate}</h3>
          <div className="space-y-1">
            {selectedSessions.map((s, i) => (
              <div key={i} className="flex justify-between text-sm p-2 rounded bg-secondary/30">
                <span>{s.task}</span>
                <span className="font-mono text-primary">{formatTime(s.duration)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Weekly Analytics */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
        <h2 className="text-lg font-semibold font-display mb-4">📊 Weekly Analytics</h2>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold font-display text-primary">{Math.round(weekTotal * 10) / 10}h</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold font-display text-success">{weekAvg}h</p>
            <p className="text-xs text-muted-foreground">Daily Avg</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold font-display text-warning flex items-center justify-center gap-1">
              <Trophy className="h-4 w-4" /> {bestDay.day}
            </p>
            <p className="text-xs text-muted-foreground">Best Day</p>
          </div>
        </div>

        {weeklyData.some((d) => d.hours > 0) ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
              <XAxis dataKey="day" tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(222 44% 9%)", border: "1px solid hsl(222 30% 18%)", borderRadius: "8px", color: "hsl(210 40% 96%)" }}
                formatter={(value: number) => [`${value}h`, "Study Time"]}
              />
              <Bar dataKey="hours" fill="hsl(172 66% 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-8">No study data this week yet.</p>
        )}
      </motion.div>

      {/* Trend Line */}
      {weeklyData.some((d) => d.hours > 0) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6">
          <h2 className="text-lg font-semibold font-display mb-4">📈 Weekly Trend</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
              <XAxis dataKey="day" tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(222 44% 9%)", border: "1px solid hsl(222 30% 18%)", borderRadius: "8px", color: "hsl(210 40% 96%)" }}
                formatter={(value: number) => [`${value}h`, "Hours"]}
              />
              <Line type="monotone" dataKey="hours" stroke="hsl(262 60% 58%)" strokeWidth={2} dot={{ fill: "hsl(262 60% 58%)", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Subject Distribution */}
      {subjectData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <h2 className="text-lg font-semibold font-display mb-4">🥧 Subject Distribution</h2>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie data={subjectData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {subjectData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(222 44% 9%)", border: "1px solid hsl(222 30% 18%)", borderRadius: "8px", color: "hsl(210 40% 96%)" }}
                  formatter={(value: number) => [`${value}%`]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2 w-full">
              {subjectData.map((s, i) => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-sm flex-1">{s.name}</span>
                  <span className="text-xs text-muted-foreground">{s.hours}h</span>
                  <span className="text-xs font-semibold text-foreground w-10 text-right">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ProgressTracker;
