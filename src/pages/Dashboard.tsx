import { motion } from "framer-motion";
import { Flame, Clock, Target, TrendingUp, Zap, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import StatCard from "@/components/StatCard";

const quotes = [
  "The secret of getting ahead is getting started. — Mark Twain",
  "Success is the sum of small efforts repeated day in and day out. — Robert Collier",
  "Don't watch the clock; do what it does. Keep going. — Sam Levenson",
  "It always seems impossible until it's done. — Nelson Mandela",
];

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem("consistify_current") || '{"name":"Student"}');
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">Welcome to <span className="text-gradient-primary">Consistify</span></h1>
          <p className="text-muted-foreground mt-1">Hello, {user.name}! Keep up the great work.</p>
        </div>
        <div className="glass-card px-4 py-2 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-warning" />
          <span className="text-sm font-medium">Level 5 Scholar</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Study Streak" value="12 days" subtitle="Personal best: 18 days" icon={Flame} variant="warning" />
        <StatCard title="Daily Progress" value="68%" subtitle="5 of 7 tasks done" icon={Target} variant="primary" />
        <StatCard title="Total Hours" value="142h" subtitle="This month: 24h" icon={Clock} variant="accent" />
        <StatCard title="Goals Completed" value="23" subtitle="+3 this week" icon={TrendingUp} variant="success" />
      </div>

      {/* Today's Progress */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
        <h2 className="text-lg font-semibold font-display mb-4">Today's Progress</h2>
        <div className="space-y-4">
          {[
            { subject: "Mathematics", progress: 100, time: "1.5h" },
            { subject: "Physics", progress: 60, time: "0.5h" },
            { subject: "Chemistry", progress: 30, time: "0.3h" },
            { subject: "English", progress: 0, time: "0h" },
          ].map((item) => (
            <div key={item.subject} className="flex items-center gap-4">
              <span className="text-sm w-24 text-muted-foreground">{item.subject}</span>
              <Progress value={item.progress} className="flex-1 h-2" />
              <span className="text-xs text-muted-foreground w-12 text-right">{item.time}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Streak Rewards + Quote */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <h2 className="text-lg font-semibold font-display mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-warning" /> Streak Rewards
          </h2>
          <div className="space-y-3">
            {[
              { days: 7, reward: "Bronze Badge", unlocked: true },
              { days: 14, reward: "Silver Badge", unlocked: false },
              { days: 30, reward: "Gold Badge", unlocked: false },
              { days: 60, reward: "Diamond Badge", unlocked: false },
            ].map((r) => (
              <div key={r.days} className={`flex items-center justify-between p-3 rounded-lg ${r.unlocked ? "bg-primary/10 border border-primary/20" : "bg-secondary/50"}`}>
                <div className="flex items-center gap-3">
                  <Trophy className={`h-4 w-4 ${r.unlocked ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm ${r.unlocked ? "text-foreground" : "text-muted-foreground"}`}>{r.reward}</span>
                </div>
                <span className="text-xs text-muted-foreground">{r.days} day streak</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6 flex flex-col justify-center">
          <h2 className="text-lg font-semibold font-display mb-4">💡 Daily Motivation</h2>
          <p className="text-foreground/80 italic leading-relaxed">"{randomQuote}"</p>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
