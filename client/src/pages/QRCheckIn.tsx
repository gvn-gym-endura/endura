import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle, LogOut, Clock, User, Dumbbell, Phone } from "lucide-react";
import bgmain from "@/assets/bg-main.jpg";
import { format } from "date-fns";

type LookupResult = {
  member: {
    id: string;
    name: string;
    age: number | null;
    subscriptionStatus: string;
    plan: string;
    startDate: string;
    endDate: string;
  };
  openAttendance: {
    id: string;
    checkInTime: string;
  } | null;
  alreadyCheckedOut: boolean;
};

type Step = "phone" | "info";

export default function QRCheckIn() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState("00:00:00");
  const { toast } = useToast();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Start live timer when looking at an open attendance
  useEffect(() => {
    if (lookupResult?.openAttendance?.checkInTime) {
      if (timerRef.current) clearInterval(timerRef.current);

      const updateElapsed = () => {
        const now = new Date();
        const [h, m] = lookupResult.openAttendance!.checkInTime.split(":").map(Number);
        const checkIn = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
        const diffMs = now.getTime() - checkIn.getTime();
        if (diffMs <= 0) {
          setElapsed("00:00:00");
          return;
        }
        const totalSec = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSec / 3600);
        const minutes = Math.floor((totalSec % 3600) / 60);
        const secs = totalSec % 60;
        setElapsed(
          `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
        );
      };

      updateElapsed();
      timerRef.current = setInterval(updateElapsed, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsed("00:00:00");
    }
  }, [lookupResult?.openAttendance?.checkInTime]);

  const handleLookup = async () => {
    if (!phone.trim()) {
      toast({ title: "Enter your phone number", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/qr-attendance/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Member not found");
      }

      const data: LookupResult = await res.json();
      setLookupResult(data);
      setStep("info");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!lookupResult) return;
    setIsCheckingIn(true);
    try {
      const now = format(new Date(), "HH:mm");
      const today = format(new Date(), "yyyy-MM-dd");
      await apiRequest("POST", "/api/attendance", {
        memberId: lookupResult.member.id,
        memberName: lookupResult.member.name,
        date: today,
        checkInTime: now,
        method: "QR Self",
      });
      setSuccessMessage(`Checked in at ${now}`);
      toast({ title: "Check-in successful!", description: `Welcome, ${lookupResult.member.name}` });

      // Re-fetch to get the open attendance record
      const res = await fetch("/api/qr-attendance/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setLookupResult(data);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!lookupResult?.openAttendance) return;
    setIsCheckingOut(true);
    try {
      const now = format(new Date(), "HH:mm");
      const res = await fetch(`/api/attendance/${lookupResult.openAttendance.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkOutTime: now }),
      });
      if (!res.ok) throw new Error("Failed to check out");
      setSuccessMessage(`Checked out at ${now}`);
      toast({ title: "Check-out successful!", description: "See you next time!" });

      // Re-fetch to get updated state
      const refreshRes = await fetch("/api/qr-attendance/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setLookupResult(data);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleReset = () => {
    setStep("phone");
    setPhone("");
    setLookupResult(null);
    setSuccessMessage(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setElapsed("00:00:00");
  };

  const subscriptionColor = (status: string) => {
    switch (status) {
      case "Active": return "text-green-500";
      case "Expired": return "text-red-500";
      default: return "text-yellow-500";
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${bgmain})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/60" />

      <Card className="relative w-full max-w-md mx-auto bg-card/95 backdrop-blur border border-border shadow-2xl">
        <CardHeader className="text-center border-b border-border pb-6">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30">
            <Dumbbell className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold font-heading text-foreground uppercase tracking-tight">
            Self Check-in
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Enter your phone number to check in or out
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {step === "phone" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    className="bg-background border-border h-12 pl-10 text-lg"
                    onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                    autoFocus
                  />
                </div>
              </div>
              <Button
                className="w-full h-12 text-base font-bold uppercase tracking-wider"
                onClick={handleLookup}
                disabled={isLoading || !phone.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          )}

          {step === "info" && lookupResult && (
            <div className="space-y-5">
              {/* Success banner */}
              {successMessage && (
                <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {successMessage}
                  </span>
                </div>
              )}

              {/* Member Info Card */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{lookupResult.member.name}</p>
                    {lookupResult.member.age && (
                      <p className="text-sm text-muted-foreground">{lookupResult.member.age} years</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Plan:</span>
                    <p className="font-medium">{lookupResult.member.plan}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className={`font-semibold ${subscriptionColor(lookupResult.member.subscriptionStatus)}`}>
                      {lookupResult.member.subscriptionStatus}
                    </p>
                  </div>
                </div>
              </div>

              {/* Already checked out today */}
              {lookupResult.alreadyCheckedOut && !lookupResult.openAttendance && (
                <div className="text-center py-6 space-y-3">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    You've already checked out today!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    See you again tomorrow!
                  </p>
                </div>
              )}

              {/* Open attendance - show timer + check out */}
              {lookupResult.openAttendance && (
                <div className="space-y-4">
                  <div className="text-center py-4 space-y-2">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Checked in at {lookupResult.openAttendance.checkInTime}</span>
                    </div>
                    <div className="text-4xl font-bold font-mono tracking-wider text-primary">
                      {elapsed}
                    </div>
                    <p className="text-xs text-muted-foreground">time since check-in</p>
                  </div>

                  <Button
                    className="w-full h-12 text-base font-bold uppercase tracking-wider gap-2"
                    variant="default"
                    onClick={handleCheckOut}
                    disabled={isCheckingOut}
                  >
                    {isCheckingOut ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <LogOut className="h-5 w-5" />
                    )}
                    Check Out Now
                  </Button>
                </div>
              )}

              {/* No open attendance and not checked out - show check in */}
              {!lookupResult.openAttendance && !lookupResult.alreadyCheckedOut && (
                <div className="space-y-4">
                  {lookupResult.member.subscriptionStatus === "Active" ? (
                    <Button
                      className="w-full h-12 text-base font-bold uppercase tracking-wider gap-2"
                      onClick={handleCheckIn}
                      disabled={isCheckingIn}
                    >
                      {isCheckingIn ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <CheckCircle className="h-5 w-5" />
                      )}
                      Check-in Today
                    </Button>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">
                        Your membership is <span className="font-semibold text-red-500">{lookupResult.member.subscriptionStatus}</span>.
                        Please contact reception.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Search again */}
              <Button
                variant="outline"
                className="w-full h-10 text-sm"
                onClick={handleReset}
              >
                Check in with another account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
