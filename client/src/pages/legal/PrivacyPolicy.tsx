import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
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
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <p className="text-muted-foreground">Effective Date: May 31, 2026</p>

            <p>
              Your privacy is important to us. This Privacy Policy explains how Gym Genie collects, uses, discloses, and safeguards your information when you use our app and services.
            </p>

            <h2 className="text-xl font-semibold mt-8">1. Information We Collect</h2>
            <p>
              We may collect personal information that you provide to us, such as your name, email address, phone number, and payment details when you register for an account or make a purchase.
            </p>
            <p>
              We also collect usage data including workout logs, attendance records, and app interactions to improve your experience.
            </p>

            <h2 className="text-xl font-semibold mt-8">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide, operate, and maintain the app and its features</li>
              <li>Process membership registrations and payments</li>
              <li>Send you notifications about your membership and gym updates</li>
              <li>Improve and personalize your experience</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8">3. Data Sharing and Disclosure</h2>
            <p>
              We do not sell your personal information to third parties. We may share your information with trusted service providers who assist us in operating the app, processing payments, or delivering services, subject to strict confidentiality agreements.
            </p>

            <h2 className="text-xl font-semibold mt-8">4. Data Security</h2>
            <p>
              We implement reasonable security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is completely secure.
            </p>

            <h2 className="text-xl font-semibold mt-8">5. Your Rights</h2>
            <p>
              You have the right to access, update, or delete your personal information. You may also opt out of receiving marketing communications from us at any time by contacting us.
            </p>

            <h2 className="text-xl font-semibold mt-8">6. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the effective date.
            </p>

            <h2 className="text-xl font-semibold mt-8">7. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at support@gymgenie.app.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
