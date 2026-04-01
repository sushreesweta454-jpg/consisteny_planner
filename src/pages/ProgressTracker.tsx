import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

const weeklyData = [
  { day: "Mon", hours: 3.5 },
  { day: "Tue", hours: 4.2 },
  { day: "Wed", hours: 2.8 },
  { day: "Thu", hours: 5.0 },
  { day: "Fri", hours: 3.1 },
  { day: "Sat", hours: 4.8 },
  { day: "Sun", hours: 1.5 },
];

const subjectProgress = [
  { subject: "Mathematics", progress: 78, target: "Calculus mastery" },
  { subject: "Physics", progress: 62, target: "Mechanics deep dive" },
  { subject: "Chemistry", progress: 45, target: "Organic reactions" },
  { subject: "English", progress: 88, target: "Essay improvement" },
];

const ProgressTracker = () => (
  <div className="max-w-4xl mx-auto space-y-6">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="text-3xl font-bold font-display flex items-center gap-3">
        <TrendingUp className="h-8 w-8 text-primary" /> Progress Tracker
      </h1>
      <p className="text-muted-foreground mt-1">Visualize your study journey</p>
    </motion.div>

    {/* Weekly Chart */}
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
      <h2 className="text-lg font-semibold font-display mb-4">Weekly Study Hours</h2>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={weeklyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
          <XAxis dataKey="day" tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }} axisLine={false} />
          <YAxis tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }} axisLine={false} />
          <Tooltip contentStyle={{ background: "hsl(222 44% 9%)", border: "1px solid hsl(222 30% 18%)", borderRadius: "8px", color: "hsl(210 40% 96%)" }} />
          <Bar dataKey="hours" fill="hsl(172 66% 50%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>

    {/* Subject Progress */}
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
      <h2 className="text-lg font-semibold font-display mb-4">Subject Completion</h2>
      <div className="space-y-5">
        {subjectProgress.map((s) => (
          <div key={s.subject}>
            <div className="flex justify-between mb-1.5">
              <span className="text-sm font-medium">{s.subject}</span>
              <span className="text-sm text-primary">{s.progress}%</span>
            </div>
            <Progress value={s.progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">Goal: {s.target}</p>
          </div>
        ))}
      </div>
    </motion.div>

    {/* Insights */}
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
      <h2 className="text-lg font-semibold font-display mb-4">📊 Insights</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold font-display text-primary">24.9h</p>
          <p className="text-xs text-muted-foreground mt-1">Total this week</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold font-display text-success">+12%</p>
          <p className="text-xs text-muted-foreground mt-1">vs. last week</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold font-display text-warning">Thu</p>
          <p className="text-xs text-muted-foreground mt-1">Most productive day</p>
        </div>
      </div>
    </motion.div>
  </div>
);

export default ProgressTracker;
