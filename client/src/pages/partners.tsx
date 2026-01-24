import PartnerDirectory from "@/components/sponsors/partner-directory";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Handshake, DollarSign, Users, Star, CheckCircle, Sparkles } from "lucide-react";

export default function Partners() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Partner Program</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Join our network of industry leaders and earn 50% commission on all referrals
          </p>
          
          {/* Partner Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6 text-center">
                <DollarSign className="w-10 h-10 text-green-600 mx-auto mb-3" />
                <h3 className="font-bold text-green-900 mb-2">50% Commission</h3>
                <p className="text-sm text-green-700">Earn on every subscription - monthly and annual</p>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6 text-center">
                <Users className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <h3 className="font-bold text-blue-900 mb-2">Recurring Revenue</h3>
                <p className="text-sm text-blue-700">Earn as long as your referrals stay subscribed</p>
              </CardContent>
            </Card>
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="pt-6 text-center">
                <Star className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                <h3 className="font-bold text-purple-900 mb-2">Enterprise Bonus</h3>
                <p className="text-sm text-purple-700">Up to $1,250 per Enterprise referral</p>
              </CardContent>
            </Card>
          </div>

          {/* Commission Structure */}
          <Card className="max-w-2xl mx-auto mb-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-center">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Commission Structure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="font-medium">Individual Diver ($25/mo)</span>
                <Badge className="bg-green-100 text-green-800">$12.50/referral</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="font-medium">Individual Diver ($250/yr)</span>
                <Badge className="bg-green-100 text-green-800">$125/referral</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="font-medium">Dive Company ($49.99/mo)</span>
                <Badge className="bg-green-100 text-green-800">$25/referral</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="font-medium">Service Provider ($79.99/mo)</span>
                <Badge className="bg-green-100 text-green-800">$40/referral</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                <span className="font-medium flex items-center gap-2">
                  Enterprise ($250/mo) <Badge className="bg-yellow-500 text-white text-xs">NEW</Badge>
                </span>
                <Badge className="bg-green-600 text-white">$125 - $1,250</Badge>
              </div>
            </CardContent>
          </Card>

          <Link href="/partner-inquiry">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Handshake className="w-5 h-5 mr-2" />
              Become a Partner
            </Button>
          </Link>
        </div>

        {/* Existing Partners Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Our Current Partners</h2>
          <PartnerDirectory />
        </div>
      </div>
      <Footer />
    </div>
  );
}
