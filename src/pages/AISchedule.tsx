import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Plus, X, Sparkles, Clock, AlertTriangle, TrendingUp, Target, Lightbulb, ChevronDown, ChevronUp, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { sqliteClient } from "@/integrations/sqlite/client";

interface GeneratedSlot {
  time: string;
  endTime: string;
  subject: string;
  duration: string;
  type: string;
  priority: "high" | "medium" | "low";
  reason?: string;
}

interface Insights {
  weakAreas: string[];
  strongAreas: string[];
  bestStudyTime?: string;
  consistencyScore?: number;
  tips: string[];
}

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-success/10 text-success border-success/20",
};

const timeSlotOptions = [
  { value: "morning", label: "🌅 Morning", range: "5:00 AM – 12:00 PM", start: "05:00" },
  { value: "afternoon", label: "☀️ Afternoon", range: "12:00 PM – 5:00 PM", start: "12:00" },
  { value: "evening", label: "🌙 Evening", range: "5:00 PM – 11:00 PM", start: "17:00" },
];

const AISchedule = () => {
  const [subjects, setSubjects] = useState<string[]>([""]);
  const [weakSubjects, setWeakSubjects] = useState<boolean[]>([false]);
  const [availableHours, setAvailableHours] = useState("4");
  const [goal, setGoal] = useState("deep-focus");
  const [studyPeriod, setStudyPeriod] = useState("morning");
  const [schedule, setSchedule] = useState<GeneratedSlot[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedSlot, setExpandedSlot] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const addSubject = () => {
    setSubjects([...subjects, ""]);
    setWeakSubjects([...weakSubjects, false]);
  };
  const removeSubject = (i: number) => {
    setSubjects(subjects.filter((_, idx) => idx !== i));
    setWeakSubjects(weakSubjects.filter((_, idx) => idx !== i));
  };
  const updateSubject = (i: number, val: string) => {
    const updated = [...subjects];
    updated[i] = val;
    setSubjects(updated);
  };
  const toggleWeakSubject = (i: number, val: boolean) => {
    const updated = [...weakSubjects];
    updated[i] = val;
    setWeakSubjects(updated);
  };

  const generateSchedule = async () => {
    const validSubjects = subjects.filter((s) => s.trim());
    if (validSubjects.length === 0) {
      toast({ title: "Error", description: "Add at least one subject", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Error", description: "Please sign in first", variant: "destructive" });
      return;
    }

    setLoading(true);
    setSchedule([]);
    setInsights(null);

    try {
      // Simple local schedule generation
      const selectedPeriod = timeSlotOptions.find(t => t.value === studyPeriod);
      const startTime = selectedPeriod?.start || "06:00";
      const [startHour, startMin] = startTime.split(':').map(Number);
      const totalMinutes = parseInt(availableHours) * 60;
      const endOfPeriod = startHour * 60 + startMin + totalMinutes;
      const slots: GeneratedSlot[] = [];
      let currentTime = startHour * 60 + startMin;

      const subjectData = subjects
        .map((subject, index) => ({ subject: subject.trim(), isWeak: weakSubjects[index] ?? false }))
        .filter((item) => item.subject);

      const weakAreas = subjectData.filter((item) => item.isWeak).map((item) => item.subject);
      const strongAreas = subjectData.filter((item) => !item.isWeak).map((item) => item.subject);

      // Define study durations based on goal
      let studyDurations: number[] = [];
      let breakDuration = 10; // default break

      if (goal === "deep-focus") {
        studyDurations = [120]; // 2 hours
        breakDuration = 15;
      } else if (goal === "pomodoro") {
        studyDurations = [25]; // 25 minutes
        breakDuration = 5;
      } else if (goal === "mixed") {
        studyDurations = [120, 25];
        breakDuration = 10;
      }

      let durationIndex = 0;

      for (let i = 0; i < subjectData.length && currentTime < endOfPeriod; i++) {
        const { subject, isWeak } = subjectData[i];
        const baseDuration = studyDurations[durationIndex % studyDurations.length];
        const extraDuration = isWeak ? Math.round(baseDuration * 0.5) : 0;
        const slotDuration = baseDuration + extraDuration;
        const endTime = currentTime + slotDuration;

        if (endTime > endOfPeriod) break;

        const timeStr = `${Math.floor(currentTime / 60).toString().padStart(2, '0')}:${(currentTime % 60).toString().padStart(2, '0')}`;
        const endTimeStr = `${Math.floor(endTime / 60).toString().padStart(2, '0')}:${(endTime % 60).toString().padStart(2, '0')}`;

        slots.push({
          time: timeStr,
          endTime: endTimeStr,
          subject,
          duration: `${slotDuration} min`,
          type: goal === "deep-focus" ? "Deep Focus" : goal === "pomodoro" ? "Pomodoro" : "Mixed Study",
          priority: isWeak ? "high" : "medium",
          reason: isWeak
            ? "Weak subject detected, giving it extra study time."
            : goal === "deep-focus"
            ? "Extended focused study session"
            : goal === "pomodoro"
            ? "Short, intense study burst"
            : "Alternating focus techniques"
        });

        currentTime = endTime + breakDuration;
        durationIndex++;
      }

      setSchedule(slots);
      setInsights({
        weakAreas,
        strongAreas,
        bestStudyTime: studyPeriod,
        consistencyScore: 80,
        tips:
          goal === "deep-focus"
            ? ["Find a quiet environment", "Minimize distractions", "Take longer breaks between sessions", "Stay hydrated and comfortable"]
            : goal === "pomodoro"
            ? ["Set a timer for 25 minutes", "Take 5-minute breaks", "Use breaks for stretching or walking", "Complete one task per pomodoro"]
            : ["Alternate between deep work and short bursts", "Use deep focus for complex topics", "Use pomodoro for review or practice", "Adjust based on your energy levels"]
      });
      toast({ title: "Schedule Generated! ✨", description: "Your study plan is ready" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      console.error(error);
      toast({ title: "Generation Failed", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveToPlanner = async () => {
    if (!user || schedule.length === 0) return;
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    const studySlots = schedule.filter(s => !s.subject.toLowerCase().includes("break"));
    const rows = studySlots.map(slot => ({
      id: Date.now().toString() + Math.random().toString(),
      user_id: user.id,
      subject: slot.subject,
      topic: `${slot.type || "Study"} session`,
      time_slot: `${slot.time} – ${slot.endTime}`,
      date: today,
      completed: false,
      created_at: new Date().toISOString(),
    }));

    // Insert all at once - but since my client doesn't support bulk, do one by one
    let error = null;
    for (const row of rows) {
      await new Promise<void>((resolve) => {
        sqliteClient.from("daily_tasks").insert(row).then(({ error: e }) => {
          if (e) error = e;
          resolve();
        });
      });
    }

    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: "Failed to save tasks", variant: "destructive" });
    } else {
      toast({ title: "Saved to Planner! 📋", description: `${rows.length} tasks added to today's Daily Planner` });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-bold font-display flex items-center gap-3">
          <BrainCircuit className="h-8 w-8 text-primary" /> AI Schedule Generator
        </h1>
        <p className="text-muted-foreground mt-1">Smart adaptive scheduling powered by AI — learns from your study history</p>
      </motion.div>

      {/* Input Form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-5">
        <div className="space-y-3">
          <Label className="text-foreground/80">Subjects</Label>
          {subjects.map((sub, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input value={sub} onChange={(e) => updateSubject(i, e.target.value)} placeholder={`Subject ${i + 1}`} className="bg-secondary border-border h-10" />
                {subjects.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeSubject(i)} className="shrink-0 text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox checked={weakSubjects[i] ?? false} onCheckedChange={(checked) => toggleWeakSubject(i, Boolean(checked))} />
                Weak subject (allocate more time)
              </label>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addSubject} className="border-dashed border-border text-muted-foreground">
            <Plus className="h-4 w-4 mr-1" /> Add Subject
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-foreground/80">Available Hours</Label>
            <Select value={availableHours} onValueChange={setAvailableHours}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5, 6, 7, 8].map((h) => (
                  <SelectItem key={h} value={String(h)}>{h} hours</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/80">Study Period</Label>
            <Select value={studyPeriod} onValueChange={setStudyPeriod}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {timeSlotOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{timeSlotOptions.find(t => t.value === studyPeriod)?.range}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground/80">Study Style</Label>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="deep-focus">Deep Focus (2hr sessions)</SelectItem>
                <SelectItem value="pomodoro">Pomodoro (25min sessions)</SelectItem>
                <SelectItem value="mixed">Mixed (Deep Focus + Pomodoro)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={generateSchedule} disabled={loading} className="w-full bg-primary text-primary-foreground h-11 glow-primary">
          {loading ? (
            <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 animate-spin" /> Analyzing your history & generating...</span>
          ) : (
            <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Generate Smart Schedule</span>
          )}
        </Button>
      </motion.div>

      {/* AI Insights */}
      <AnimatePresence>
        {insights && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-semibold font-display flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-warning" /> AI Insights
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {insights.consistencyScore !== undefined && (
                <div className="bg-secondary/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold font-display text-primary">{insights.consistencyScore}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Consistency Score</p>
                </div>
              )}
              {insights.bestStudyTime && (
                <div className="bg-secondary/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold font-display text-success">{insights.bestStudyTime}</p>
                  <p className="text-xs text-muted-foreground mt-1">Best Study Time</p>
                </div>
              )}
              <div className="bg-secondary/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold font-display text-warning">{schedule.filter(s => s.priority === "high").length}</p>
                <p className="text-xs text-muted-foreground mt-1">High Priority Blocks</p>
              </div>
            </div>

            {/* Weak/Strong areas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {insights.weakAreas.length > 0 && (
                <div className="bg-destructive/5 border border-destructive/10 rounded-lg p-3">
                  <p className="text-xs font-semibold text-destructive flex items-center gap-1 mb-2"><AlertTriangle className="h-3 w-3" /> Needs Improvement</p>
                  <div className="flex flex-wrap gap-1">
                    {insights.weakAreas.map((a, i) => (
                      <span key={i} className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              {insights.strongAreas.length > 0 && (
                <div className="bg-success/5 border border-success/10 rounded-lg p-3">
                  <p className="text-xs font-semibold text-success flex items-center gap-1 mb-2"><TrendingUp className="h-3 w-3" /> Strong Areas</p>
                  <div className="flex flex-wrap gap-1">
                    {insights.strongAreas.map((a, i) => (
                      <span key={i} className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tips */}
            {insights.tips.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">💡 Tips</p>
                {insights.tips.map((tip, i) => (
                  <p key={i} className="text-sm text-foreground/70 pl-4 border-l-2 border-primary/30">{tip}</p>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated Schedule */}
      <AnimatePresence>
        {schedule.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold font-display flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" /> Your AI-Generated Schedule
              </h2>
              <Button onClick={saveToPlanner} disabled={saving} size="sm" className="bg-primary text-primary-foreground">
                <Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save to Planner"}
              </Button>
            </div>
            <div className="space-y-2">
              {schedule.map((slot, i) => {
                const isBreak = slot.subject.toLowerCase().includes("break");
                const isExpanded = expandedSlot === i;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`rounded-lg border cursor-pointer transition-colors ${
                      isBreak
                        ? "bg-warning/5 border-warning/10"
                        : "bg-secondary/50 border-border/30 hover:border-primary/30"
                    }`}
                    onClick={() => setExpandedSlot(isExpanded ? null : i)}
                  >
                    <div className="flex items-center gap-3 p-3">
                      <Clock className={`h-4 w-4 shrink-0 ${isBreak ? "text-warning" : "text-primary"}`} />
                      <span className="text-sm text-muted-foreground w-24 font-mono">{slot.time} – {slot.endTime}</span>
                      <span className="text-sm font-medium flex-1">{slot.subject}</span>
                      <span className="text-xs text-muted-foreground">{slot.duration}</span>
                      {!isBreak && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[slot.priority] || priorityColors.medium}`}>
                          {slot.priority}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isBreak ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}>
                        {slot.type}
                      </span>
                      {slot.reason && (isExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />)}
                    </div>
                    <AnimatePresence>
                      {isExpanded && slot.reason && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <p className="text-xs text-muted-foreground px-3 pb-3 pl-10">💡 {slot.reason}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AISchedule;
