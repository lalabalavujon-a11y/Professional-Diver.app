import { Link } from "wouter";

export default function Privacy() {
  const effectiveDate = "24 August 2025";
  const orgEmail = "privacy@diverwell.app";

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <a className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
                ← Back to Platform
              </a>
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {/* Header */}
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Privacy Policy</h1>
            <p className="mt-2 text-lg text-slate-600">
              Effective date: {effectiveDate}
            </p>
          </div>
          <div className="no-print">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center rounded-lg border px-4 py-2 text-sm hover:bg-slate-50 font-medium"
              aria-label="Print this page"
            >
              Print Policy
            </button>
          </div>
        </header>

        {/* Policy body */}
        <article className="prose prose-slate max-w-none prose-headings:font-semibold prose-a:text-blue-600 prose-a:hover:text-blue-700">
          <p className="text-lg leading-relaxed">
            Professional Diver - Diver Well Training (the "Platform", "we", "our", or "us") provides
            brand‑neutral training and revision tools for commercial diving
            professionals. This Privacy Policy explains how we collect, use,
            disclose, and safeguard personal information when you use the
            Platform, and describes your choices and rights.
          </p>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 my-8">
            <p className="font-semibold text-blue-900 mb-2">Brand neutrality & original content.</p>
            <p className="text-blue-800">
              Professional Diver - Diver Well Training is <strong>not affiliated with</strong> and <strong>does not represent</strong> any
              certification body or brand (e.g., industry associations or
              regulators). All learning materials, multiple‑choice questions, and
              explanations are <strong>original and re‑worded</strong> to remain
              brand‑neutral while covering comparable knowledge areas. We do not
              process or display third‑party marks, logos, or proprietary content.
            </p>
          </div>

          <h2 id="who-we-are" className="text-2xl font-bold text-slate-900 mt-8 mb-4">1) Who we are</h2>
          <p>
            <strong>Controller:</strong> Professional Diver - Diver Well Training (UK)
            <br />
            <strong>Contact:</strong> <a href={`mailto:${orgEmail}`}>{orgEmail}</a>
          </p>
          <p>
            If you are in the UK/EEA, we process personal data in accordance with
            UK GDPR / EU GDPR and the Data Protection Act 2018. If you are outside
            the UK/EEA, we apply comparable privacy safeguards and your rights may
            vary per local law.
          </p>

          <h2 id="what-we-collect" className="text-2xl font-bold text-slate-900 mt-8 mb-4">2) What information we collect</h2>
          <ul className="space-y-2">
            <li>
              <strong>Account & access:</strong> email address; authentication artifacts
              (e.g., session tokens, magic‑link verification tokens).
            </li>
            <li>
              <strong>Learning activity:</strong> tracks/lessons viewed, quizzes taken,
              scores, attempts, completion status, timestamps; admin/editor
              actions with user/time attribution.
            </li>
            <li>
              <strong>Technical & security:</strong> IP address, device/browser info,
              basic diagnostic logs; session and CSRF cookies.
            </li>
            <li>
              <strong>Support & feedback:</strong> messages you send us and related contact
              details.
            </li>
          </ul>
          <p>
            We do <strong>not</strong> intentionally collect special category data and we do
            <strong> not</strong> profile for advertising.
          </p>

          <h2 id="how-we-use" className="text-2xl font-bold text-slate-900 mt-8 mb-4">3) How we use information (purposes & legal bases)</h2>
          <ul className="space-y-2">
            <li>
              <strong>Provide the service</strong> (accounts, authentication, lessons,
              quizzes, progress). <em>Legal basis: Contract.</em>
            </li>
            <li>
              <strong>Secure & maintain</strong> the Platform (logging, abuse prevention,
              uptime). <em>Legal basis: Legitimate Interests.</em>
            </li>
            <li>
              <strong>Improve content & UX</strong> (aggregated, anonymised analytics;
              quality checks on brand‑neutral coverage). <em>Legal basis:
              Legitimate Interests.</em>
            </li>
            <li>
              <strong>Communicate</strong> (service messages, account notices; optional
              updates). <em>Legal basis: Contract / Consent.</em>
            </li>
            <li>
              <strong>Comply with law.</strong> <em>Legal basis: Legal Obligation.</em>
            </li>
          </ul>
          <p>We do not use your personal information for behavioural advertising.</p>

          <h2 id="cookies" className="text-2xl font-bold text-slate-900 mt-8 mb-4">4) Cookies & similar technologies</h2>
          <p>
            We use strictly necessary cookies for authentication (session) and
            security (e.g., CSRF). Optional analytics cookies, if any, are
            disabled by default and presented with clear consent choices.
          </p>

          <h2 id="sharing" className="text-2xl font-bold text-slate-900 mt-8 mb-4">5) Data sharing & processors</h2>
          <p>
            We share personal data only with service providers who help us run the
            Platform under data‑processing agreements, such as hosting,
            email‑delivery, and error monitoring. We do not sell personal
            information.
          </p>

          <h2 id="transfers" className="text-2xl font-bold text-slate-900 mt-8 mb-4">6) International transfers</h2>
          <p>
            Our processors may store data in the UK, EEA, and/or other
            countries with adequate safeguards. Where required, we rely on
            Standard Contractual Clauses or equivalent mechanisms.
          </p>

          <h2 id="retention" className="text-2xl font-bold text-slate-900 mt-8 mb-4">7) Data retention</h2>
          <ul className="space-y-2">
            <li>
              <strong>Account & learning records:</strong> retained while your account is
              active; deleted or anonymised within 30–90 days of confirmed
              deletion request.
            </li>
            <li>
              <strong>Operational logs:</strong> typically ≤ 30 days for security and
              troubleshooting.
            </li>
            <li>
              <strong>Legal/financial records:</strong> retained as required by law.
            </li>
          </ul>

          <h2 id="rights" className="text-2xl font-bold text-slate-900 mt-8 mb-4">8) Your rights</h2>
          <p>
            Depending on your location, you may have the right to access, rectify,
            erase, restrict, object, or port your data, and to withdraw consent
            where applicable. To exercise rights, email
            {" "}
            <a href={`mailto:${orgEmail}`}>{orgEmail}</a>.
          </p>

          <h2 id="children" className="text-2xl font-bold text-slate-900 mt-8 mb-4">9) Children</h2>
          <p>
            The Platform is intended for users 13+ (or the age required by your
            jurisdiction). We do not knowingly collect personal data from children
            under the applicable age.
          </p>

          <h2 id="security" className="text-2xl font-bold text-slate-900 mt-8 mb-4">10) Security</h2>
          <p>
            We maintain administrative, technical, and organisational measures
            appropriate to risk (encryption in transit, access controls,
            least‑privilege access, audit logging, secure credential management).
            No system is 100% secure; we will notify users/authorities of
            significant incidents as required by law.
          </p>

          <h2 id="brand-neutrality" className="text-2xl font-bold text-slate-900 mt-8 mb-4">11) Brand‑neutral content & intellectual property</h2>
          <ul className="space-y-2">
            <li>
              <strong>Brand neutrality.</strong> We vet materials to exclude third‑party
              marks, logos, proprietary passages, or branded question banks. Our
              content is re‑written to cover comparable knowledge domains without
              reproducing protected text or implying endorsement.
            </li>
            <li>
              <strong>Your inputs.</strong> If you submit suggestions/corrections, you
              confirm you have rights to share them. We may use such inputs to
              improve materials while maintaining neutrality.
            </li>
            <li>
              <strong>Takedown.</strong> If you believe any content infringes rights or
              includes unintended brand references, email
              {" "}
              <a href={`mailto:${orgEmail}`}>{orgEmail}</a> (subject: "Content
              Review").
            </li>
          </ul>

          <h2 id="third-parties" className="text-2xl font-bold text-slate-900 mt-8 mb-4">12) Third‑party links</h2>
          <p>
            The Platform may link to non‑affiliated sites. Their privacy practices
            are their own; we encourage you to review their policies.
          </p>

          <h2 id="changes" className="text-2xl font-bold text-slate-900 mt-8 mb-4">13) Changes to this policy</h2>
          <p>
            We may update this policy to reflect operational, legal, or regulatory
            changes. We will post the new version with an updated date and, where
            appropriate, provide prominent notice.
          </p>

          <h2 id="contact" className="text-2xl font-bold text-slate-900 mt-8 mb-4">14) Contact</h2>
          <p>
            Questions or requests? Email {" "}
            <a href={`mailto:${orgEmail}`}>{orgEmail}</a>.
          </p>

          <div className="border-t border-gray-200 pt-8 mt-8">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Quick summary</h3>
            <ul className="space-y-2">
              <li>• We only collect what we need: email for login, session cookies, quiz progress.</li>
              <li>• No ads, no sale of data.</li>
              <li>• Content is brand‑neutral and re‑worded—no third‑party marks.</li>
              <li>• You control your data via access/deletion requests.</li>
              <li>• We use reputable processors under contracts and safeguards.</li>
            </ul>
          </div>
        </article>
      </main>
    </div>
  );
}