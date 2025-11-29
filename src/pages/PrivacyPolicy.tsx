import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
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
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
              <p className="text-muted-foreground mb-3">
                At Aura Health, we take your privacy seriously. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our health tracking platform.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
              
              <h3 className="text-lg font-medium mt-4 mb-2">Account Information</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Email address</li>
                <li>Full name</li>
                <li>Profile photo (optional)</li>
                <li>User role (client or dietician)</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">Health Data</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Personal metrics (age, sex, height, weight)</li>
                <li>Health conditions and medical history</li>
                <li>Medications and allergies</li>
                <li>Meal logs (food, calories, macros)</li>
                <li>Workout activities</li>
                <li>Health events and symptoms</li>
                <li>Goals and preferences</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">Usage Information</h3>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>App interactions and features used</li>
                <li>Device information and browser type</li>
                <li>IP address and location data</li>
                <li>Analytics and performance data</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-3">We use your information to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide and maintain the Aura Health service</li>
                <li>Generate AI-powered insights and summaries</li>
                <li>Track your health patterns and achievements</li>
                <li>Connect clients with dieticians (when authorized)</li>
                <li>Send notifications and updates</li>
                <li>Improve our service and develop new features</li>
                <li>Ensure security and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">4. Data Sharing and Disclosure</h2>
              <p className="text-muted-foreground mb-3">
                <strong>We do NOT sell your personal data.</strong>
              </p>
              <p className="text-muted-foreground mb-3">We may share your information with:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>
                  <strong>Dieticians:</strong> If you connect with a dietician through our platform, 
                  they can access your health data to provide guidance
                </li>
                <li>
                  <strong>Service Providers:</strong> Cloud hosting, analytics, and email services 
                  that help us operate (under strict confidentiality agreements)
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When required by law or to protect rights and safety
                </li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">5. Data Security</h2>
              <p className="text-muted-foreground mb-3">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Encrypted data transmission (HTTPS/TLS)</li>
                <li>Encrypted data storage</li>
                <li>Row-level security policies on databases</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                While we strive to protect your data, no method is 100% secure. You are responsible 
                for maintaining the confidentiality of your account credentials.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
              <p className="text-muted-foreground mb-3">
                We retain your data for as long as your account is active or as needed to provide services. 
                You can request deletion of your data at any time through Settings → Delete Account.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">7. Your Rights (GDPR/CCPA)</h2>
              <p className="text-muted-foreground mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>
                  <strong>Access:</strong> Request a copy of your personal data
                </li>
                <li>
                  <strong>Export:</strong> Download all your data in JSON format 
                  (<button
                    onClick={() => navigate("/settings")}
                    className="text-primary underline"
                  >
                    Settings → Export Data
                  </button>)
                </li>
                <li>
                  <strong>Correction:</strong> Update inaccurate information in your profile
                </li>
                <li>
                  <strong>Deletion:</strong> Delete your account and all associated data 
                  (<button
                    onClick={() => navigate("/settings")}
                    className="text-primary underline"
                  >
                    Settings → Delete Account
                  </button>)
                </li>
                <li>
                  <strong>Portability:</strong> Transfer your data to another service
                </li>
                <li>
                  <strong>Objection:</strong> Object to certain data processing activities
                </li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">8. Cookies and Tracking</h2>
              <p className="text-muted-foreground mb-3">
                We use analytics tools (Mixpanel) to understand how users interact with our app. 
                This helps us improve the service. You can disable analytics through your browser settings.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">9. Children's Privacy</h2>
              <p className="text-muted-foreground mb-3">
                Aura Health is not intended for children under 13. We do not knowingly collect data 
                from children. If you believe a child has provided us with personal information, 
                please contact us immediately.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">10. International Data Transfers</h2>
              <p className="text-muted-foreground mb-3">
                Your data may be transferred to and processed in countries other than your own. 
                We ensure appropriate safeguards are in place to protect your data in accordance 
                with this Privacy Policy.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">11. Changes to This Policy</h2>
              <p className="text-muted-foreground mb-3">
                We may update this Privacy Policy periodically. We will notify you of significant 
                changes via email or app notification. Continued use after changes indicates acceptance.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">12. Contact Us</h2>
              <p className="text-muted-foreground mb-3">
                For questions, concerns, or to exercise your privacy rights, contact us at:
                <br />
                <strong>Email:</strong> privacy@aurahealth.app
                <br />
                <strong>Data Protection Officer:</strong> dpo@aurahealth.app
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
