import { useState } from "react";
import { motion } from "framer-motion";
import { Timer, Play, Square, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Session {
  id: number;
  task: string;
  duration: number; // seconds
  date: string;
}

const SessionTracker = () => {
  const [task, setTask] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [sessions, setSessions] = useState<Session[]>([
    { id: 1, task: "Linear Algebra Practice", duration: 5400, date: "Today" },
    { id: 2, task: "Physics Problems", duration: 3600, date: "Today" },
    { id: 3, task: "Chemistry Notes", duration: 1800, date: "Yesterday" },
  ]);
  const { toast } = useToast();

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

  const stopTimer = () => {
    if (intervalId) clearInterval(intervalId);
    setIsRunning(false);
    if (seconds > 0) {
      setSessions([{ id: Date.now(), task, duration: seconds, date: "Today" }, ...sessions]);
      toast({ title: "Session saved!", description: `${task} — ${formatTime(seconds)}` });
    }
    setSeconds(0);
    setTask("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-bold font-display flex items-center gap-3">
          <Timer className="h-8 w-8 text-primary" /> Session Tracker
        </h1>
        <p className="text-muted-foreground mt-1">Track your study sessions in real-time</p>
      </motion.div>

      {/* Timer */}
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

      {/* Session History */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
        <h2 className="text-lg font-semibold font-display mb-4">Recent Sessions</h2>
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/20">
              <div>
                <p className="text-sm font-medium">{s.task}</p>
                <p className="text-xs text-muted-foreground">{s.date}</p>
              </div>
              <span className="text-sm font-mono text-primary">{formatTime(s.duration)}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default SessionTracker;
