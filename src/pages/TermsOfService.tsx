import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">1. Agreement to Terms</h2>
              <p className="text-muted-foreground mb-3">
                By accessing or using Aura Health, you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
              <p className="text-muted-foreground mb-3">
                Aura Health is a personal health tracking and management platform that allows users to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Log and track meals, workouts, medications, and health events</li>
                <li>Receive AI-powered insights and summaries</li>
                <li>Connect with dieticians for professional guidance</li>
                <li>Monitor health patterns and achievements</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
              <p className="text-muted-foreground mb-3">
                You are responsible for:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
                <li>Providing accurate and complete information</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">4. Acceptable Use</h2>
              <p className="text-muted-foreground mb-3">You agree NOT to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Use the service for any illegal purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Transmit viruses, malware, or other harmful code</li>
                <li>Impersonate others or provide false information</li>
                <li>Scrape, crawl, or use automated tools without permission</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">5. Health Information Disclaimer</h2>
              <p className="text-muted-foreground mb-3">
                <strong>IMPORTANT:</strong> Aura Health is not a substitute for professional medical advice, 
                diagnosis, or treatment. Always consult qualified healthcare providers for medical concerns. 
                Our AI-powered insights are informational only and should not be used for medical decisions.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">6. Data and Privacy</h2>
              <p className="text-muted-foreground mb-3">
                Your privacy is important to us. Please review our{" "}
                <button
                  onClick={() => navigate("/privacy")}
                  className="text-primary underline"
                >
                  Privacy Policy
                </button>{" "}
                to understand how we collect, use, and protect your data.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">7. Intellectual Property</h2>
              <p className="text-muted-foreground mb-3">
                All content, features, and functionality of Aura Health are owned by us and protected 
                by intellectual property laws. You may not reproduce, distribute, or create derivative 
                works without our explicit permission.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
              <p className="text-muted-foreground mb-3">
                To the fullest extent permitted by law, Aura Health shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages resulting from your use or inability 
                to use the service.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">9. Service Modifications</h2>
              <p className="text-muted-foreground mb-3">
                We reserve the right to modify, suspend, or discontinue any part of the service at any time 
                without notice. We are not liable for any modifications, suspensions, or discontinuations.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">10. Termination</h2>
              <p className="text-muted-foreground mb-3">
                We may terminate or suspend your account at any time for violations of these terms. 
                You may terminate your account at any time through Settings → Delete Account.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">11. Changes to Terms</h2>
              <p className="text-muted-foreground mb-3">
                We may update these Terms of Service periodically. Continued use of the service after 
                changes constitutes acceptance of the updated terms.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">12. Contact Information</h2>
              <p className="text-muted-foreground mb-3">
                For questions about these Terms of Service, please contact us at:
                <br />
                <strong>Email:</strong> support@aurahealth.app
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;
