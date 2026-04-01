import { useState } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Plus, X, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface GeneratedSlot {
  time: string;
  subject: string;
  duration: string;
  type: string;
}

const AISchedule = () => {
  const [subjects, setSubjects] = useState<string[]>([""]);
  const [availableHours, setAvailableHours] = useState("4");
  const [goal, setGoal] = useState("balanced");
  const [schedule, setSchedule] = useState<GeneratedSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addSubject = () => setSubjects([...subjects, ""]);
  const removeSubject = (i: number) => setSubjects(subjects.filter((_, idx) => idx !== i));
  const updateSubject = (i: number, val: string) => {
    const updated = [...subjects];
    updated[i] = val;
    setSubjects(updated);
  };

  const generateSchedule = () => {
    const validSubjects = subjects.filter((s) => s.trim());
    if (validSubjects.length === 0) {
      toast({ title: "Error", description: "Add at least one subject", variant: "destructive" });
      return;
    }
    setLoading(true);
    // Simulated AI generation
    setTimeout(() => {
      const hours = parseInt(availableHours);
      const slots: GeneratedSlot[] = [];
      let currentHour = 9;
      validSubjects.forEach((sub, i) => {
        const dur = Math.max(0.5, Math.round((hours / validSubjects.length) * 2) / 2);
        slots.push({
          time: `${currentHour}:00`,
          subject: sub,
          duration: `${dur}h`,
          type: i % 2 === 0 ? "Deep Focus" : "Active Recall",
        });
        currentHour += dur + 0.5;
        if (i < validSubjects.length - 1) {
          slots.push({ time: `${currentHour - 0.5}:00`, subject: "Break", duration: "30min", type: "Rest" });
        }
      });
      setSchedule(slots);
      setLoading(false);
      toast({ title: "Schedule Generated!", description: "Your AI study plan is ready" });
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-bold font-display flex items-center gap-3">
          <BrainCircuit className="h-8 w-8 text-primary" /> AI Schedule Generator
        </h1>
        <p className="text-muted-foreground mt-1">Let AI create your optimal study schedule</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-5">
        <div className="space-y-3">
          <Label className="text-foreground/80">Subjects</Label>
          {subjects.map((sub, i) => (
            <div key={i} className="flex gap-2">
              <Input value={sub} onChange={(e) => updateSubject(i, e.target.value)} placeholder={`Subject ${i + 1}`} className="bg-secondary border-border h-10" />
              {subjects.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeSubject(i)} className="shrink-0 text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addSubject} className="border-dashed border-border text-muted-foreground">
            <Plus className="h-4 w-4 mr-1" /> Add Subject
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <Label className="text-foreground/80">Study Goal</Label>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="exam-prep">Exam Preparation</SelectItem>
                <SelectItem value="deep-learning">Deep Learning</SelectItem>
                <SelectItem value="revision">Quick Revision</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={generateSchedule} disabled={loading} className="w-full bg-primary text-primary-foreground h-11 glow-primary">
          {loading ? (
            <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 animate-spin" /> Generating...</span>
          ) : (
            <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Generate Schedule</span>
          )}
        </Button>
      </motion.div>

      {schedule.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h2 className="text-lg font-semibold font-display mb-4">Your AI-Generated Schedule</h2>
          <div className="space-y-2">
            {schedule.map((slot, i) => (
              <div key={i} className={`flex items-center gap-4 p-3 rounded-lg ${slot.subject === "Break" ? "bg-warning/5 border border-warning/10" : "bg-secondary/50 border border-border/30"}`}>
                <Clock className={`h-4 w-4 shrink-0 ${slot.subject === "Break" ? "text-warning" : "text-primary"}`} />
                <span className="text-sm text-muted-foreground w-16">{slot.time}</span>
                <span className="text-sm font-medium flex-1">{slot.subject}</span>
                <span className="text-xs text-muted-foreground">{slot.duration}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${slot.subject === "Break" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}>{slot.type}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AISchedule;
