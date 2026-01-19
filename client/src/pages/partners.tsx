import PartnerDirectory from "@/components/sponsors/partner-directory";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Handshake } from "lucide-react";

export default function Partners() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Our Partners</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Trusted by leading companies in the commercial diving industry
          </p>
          <Link href="/partner-inquiry">
            <Button size="lg" className="mt-4">
              <Handshake className="w-5 h-5 mr-2" />
              Become a Partner
            </Button>
          </Link>
        </div>

        <PartnerDirectory />
      </div>
      <Footer />
    </div>
  );
}
