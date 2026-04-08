import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Play, Square, Clock, Zap, Coffee, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type StudyMode = "deep-focus" | "pomodoro";

interface ActiveSession {
  startTime: number;
  mode: StudyMode;
}

interface Session {
  id: string;
  task: string;
  duration: number;
  created_at: string;
}

const STORAGE_KEY = "active_study_session";

const SessionTracker = () => {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [mode, setMode] = useState<StudyMode>("deep-focus");
  const [subjectName, setSubjectName] = useState("");
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [pomodoroPhase, setPomodoroPhase] = useState<"study" | "break">("study");
  const { toast } = useToast();
  const { user } = useAuth();

  // Restore active session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: ActiveSession = JSON.parse(saved);
        setActiveSession(parsed);
        setMode(parsed.mode);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Real-time elapsed calculation using timestamps (accurate even if app is minimized)
  useEffect(() => {
    if (!activeSession) {
      setElapsed(0);
      return;
    }
    const tick = () => setElapsed(Math.floor((Date.now() - activeSession.startTime) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeSession]);

  // Fetch today's sessions
  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const fetchToday = async () => {
      const { data } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`)
        .order("created_at", { ascending: false });
      if (data) setTodaySessions(data);
    };
    fetchToday();
  }, [user]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const formatClockTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const startSession = useCallback(() => {
    if (activeSession) return;
    const session: ActiveSession = { startTime: Date.now(), mode };
    setActiveSession(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    toast({ title: "Session started!", description: `${mode === "pomodoro" ? "Pomodoro" : "Deep Focus"} mode` });
  }, [activeSession, mode, toast]);

  const finishSession = useCallback(async () => {
    if (!activeSession || !user) return;
    const endTime = Date.now();
    const duration = Math.floor((endTime - activeSession.startTime) / 1000);
    const modeLabel = activeSession.mode === "pomodoro" ? "Pomodoro" : "Deep Focus";

    const { data, error } = await supabase
      .from("study_sessions")
      .insert({ user_id: user.id, task: modeLabel, duration })
      .select()
      .single();

    if (!error && data) {
      setTodaySessions((prev) => [data, ...prev]);
      toast({ title: "Session saved!", description: `${modeLabel} — ${formatTime(duration)}` });
    }

    setActiveSession(null);
    localStorage.removeItem(STORAGE_KEY);
    setPomodoroPhase("study");
  }, [activeSession, user, toast]);

  const resetSession = useCallback(() => {
    setActiveSession(null);
    localStorage.removeItem(STORAGE_KEY);
    setPomodoroPhase("study");
  }, []);

  // Pomodoro auto-stop at 25 minutes
  useEffect(() => {
    if (!activeSession || mode !== "pomodoro") return;
    if (elapsed >= 25 * 60) {
      finishSession();
    }
  }, [elapsed, activeSession, mode, finishSession]);

  const todayTotal = useMemo(() => todaySessions.reduce((sum, s) => sum + s.duration, 0), [todaySessions]);

  const isRunning = !!activeSession;
  const pomodoroStudyTime = 25 * 60;
  const pomodoroProgress = mode === "pomodoro" && isRunning
    ? Math.min((elapsed % (30 * 60)) / pomodoroStudyTime, 1)
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-bold font-display flex items-center gap-3">
          <Timer className="h-8 w-8 text-primary" /> Session Tracker
        </h1>
        <p className="text-muted-foreground mt-1">Real-time study tracking with accurate timestamps</p>
      </motion.div>

      {/* Mode Selector */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
        <Button
          variant={mode === "deep-focus" ? "default" : "secondary"}
          onClick={() => !isRunning && setMode("deep-focus")}
          disabled={isRunning}
          className="flex-1 h-12"
        >
          <Zap className="h-4 w-4 mr-2" /> Deep Focus
        </Button>
        <Button
          variant={mode === "pomodoro" ? "default" : "secondary"}
          onClick={() => !isRunning && setMode("pomodoro")}
          disabled={isRunning}
          className="flex-1 h-12"
        >
          <Coffee className="h-4 w-4 mr-2" /> Pomodoro
        </Button>
      </motion.div>

      {/* Timer Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-card p-8 text-center ${isRunning ? "glow-primary" : ""}`}
      >
        {/* Pomodoro phase indicator */}
        <AnimatePresence>
          {isRunning && mode === "pomodoro" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <span className={`text-sm font-semibold px-4 py-1.5 rounded-full ${
                pomodoroPhase === "study"
                  ? "bg-primary/20 text-primary"
                  : "bg-accent/20 text-accent"
              }`}>
                {pomodoroPhase === "study" ? "📖 Study Phase" : "☕ Break Time"}
              </span>
              <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden max-w-xs mx-auto">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${pomodoroProgress * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main timer */}
        <div className="text-7xl font-bold font-display mb-6 text-gradient-primary tracking-wider">
          {formatTime(elapsed)}
        </div>

        {/* Start / End time display */}
        {isRunning && activeSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 gap-4 mb-6 max-w-sm mx-auto"
          >
            <div className="glass-card p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Start Time</p>
              <p className="text-sm font-semibold text-foreground">{formatClockTime(activeSession.startTime)}</p>
            </div>
            <div className="glass-card p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Mode</p>
              <p className="text-sm font-semibold text-foreground">
                {mode === "pomodoro" ? "🍅 Pomodoro" : "⚡ Deep Focus"}
              </p>
            </div>
          </motion.div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 justify-center">
          {!isRunning ? (
            <Button onClick={startSession} size="lg" className="h-14 px-10 text-lg bg-primary text-primary-foreground">
              <Play className="h-5 w-5 mr-2" /> Start Session
            </Button>
          ) : (
            <>
              <Button onClick={finishSession} variant="destructive" size="lg" className="h-14 px-8 text-lg">
                <Square className="h-5 w-5 mr-2" /> Finish
              </Button>
              <Button onClick={resetSession} variant="secondary" size="lg" className="h-14 px-6">
                <RotateCcw className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Today's Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-semibold font-display mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" /> Today's Progress
        </h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="glass-card p-4 rounded-lg text-center">
            <p className="text-3xl font-bold text-gradient-primary">{formatTime(todayTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Study Time</p>
          </div>
          <div className="glass-card p-4 rounded-lg text-center">
            <p className="text-3xl font-bold text-gradient-accent">{todaySessions.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Sessions Completed</p>
          </div>
        </div>

        {/* Today's session list */}
        <div className="space-y-2">
          {todaySessions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No sessions today yet. Start your first one!</p>
          ) : (
            todaySessions.map((s) => {
              const endTs = new Date(s.created_at).getTime();
              const startTs = endTs - s.duration * 1000;
              return (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/20">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{s.task === "Pomodoro" ? "🍅" : "⚡"}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.task}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatClockTime(startTs)} → {formatClockTime(endTs)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-mono text-primary">{formatTime(s.duration)}</span>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SessionTracker;
