import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Timer, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Session {
  id: string;
  task: string;
  duration: number;
  created_at: string;
}

const SessionTracker = () => {
  const [task, setTask] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const fetchSessions = async () => {
      const { data } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setSessions(data);
    };
    fetchSessions();
  }, [user]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const startTimer = () => {
    if (!task.trim()) {
      toast({ title: "Error", description: "Enter a task name first", variant: "destructive" });
      return;
    }
    setIsRunning(true);
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    setIntervalId(id);
  };

  const stopTimer = async () => {
    if (intervalId) clearInterval(intervalId);
    setIsRunning(false);
    if (seconds > 0 && user) {
      const { data, error } = await supabase
        .from("study_sessions")
        .insert({ user_id: user.id, task, duration: seconds })
        .select()
        .single();
      if (!error && data) {
        setSessions([data, ...sessions]);
        toast({ title: "Session saved!", description: `${task} — ${formatTime(seconds)}` });
      }
    }
    setSeconds(0);
    setTask("");
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-bold font-display flex items-center gap-3">
          <Timer className="h-8 w-8 text-primary" /> Session Tracker
        </h1>
        <p className="text-muted-foreground mt-1">Track your study sessions in real-time</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 text-center glow-primary">
        <div className="text-6xl font-bold font-display mb-6 text-gradient-primary">{formatTime(seconds)}</div>
        <div className="flex gap-3 justify-center max-w-md mx-auto">
          <Input value={task} onChange={(e) => setTask(e.target.value)} placeholder="What are you studying?" disabled={isRunning} className="bg-secondary border-border h-11" />
          {isRunning ? (
            <Button onClick={stopTimer} variant="destructive" className="h-11 px-6">
              <Square className="h-4 w-4 mr-1" /> Stop
            </Button>
          ) : (
            <Button onClick={startTimer} className="h-11 px-6 bg-primary text-primary-foreground">
              <Play className="h-4 w-4 mr-1" /> Start
            </Button>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
        <h2 className="text-lg font-semibold font-display mb-4">Recent Sessions</h2>
        <div className="space-y-2">
          {sessions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No sessions yet. Start your first study session!</p>
          ) : (
            sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/20">
                <div>
                  <p className="text-sm font-medium">{s.task}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(s.created_at)}</p>
                </div>
                <span className="text-sm font-mono text-primary">{formatTime(s.duration)}</span>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SessionTracker;
