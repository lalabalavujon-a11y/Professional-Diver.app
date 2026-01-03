import RoleBasedNavigation from "@/components/role-based-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Terms() {
  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50" data-sidebar-content="true">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-slate-900">Terms of Service</CardTitle>
            <p className="text-sm text-slate-600">Last updated: January 2025</p>
          </CardHeader>
          
          <CardContent className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-slate-700 mb-4">
                By accessing and using Professional Diver - Diver Well Training platform, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Use License</h2>
              <p className="text-slate-700 mb-4">
                Permission is granted to temporarily download one copy of Professional Diver materials for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-6 text-slate-700 space-y-2">
                <li>modify or copy the materials</li>
                <li>use the materials for any commercial purpose or for any public display</li>
                <li>attempt to reverse engineer any software contained on the platform</li>
                <li>remove any copyright or other proprietary notations from the materials</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Educational Content</h2>
              <p className="text-slate-700 mb-4">
                All content provided by Professional Diver - Diver Well Training is brand-neutral and has been reworded to ensure compliance and congruence with educational standards. We are not affiliated with any specific certification bodies or industry organizations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Affiliate Program</h2>
              <p className="text-slate-700 mb-4">
                Our affiliate program offers commission-based earnings for referring new users. Participants must comply with our affiliate guidelines and promotional standards. Commission rates and terms are subject to change with notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. User Accounts</h2>
              <p className="text-slate-700 mb-4">
                Users are responsible for maintaining the confidentiality of their account credentials and for all activities that occur under their account. Professional Diver reserves the right to terminate accounts that violate these terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Privacy and Data</h2>
              <p className="text-slate-700 mb-4">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the platform, to understand our practices.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Disclaimers</h2>
              <p className="text-slate-700 mb-4">
                The materials on Professional Diver platform are provided on an 'as is' basis. Professional Diver makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Limitations</h2>
              <p className="text-slate-700 mb-4">
                In no event shall Professional Diver or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Professional Diver platform, even if Professional Diver or an authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. Revisions and Errata</h2>
              <p className="text-slate-700 mb-4">
                The materials appearing on Professional Diver platform could include technical, typographical, or photographic errors. Professional Diver does not warrant that any of the materials on its platform are accurate, complete, or current.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">10. Governing Law</h2>
              <p className="text-slate-700 mb-4">
                These terms and conditions are governed by and construed in accordance with the laws of the United Kingdom and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Contact Information</h2>
              <p className="text-slate-700 mb-4">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-slate-700">
                  <strong>Email:</strong> support@diverwell.app<br />
                  <strong>Phone:</strong> +44 (0) 208 123 4567<br />
                  <strong>Address:</strong> London, United Kingdom
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
        </main>
      </div>
    </>
  );
}