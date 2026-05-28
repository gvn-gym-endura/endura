import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Dumbbell, Loader2 } from "lucide-react";
import type { Branch } from "@shared/schema";
import bgmain from "@/assets/bg-main.jpg";

const sourceOptions = ["Walk-in", "Instagram", "Facebook", "Referral", "Website", "Other"];

export default function SelfEnquiry() {
  const [, params] = useRoute("/self-enquiry/:branchSlug");
  const branchSlug = params?.branchSlug || "";
  const { toast } = useToast();

  const [companyName, setCompanyName] = useState("Lime Fitness");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    gender: "male",
    interestAreas: [] as string[],
    healthBackground: "",
    source: "Website",
    branch: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moduleEnabled, setModuleEnabled] = useState(true);

  // Fetch company settings, branches, and options
  useEffect(() => {
    async function init() {
      try {
        const [companyRes, branchesRes, moduleRes] = await Promise.all([
          fetch("/api/company-settings"),
          fetch("/api/branches"),
          fetch("/api/module-control").catch(() => null),
        ]);
        if (companyRes.ok) {
          const data = await companyRes.json();
          if (data.companyName) setCompanyName(data.companyName);
        }
        if (branchesRes.ok) {
          const data = await branchesRes.json();
          setBranches(data);
          // Auto-select branch from URL slug
          if (branchSlug) {
            const matched = data.find(
              (b: Branch) => b.name.toLowerCase() === branchSlug.toLowerCase()
            );
            if (matched) {
              setFormData((prev) => ({ ...prev, branch: matched.name }));
            }
          }
        }
        // Check if self-enquiry is explicitly disabled
        // Default to enabled if module isn't in the DB yet
        if (moduleRes?.ok) {
          const data = await moduleRes.json();
          const modules = data.modules || [];
          const selfEnquiryModule = modules.find(
            (m: any) => m.moduleName === "self-enquiry"
          );
          if (selfEnquiryModule && !selfEnquiryModule.enabled) {
            setModuleEnabled(false);
          }
        }
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [branchSlug]);

  // Fetch interest and health options
  const [interestOptions, setInterestOptions] = useState<string[]>([]);
  const [healthOptions, setHealthOptions] = useState<string[]>([]);

  useEffect(() => {
    async function fetchOptions() {
      try {
        const [interestRes, healthRes] = await Promise.all([
          fetch("/api/options/interests"),
          fetch("/api/options/health"),
        ]);
        if (interestRes.ok) {
          const data = await interestRes.json();
          setInterestOptions(data.filter((o: any) => o.isActive !== false).map((o: any) => o.name));
        }
        if (healthRes.ok) {
          const data = await healthRes.json();
          setHealthOptions(data.filter((o: any) => o.isActive !== false).map((o: any) => o.name));
        }
      } catch (err) {
        console.error("Failed to fetch options:", err);
      }
    }
    fetchOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.phone) {
      toast({ title: "Validation Error", description: "First name and phone are required.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/leads", {
        ...formData,
      });
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to submit enquiry. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!moduleEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4"
        style={{
          backgroundImage: `url(${bgmain})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <Card className="relative w-full max-w-md mx-auto bg-card/95 backdrop-blur border border-border shadow-2xl text-center">
          <CardContent className="pt-12 pb-10 px-8">
            <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Dumbbell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold font-heading text-foreground mb-3">
              Not Available
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Self-enquiry is currently disabled. Please contact the gym directly.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4"
        style={{
          backgroundImage: `url(${bgmain})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <Card className="relative w-full max-w-md mx-auto bg-card/95 backdrop-blur border border-border shadow-2xl text-center">
          <CardContent className="pt-12 pb-10 px-8">
            <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold font-heading text-foreground mb-3">
              Enquiry Submitted!
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Thank you for your interest in <span className="font-semibold text-foreground">{companyName}</span>.
              Our team will get in touch with you shortly.
            </p>
            <Button
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  firstName: "",
                  lastName: "",
                  email: "",
                  phone: "",
                  address: "",
                  gender: "male",
                  interestAreas: [],
                  healthBackground: "",
                  source: "Website",
                  branch: branchSlug
                    ? branches.find((b) => b.name.toLowerCase() === branchSlug.toLowerCase())?.name || ""
                    : "",
                });
              }}
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wider"
            >
              Submit Another Enquiry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 py-8"
      style={{
        backgroundImage: `url(${bgmain})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-black/60" />

      <Card className="relative w-full max-w-lg mx-auto bg-card/95 backdrop-blur border border-border shadow-2xl">
        <CardHeader className="text-center border-b border-border pb-6">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30">
            <Dumbbell className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold font-heading text-foreground uppercase tracking-tight">
            {companyName}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Fill in your details and we'll reach out to you
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="First Name"
                  className="bg-background border-border h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Last Name</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Last Name"
                  className="bg-background border-border h-11"
                />
              </div>
            </div>

            {/* Contact Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="9999999999"
                  className="bg-background border-border h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="xyz@gmail.com"
                  className="bg-background border-border h-11"
                />
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gender</Label>
              <RadioGroup value={formData.gender} onValueChange={(val) => setFormData({ ...formData, gender: val })} className="flex gap-6 pt-1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="se-male" className="border-primary text-primary" />
                  <Label htmlFor="se-male" className="text-sm font-medium">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="se-female" className="border-primary text-primary" />
                  <Label htmlFor="se-female" className="text-sm font-medium">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="se-other" className="border-primary text-primary" />
                  <Label htmlFor="se-other" className="text-sm font-medium">Other</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Interest & Health */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Interest Areas</Label>
                <MultiSelectDropdown
                  value={formData.interestAreas}
                  onValueChange={(vals) => setFormData({ ...formData, interestAreas: vals })}
                  options={interestOptions}
                  placeholder="Select Interest Areas"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Health Background</Label>
                <Select value={formData.healthBackground} onValueChange={(val) => setFormData({ ...formData, healthBackground: val })}>
                  <SelectTrigger className="bg-background border-border h-11">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {healthOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Your address..."
                className="bg-background border-border min-h-[80px]"
                rows={2}
              />
            </div>

            {/* Source & Branch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">How did you hear about us?</Label>
                <Select value={formData.source} onValueChange={(val) => setFormData({ ...formData, source: val })}>
                  <SelectTrigger className="bg-background border-border h-11">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Branch</Label>
                <Select value={formData.branch} onValueChange={(val) => setFormData({ ...formData, branch: val })}>
                  <SelectTrigger className="bg-background border-border h-11">
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.name}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wider text-base mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Enquiry
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
