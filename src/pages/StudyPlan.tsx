import { motion } from "framer-motion";
import { BookOpen, Clock, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const plans = [
  {
    subject: "Mathematics",
    topics: [
      { name: "Linear Algebra", time: "9:00 - 10:30", done: true },
      { name: "Calculus", time: "11:00 - 12:00", done: true },
      { name: "Statistics", time: "14:00 - 15:00", done: false },
    ],
  },
  {
    subject: "Physics",
    topics: [
      { name: "Mechanics", time: "10:30 - 11:30", done: true },
      { name: "Thermodynamics", time: "13:00 - 14:00", done: false },
    ],
  },
  {
    subject: "Chemistry",
    topics: [
      { name: "Organic Chemistry", time: "15:30 - 16:30", done: false },
      { name: "Periodic Table Review", time: "17:00 - 17:30", done: false },
    ],
  },
  {
    subject: "English",
    topics: [
      { name: "Essay Writing", time: "18:00 - 19:00", done: false },
    ],
  },
];

const StudyPlan = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-bold font-display flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" /> Study Plan
        </h1>
        <p className="text-muted-foreground mt-1">Your daily subjects and time slots</p>
      </motion.div>

      <div className="space-y-4">
        {plans.map((plan, i) => {
          const completed = plan.topics.filter((t) => t.done).length;
          const progress = Math.round((completed / plan.topics.length) * 100);
          return (
            <motion.div key={plan.subject} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold font-display text-lg">{plan.subject}</h3>
                <span className="text-xs text-muted-foreground">{completed}/{plan.topics.length} done</span>
              </div>
              <Progress value={progress} className="h-1.5 mb-4" />
              <div className="space-y-2">
                {plan.topics.map((topic) => (
                  <div key={topic.name} className={`flex items-center gap-3 p-3 rounded-lg ${topic.done ? "bg-success/5 border border-success/10" : "bg-secondary/30 border border-border/20"}`}>
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${topic.done ? "text-success" : "text-muted-foreground/30"}`} />
                    <span className={`text-sm flex-1 ${topic.done ? "line-through text-muted-foreground" : ""}`}>{topic.name}</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {topic.time}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default StudyPlan;
