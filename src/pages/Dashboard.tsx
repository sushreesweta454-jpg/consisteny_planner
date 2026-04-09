import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Clock, Target, TrendingUp, Zap, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import StatCard from "@/components/StatCard";
import { useAuth } from "@/hooks/useAuth";
import { sqliteClient } from "@/integrations/sqlite/client";

const quotes = [
  "The secret of getting ahead is getting started. — Mark Twain",
  "Success is the sum of small efforts repeated day in and day out. — Robert Collier",
  "Don't watch the clock; do what it does. Keep going. — Sam Levenson",
  "It always seems impossible until it's done. — Nelson Mandela",
];

/** Count unique study days and compute the current consecutive-day streak. */
function computeStreakData(sessions: { created_at: string }[]) {
  if (!sessions.length) return { streak: 0, uniqueDays: 0 };

  // Get unique dates (YYYY-MM-DD) sorted descending
  const daySet = new Set(sessions.map((s) => s.created_at.slice(0, 10)));
  const uniqueDays = daySet.size;
  const sorted = Array.from(daySet).sort((a, b) => (a > b ? -1 : 1));

  // Walk backwards from today counting consecutive days
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().slice(0, 10);
    if (sorted[i] === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  return { streak, uniqueDays };
}

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string | null }>({ full_name: null });
  const [totalHours, setTotalHours] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [uniqueDays, setUniqueDays] = useState(0);
  const randomQuote = useMemo(() => quotes[Math.floor(Math.random() * quotes.length)], []);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      sqliteClient.from("profiles").select("full_name").eq("user_id", user.id).single().then(({ data: profileData }) => {
        if (profileData) setProfile(profileData);
      });

      sqliteClient.from("study_sessions").select("duration, created_at").eq("user_id", user.id).then(({ data: sessions }) => {
        if (sessions) {
          setTotalHours(Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / 3600));
          setSessionCount(sessions.length);
          const { streak: s, uniqueDays: d } = computeStreakData(sessions);
          setStreak(s);
          setUniqueDays(d);
        }
      });
    };
    fetchData();
  }, [user]);

  const displayName = profile.full_name || user?.user_metadata?.full_name || "Student";

  // 7 unique study days = 1 "session week"
  const sessionWeeks = Math.floor(uniqueDays / 7);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">Welcome to <span className="text-gradient-primary">CONSISTIFY</span></h1>
          <p className="text-muted-foreground mt-1">Hello, {displayName}! Keep up the great work.</p>
        </div>
        <div className="glass-card px-4 py-2 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-warning" />
          <span className="text-sm font-medium">Level {Math.max(1, sessionWeeks + 1)} Scholar</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Study Streak"
          value={streak > 0 ? `${streak} day${streak > 1 ? "s" : ""}` : "—"}
          subtitle={streak > 0 ? "Consecutive days" : "Start studying to build streaks"}
          icon={Flame}
          variant="warning"
        />
        <StatCard title="Study Days" value={String(uniqueDays)} subtitle={`${sessionWeeks} full week${sessionWeeks !== 1 ? "s" : ""}`} icon={Target} variant="primary" />
        <StatCard title="Total Hours" value={`${totalHours}h`} subtitle="All time" icon={Clock} variant="accent" />
        <StatCard title="Sessions" value={String(sessionCount)} subtitle="Total study sessions" icon={TrendingUp} variant="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <h2 className="text-lg font-semibold font-display mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-warning" /> Streak Rewards
          </h2>
          <div className="space-y-3">
            {[
              { days: 7, reward: "🥉 Bronze Badge", unlocked: streak >= 7 },
              { days: 14, reward: "🥈 Silver Badge", unlocked: streak >= 14 },
              { days: 30, reward: "🥇 Gold Badge", unlocked: streak >= 30 },
              { days: 60, reward: "💎 Diamond Badge", unlocked: streak >= 60 },
            ].map((r) => (
              <div key={r.days} className={`flex items-center justify-between p-3 rounded-lg ${r.unlocked ? "bg-primary/10 border border-primary/20" : "bg-secondary/50"}`}>
                <div className="flex items-center gap-3">
                  <Trophy className={`h-4 w-4 ${r.unlocked ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm ${r.unlocked ? "text-foreground" : "text-muted-foreground"}`}>{r.reward}</span>
                </div>
                <span className="text-xs text-muted-foreground">{r.days} consecutive days</span>
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
