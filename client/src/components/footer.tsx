import { Mail, Phone, MapPin } from "lucide-react";
import diverWellLogo from "@assets/DIVER_WELL_TRAINING-500x500-rbg-preview_1756088331820.png";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Logo and Company Info */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src={diverWellLogo} 
                alt="Professional Diver - Diver Well Training" 
                className="w-12 h-12 rounded-lg"
              />
              <div>
                <h3 className="text-xl font-bold">Professional Diver</h3>
                <p className="text-sm text-slate-300">Diver Well Training</p>
              </div>
            </div>
            <p className="text-slate-300 mb-6 max-w-md">
              Brand-neutral commercial diving education platform with comprehensive training tracks, 
              AI-powered learning, and professional certification preparation.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-slate-300">
                <Mail className="w-4 h-4" />
                <a href="mailto:1pull@professionaldiver.app" className="hover:text-white">1pull@professionaldiver.app</a>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-300">
                <Phone className="w-4 h-4" />
                <a href="https://wa.me/447448320513" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  WhatsApp: +447448320513
                </a>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-300">
                <MapPin className="w-4 h-4" />
                <span>Southampton, United Kingdom</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Disclaimer */}
        <div className="border-t border-slate-700 mt-8 pt-8">
          <div className="text-center space-y-4">
            <div className="bg-slate-800 rounded-lg p-4 text-sm text-slate-300">
              <p className="font-semibold text-slate-200 mb-2">Brand Neutrality & Compliance Notice</p>
              <p>
                All content provided by Professional Diver - Diver Well Training is brand-neutral and has been 
                reworded to ensure compliance and congruence with educational standards. We are not affiliated 
                with any specific certification bodies or industry organizations. Our materials are original, 
                independently developed content covering comparable knowledge domains without reproducing 
                proprietary material or implying endorsement from any third-party brands.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-slate-400">
              <p>&copy; 2026 Professional Diver - Diver Well Training & Systems. All rights reserved.</p>
              <p>Professional diving education & operations platform | Brand-neutral content</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}