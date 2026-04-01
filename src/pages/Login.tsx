import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const quotes = [
  "The secret of getting ahead is getting started.",
  "It does not matter how slowly you go as long as you do not stop.",
  "Success is the sum of small efforts repeated day in and day out.",
  "Don't watch the clock; do what it does. Keep going.",
];

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    // Store user locally for now (will be replaced with DB)
    const users = JSON.parse(localStorage.getItem("consistify_users") || "[]");
    if (isLogin) {
      const user = users.find((u: any) => u.email === email && u.password === password);
      if (!user) {
        toast({ title: "Error", description: "Invalid credentials", variant: "destructive" });
        return;
      }
      localStorage.setItem("consistify_current", JSON.stringify(user));
    } else {
      if (users.find((u: any) => u.email === email)) {
        toast({ title: "Error", description: "Email already registered", variant: "destructive" });
        return;
      }
      const newUser = { name, email, password, createdAt: new Date().toISOString() };
      users.push(newUser);
      localStorage.setItem("consistify_users", JSON.stringify(users));
      localStorage.setItem("consistify_current", JSON.stringify(newUser));
    }
    toast({ title: isLogin ? "Welcome back!" : "Account created!", description: "Redirecting to dashboard..." });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center max-w-md"
        >
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-primary/20 glow-primary">
              <BookOpen className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl font-bold font-display mb-4 text-gradient-primary">Consistify</h1>
          <p className="text-muted-foreground text-lg mb-8">AI-Powered Study Consistency Planner</p>
          <div className="glass-card p-6 glow-primary">
            <p className="text-foreground/80 italic text-sm">"{randomQuote}"</p>
          </div>
        </motion.div>
        {/* Decorative circles */}
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-primary/5 blur-2xl" />
        <div className="absolute bottom-32 right-10 w-48 h-48 rounded-full bg-accent/5 blur-3xl" />
      </div>

      {/* Right side - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold font-display text-gradient-primary">Consistify</span>
          </div>

          <h2 className="text-3xl font-bold font-display mb-2">{isLogin ? "Welcome back" : "Create account"}</h2>
          <p className="text-muted-foreground mb-8">{isLogin ? "Sign in to continue your streak" : "Start your study journey today"}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground/80">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="bg-secondary border-border focus:border-primary h-12"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/80">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-secondary border-border focus:border-primary h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground/80">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-secondary border-border focus:border-primary h-12 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 glow-primary">
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-muted-foreground text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline font-medium">
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
