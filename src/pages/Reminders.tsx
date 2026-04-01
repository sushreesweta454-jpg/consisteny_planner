import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Plus, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface Reminder {
  id: number;
  title: string;
  time: string;
  enabled: boolean;
}

const Reminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([
    { id: 1, title: "Morning Study Session", time: "09:00", enabled: true },
    { id: 2, title: "Physics Practice", time: "11:00", enabled: true },
    { id: 3, title: "Afternoon Review", time: "14:00", enabled: false },
    { id: 4, title: "Evening Revision", time: "19:00", enabled: true },
  ]);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");
  const { toast } = useToast();

  const addReminder = () => {
    if (!newTitle.trim() || !newTime) {
      toast({ title: "Error", description: "Fill in title and time", variant: "destructive" });
      return;
    }
    setReminders([...reminders, { id: Date.now(), title: newTitle, time: newTime, enabled: true }]);
    setNewTitle("");
    setNewTime("");
    toast({ title: "Reminder added!" });
  };

  const toggleReminder = (id: number) => {
    setReminders(reminders.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const deleteReminder = (id: number) => {
    setReminders(reminders.filter((r) => r.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-bold font-display flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary" /> Reminder System
        </h1>
        <p className="text-muted-foreground mt-1">Never miss a study session</p>
      </motion.div>

      {/* Add Reminder */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Reminder title" className="bg-secondary border-border h-10 flex-1" />
          <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="bg-secondary border-border h-10 w-32" />
          <Button onClick={addReminder} className="bg-primary text-primary-foreground h-10">
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </motion.div>

      {/* Reminders List */}
      <div className="space-y-2">
        {reminders.map((r, i) => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`glass-card p-4 flex items-center gap-4 ${r.enabled ? "" : "opacity-50"}`}
          >
            <div className={`p-2 rounded-lg ${r.enabled ? "bg-primary/10" : "bg-secondary"}`}>
              <Clock className={`h-4 w-4 ${r.enabled ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{r.title}</p>
              <p className="text-xs text-muted-foreground">{r.time}</p>
            </div>
            <Switch checked={r.enabled} onCheckedChange={() => toggleReminder(r.id)} />
            <Button variant="ghost" size="icon" onClick={() => deleteReminder(r.id)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Reminders;
