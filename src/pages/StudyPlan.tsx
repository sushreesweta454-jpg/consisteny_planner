import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Clock, CheckCircle2, Plus, Trash2, CalendarDays } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DailyTask {
  id: string;
  subject: string;
  topic: string;
  time_slot: string | null;
  completed: boolean;
  date: string;
}

const StudyPlan = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);

  // New task form
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchTasks = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", selectedDate)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load tasks");
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [user, selectedDate]);

  const addTask = async () => {
    if (!user || !subject.trim() || !topic.trim()) {
      toast.error("Subject and topic are required");
      return;
    }
    const { data, error } = await supabase
      .from("daily_tasks")
      .insert({
        user_id: user.id,
        subject: subject.trim(),
        topic: topic.trim(),
        time_slot: timeSlot.trim() || null,
        date: selectedDate,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add task");
    } else {
      setTasks((prev) => [...prev, data]);
      setSubject("");
      setTopic("");
      setTimeSlot("");
      setShowForm(false);
      toast.success("Task added");
    }
  };

  const toggleTask = async (task: DailyTask) => {
    const newCompleted = !task.completed;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: newCompleted } : t))
    );
    const { error } = await supabase
      .from("daily_tasks")
      .update({ completed: newCompleted })
      .eq("id", task.id);

    if (error) {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: !newCompleted } : t))
      );
      toast.error("Failed to update task");
    }
  };

  const deleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const { error } = await supabase.from("daily_tasks").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete task");
      fetchTasks();
    }
  };

  const doneCount = tasks.filter((t) => t.completed).length;
  const allDone = tasks.length > 0 && tasks.every((t) => t.completed);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" /> Daily Planner
          </h1>
          <p className="text-muted-foreground mt-1">
            {tasks.length > 0 ? `${doneCount}/${tasks.length} tasks completed` : "No tasks yet"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto bg-secondary border-border"
          />
        </div>
      </motion.div>

      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="glass-card p-6 text-center border-2 border-success/30 bg-success/5"
          >
            <p className="text-2xl font-bold font-display text-success">
              Your task completed ✅
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              Great job! You finished everything for today.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Task */}
      <div>
        {!showForm ? (
          <Button onClick={() => setShowForm(true)} variant="outline" className="w-full border-dashed border-border text-muted-foreground hover:text-foreground">
            <Plus className="h-4 w-4 mr-2" /> Add Task
          </Button>
        ) : (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="bg-secondary border-border" />
              <Input placeholder="Topic" value={topic} onChange={(e) => setTopic(e.target.value)} className="bg-secondary border-border" />
              <Input placeholder="Time (e.g. 9:00 - 10:30)" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} className="bg-secondary border-border" />
            </div>
            <div className="flex gap-2">
              <Button onClick={addTask} size="sm">Add</Button>
              <Button onClick={() => setShowForm(false)} variant="ghost" size="sm">Cancel</Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : tasks.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No tasks for this date. Add one above!</p>
        ) : (
          tasks.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => toggleTask(task)}
              className={`glass-card p-4 flex items-center gap-4 cursor-pointer transition-all ${
                task.completed ? "bg-success/5 border-success/20" : "hover:border-primary/30"
              }`}
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => toggleTask(task)}
                className="h-5 w-5"
              />
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                  {task.topic}
                </p>
                <p className="text-xs text-muted-foreground">{task.subject}</p>
              </div>
              {task.time_slot && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Clock className="h-3 w-3" />
                  {task.time_slot}
                </div>
              )}
              {task.completed && <CheckCircle2 className="h-4 w-4 text-success shrink-0" />}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudyPlan;
