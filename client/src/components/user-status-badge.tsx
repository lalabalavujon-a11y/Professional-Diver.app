import { useState, useEffect } from "react";
import { Crown, Star, Award, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UserStatusBadgeProps {
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'LIFETIME' | 'AFFILIATE';
  subscriptionType: 'TRIAL' | 'MONTHLY' | 'ANNUAL' | 'LIFETIME';
  subscriptionDate?: string;
  trialExpiresAt?: string;
  userName?: string;
}

export default function UserStatusBadge({ 
  role, 
  subscriptionType, 
  subscriptionDate, 
  trialExpiresAt,
  userName 
}: UserStatusBadgeProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  }>({ hours: 0, minutes: 0, seconds: 0, total: 0 });

  useEffect(() => {
    if ((subscriptionType === 'TRIAL' && trialExpiresAt) || 
        (subscriptionType === 'MONTHLY' || subscriptionType === 'ANNUAL') && subscriptionDate) {
      
      const calculateTimeLeft = () => {
        let targetDate: Date;
        
        if (subscriptionType === 'TRIAL' && trialExpiresAt) {
          targetDate = new Date(trialExpiresAt);
        } else if (subscriptionType === 'MONTHLY' && subscriptionDate) {
          // Monthly subscription renews every 30 days
          const subDate = new Date(subscriptionDate);
          targetDate = new Date(subDate.getTime() + (30 * 24 * 60 * 60 * 1000));
        } else if (subscriptionType === 'ANNUAL' && subscriptionDate) {
          // Annual subscription renews every 365 days
          const subDate = new Date(subscriptionDate);
          targetDate = new Date(subDate.getTime() + (365 * 24 * 60 * 60 * 1000));
        } else {
          return;
        }

        const now = new Date().getTime();
        const target = targetDate.getTime();
        const difference = target - now;

        if (difference > 0) {
          const days = Math.floor(difference / (1000 * 60 * 60 * 24));
          const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);
          
          setTimeLeft({ hours: days * 24 + hours, minutes, seconds, total: difference });
        } else {
          setTimeLeft({ hours: 0, minutes: 0, seconds: 0, total: 0 });
        }
      };

      calculateTimeLeft();
      const timer = setInterval(calculateTimeLeft, 1000);
      return () => clearInterval(timer);
    }
  }, [subscriptionType, subscriptionDate, trialExpiresAt]);

  // Admin Crown Badge
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return (
      <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-amber-800">
                    {role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                  </span>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                    Full Access
                  </Badge>
                </div>
                {userName && (
                  <p className="text-sm text-amber-600">Welcome, {userName}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Lifetime Access Gold Star Badge
  if (subscriptionType === 'LIFETIME') {
    return (
      <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-100">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-yellow-800">Lifetime Member</span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    ⭐ Unlimited Access
                  </Badge>
                </div>
                {userName && (
                  <p className="text-sm text-yellow-600">Welcome back, {userName}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Annual Subscription Gold Medal Badge with Countdown
  if (subscriptionType === 'ANNUAL') {
    const isExpired = timeLeft.total <= 0;
    const isNearExpiry = timeLeft.total <= 7 * 24 * 60 * 60 * 1000; // 7 days

    return (
      <Card className={`${isNearExpiry ? 'border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100' : 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-100'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isNearExpiry ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 'bg-gradient-to-br from-yellow-400 to-yellow-600'
              }`}>
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`font-semibold ${isNearExpiry ? 'text-orange-800' : 'text-yellow-800'}`}>
                    Annual Member
                  </span>
                  <Badge variant="secondary" className={`${
                    isNearExpiry ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                  }`}>
                    🥇 Gold Access
                  </Badge>
                </div>
                {!isExpired && (
                  <p className={`text-sm ${isNearExpiry ? 'text-orange-600' : 'text-yellow-600'}`}>
                    Renews in {Math.floor(timeLeft.hours / 24)} days, {timeLeft.hours % 24}h {timeLeft.minutes}m
                  </p>
                )}
                {isExpired && (
                  <p className="text-sm text-red-600">Subscription expired - please renew</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Monthly Subscription Silver Medal Badge with Countdown
  if (subscriptionType === 'MONTHLY') {
    const isExpired = timeLeft.total <= 0;
    const isNearExpiry = timeLeft.total <= 3 * 24 * 60 * 60 * 1000; // 3 days

    return (
      <Card className={`${isNearExpiry ? 'border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100' : 'border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isNearExpiry ? 'bg-gradient-to-br from-orange-400 to-orange-600' : 'bg-gradient-to-br from-slate-400 to-slate-600'
              }`}>
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`font-semibold ${isNearExpiry ? 'text-orange-800' : 'text-slate-800'}`}>
                    Monthly Member
                  </span>
                  <Badge variant="secondary" className={`${
                    isNearExpiry ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-slate-100 text-slate-800 border-slate-200'
                  }`}>
                    🥈 Silver Access
                  </Badge>
                </div>
                {!isExpired && (
                  <p className={`text-sm ${isNearExpiry ? 'text-orange-600' : 'text-slate-600'}`}>
                    Renews in {Math.floor(timeLeft.hours / 24)} days, {timeLeft.hours % 24}h {timeLeft.minutes}m
                  </p>
                )}
                {isExpired && (
                  <p className="text-sm text-red-600">Subscription expired - please renew</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Trial User Badge with 24hr Countdown
  if (subscriptionType === 'TRIAL') {
    const isExpired = timeLeft.total <= 0;
    const isLowTime = timeLeft.total <= 3600000; // 1 hour remaining

    return (
      <Card className={`${isLowTime ? 'border-red-200 bg-gradient-to-r from-red-50 to-red-100' : 'border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isLowTime ? 'bg-gradient-to-br from-red-400 to-red-600' : 'bg-gradient-to-br from-blue-400 to-blue-600'
              }`}>
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`font-semibold ${isLowTime ? 'text-red-800' : 'text-blue-800'}`}>
                    Free Trial
                  </span>
                  <Badge variant="secondary" className={`${
                    isLowTime ? 'bg-red-100 text-red-800 border-red-200' : 'bg-blue-100 text-blue-800 border-blue-200'
                  }`}>
                    24-Hour Access
                  </Badge>
                </div>
                {!isExpired && (
                  <p className={`text-sm ${isLowTime ? 'text-red-600' : 'text-blue-600'}`}>
                    {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s remaining
                  </p>
                )}
                {isExpired && (
                  <p className="text-sm text-red-600">Trial expired - upgrade to continue</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default fallback
  return (
    <Card className="border-slate-200 bg-slate-50">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center">
            <Clock className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <span className="font-semibold text-slate-800">User</span>
            {userName && (
              <p className="text-sm text-slate-600">Welcome, {userName}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}