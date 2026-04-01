import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const ProgressTracker = () => {
  const { user } = useAuth();
  const [weeklyData, setWeeklyData] = useState<{ day: string; hours: number }[]>([]);
  const [totalWeek, setTotalWeek] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 6);

      const { data: sessions } = await supabase
        .from("study_sessions")
        .select("duration, created_at")
        .eq("user_id", user.id)
        .gte("created_at", weekAgo.toISOString());

      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayMap: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekAgo);
        d.setDate(d.getDate() + i);
        dayMap[days[d.getDay()]] = 0;
      }

      let total = 0;
      sessions?.forEach((s) => {
        const d = new Date(s.created_at);
        const dayName = days[d.getDay()];
        const hours = s.duration / 3600;
        dayMap[dayName] = (dayMap[dayName] || 0) + hours;
        total += hours;
      });

      setWeeklyData(Object.entries(dayMap).map(([day, hours]) => ({ day, hours: Math.round(hours * 10) / 10 })));
      setTotalWeek(Math.round(total * 10) / 10);
    };
    fetchData();
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-bold font-display flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-primary" /> Progress Tracker
        </h1>
        <p className="text-muted-foreground mt-1">Visualize your study journey</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <h2 className="text-lg font-semibold font-display mb-4">Weekly Study Hours</h2>
        {weeklyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
              <XAxis dataKey="day" tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(222 44% 9%)", border: "1px solid hsl(222 30% 18%)", borderRadius: "8px", color: "hsl(210 40% 96%)" }} />
              <Bar dataKey="hours" fill="hsl(172 66% 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-8">No study data yet. Track sessions to see progress!</p>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
        <h2 className="text-lg font-semibold font-display mb-4">📊 Insights</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold font-display text-primary">{totalWeek}h</p>
            <p className="text-xs text-muted-foreground mt-1">Total this week</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold font-display text-success">{Math.round(totalWeek / 7 * 10) / 10}h</p>
            <p className="text-xs text-muted-foreground mt-1">Daily average</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold font-display text-warning">
              {weeklyData.length > 0 ? weeklyData.reduce((max, d) => d.hours > max.hours ? d : max, weeklyData[0]).day : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Most productive day</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProgressTracker;
