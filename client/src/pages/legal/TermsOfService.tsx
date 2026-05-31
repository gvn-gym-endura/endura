import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/login">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </Link>
        <Card className="border-none shadow-lg">
          <CardContent className="prose prose-sm dark:prose-invert max-w-none p-8 space-y-6">
            <h1 className="text-3xl font-bold">Terms of Service</h1>
            <p className="text-muted-foreground">Effective Date: May 31, 2026</p>

            <p>
              Welcome to Gym Genie. By accessing or using our app, you agree to comply with and be bound by the following terms.
            </p>

            <h2 className="text-xl font-semibold mt-8">1. Account Registration</h2>
            <p>
              You must provide accurate and complete information when creating an account.
            </p>
            <p>
              You are responsible for maintaining the confidentiality of your login credentials.
            </p>

            <h2 className="text-xl font-semibold mt-8">2. Memberships and Payments</h2>
            <p>
              All memberships, fees, and payments are handled according to your gym's specific billing policies.
            </p>
            <p>
              Failure to pay membership fees may result in the suspension of app access and gym entry.
            </p>

            <h2 className="text-xl font-semibold mt-8">3. Health and Safety Disclaimer</h2>
            <p>
              The workouts, diets, and fitness advice provided in this app are for informational purposes.
            </p>
            <p>
              You should consult a physician before starting any new exercise or nutrition program. The gym is not liable for any injuries sustained while following routines in the app.
            </p>

            <h2 className="text-xl font-semibold mt-8">4. Prohibited Conduct</h2>
            <p>
              You agree not to misuse the app, attempt to gain unauthorized access to other user accounts, or disrupt the app's performance.
            </p>

            <h2 className="text-xl font-semibold mt-8">5. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the app if you violate these terms or your physical gym membership rules.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
