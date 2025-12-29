import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-primary-50 to-ocean-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
        <div className="lg:w-2/3 w-full text-center lg:text-left">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3 sm:mb-4 leading-tight">
            Professional Diving Education Platform
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mb-4 sm:mb-6 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Master diving physiology, decompression theory, and advanced techniques through comprehensive tracks designed by industry experts.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start">
            <Button 
              className="bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg font-semibold text-sm sm:text-base w-full sm:w-auto min-h-[48px]"
              data-testid="button-start-learning"
            >
              Start Learning
            </Button>
            <Link href="/dashboard">
              <Button 
                variant="outline" 
                className="border border-slate-300 hover:border-slate-400 text-slate-700 px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg font-semibold text-sm sm:text-base w-full sm:w-auto min-h-[48px]"
                data-testid="button-view-progress"
              >
                View Progress
              </Button>
            </Link>
          </div>
        </div>
        <div className="lg:w-1/3 w-full max-w-md lg:max-w-none">
          <img 
            src="https://images.unsplash.com/photo-1583212292454-1fe6229603b7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
            alt="Professional diver underwater" 
            className="rounded-xl shadow-lg w-full h-auto"
            data-testid="img-hero"
          />
        </div>
      </div>
    </section>
  );
}
