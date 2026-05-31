import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Dumbbell, QrCode, X } from "lucide-react";
import bgmain from "../../assets/bg-main.jpg";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import type { SafeUser } from "@shared/schema";
import { QRCodeSVG } from "qrcode.react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("admin");
  const [isLoading, setIsLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (username) {
      try {
        const res = await apiRequest("POST", "/api/auth/login", { username, password });
        const { user } = await res.json();
        
        login(user);
        
        toast({
          title: "Login Successful",
          description: `Welcome, ${user.firstName}!`,
        });
        navigate("/dashboard");
        return;
      } catch (error) {
        toast({
          title: "Invalid Credentials",
          description: "Please check your username and password",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }
    
    const demoUser: SafeUser = {
      id: "demo-" + Date.now(),
      username: "demo_" + selectedRole,
      email: `${selectedRole}@demo.gym`,
      firstName: "Demo",
      lastName: selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1),
      phone: "9999999999",
      role: selectedRole as any,
      isActive: true,
      createdAt: new Date(),
    };
    
    login(demoUser);
    
    toast({
      title: "Demo Login",
      description: `Logged in as ${selectedRole}`,
    });
    navigate("/dashboard");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10"
      style={{
        margin: "-25px -50px 0",
        backgroundImage: `linear-gradient(to top, rgb(14 22 41 / 1), rgba(0, 0, 0, 0.5)), url(${bgmain})`,
        backgroundSize: "125%,125%",
        backgroundPositionX: "center, center",
      }}
    >
      <Card
        className="w-full max-w-md shadow-lg border-none"
        style={{
          background: "rgb(18 31 59 / 64%)",
          border: "1px solid rgb(74 87 115 / 64%)",
        }}
      >
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center place-items-center">
            <Dumbbell className="h-12 w-12 text-accent mb-4 " />
            Welcome to Lime Fitness
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Staff Login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                data-testid="input-username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-password"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !username || !password}
              data-testid="button-staff-submit"
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
            
            <div className="text-center pt-4 border-t border-border mt-4">
              <p className="text-sm text-muted-foreground mb-2">Are you a gym member?</p>
              <Link href="/member/login">
                <Button variant="ghost" className="w-full" data-testid="link-member-login">
                  Member Login
                </Button>
              </Link>
              <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
                <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
                <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Floating QR Code Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {showQR && (
          <div className="bg-card/95 backdrop-blur border border-border rounded-xl p-4 shadow-2xl text-center animate-in fade-in slide-in-from-bottom-5 duration-200">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Scan to Enquire
            </p>
            <QRCodeSVG
              value={`${window.location.origin}/self-enquiry`}
              size={160}
              level="M"
              className="mx-auto rounded-lg border border-border/50"
            />
            <p className="text-[10px] text-muted-foreground mt-2 leading-tight">
              Open this page on your phone<br />to fill the enquiry form
            </p>
          </div>
        )}
        <button
          onClick={() => setShowQR(!showQR)}
          className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all flex items-center justify-center"
          aria-label={showQR ? "Close QR code" : "Show QR code for self enquiry"}
        >
          {showQR ? <X className="h-5 w-5" /> : <QrCode className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
