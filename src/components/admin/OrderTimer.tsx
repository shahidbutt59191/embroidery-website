"use client";

import { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";

export default function OrderTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);
  const [isLate, setIsLate] = useState(false);

  useEffect(() => {
    if (!deadline) return;

    const target = new Date(deadline).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setIsLate(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setIsLate(false);
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  if (!timeLeft) return <div className="h-20 animate-pulse bg-gray-100 rounded-xl" />;

  const isUrgent = !isLate && timeLeft.days === 0 && timeLeft.hours < 12;

  return (
    <div className={`rounded-xl border shadow-sm p-4 flex flex-col items-center justify-center transition-colors ${
      isLate ? "bg-red-50 border-red-200 text-red-700" : 
      isUrgent ? "bg-orange-50 border-orange-200 text-orange-700" : 
      "bg-white border-border"
    }`}>
      <div className="flex items-center gap-2 mb-3">
        {isLate ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
        <h3 className="font-bold uppercase tracking-wider text-xs">
          {isLate ? "Delivery Overdue" : "Time Left to Deliver"}
        </h3>
      </div>
      
      <div className="flex items-center gap-3">
        <TimeUnit value={timeLeft.days} label="Days" isLate={isLate} />
        <span className={`text-2xl font-black ${isLate ? "text-red-300" : "text-gray-300"}`}>:</span>
        <TimeUnit value={timeLeft.hours} label="Hours" isLate={isLate} />
        <span className={`text-2xl font-black ${isLate ? "text-red-300" : "text-gray-300"}`}>:</span>
        <TimeUnit value={timeLeft.minutes} label="Minutes" isLate={isLate} />
        <span className={`text-2xl font-black ${isLate ? "text-red-300" : "text-gray-300"}`}>:</span>
        <TimeUnit value={timeLeft.seconds} label="Seconds" isLate={isLate} />
      </div>
    </div>
  );
}

function TimeUnit({ value, label, isLate }: { value: number, label: string, isLate: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-2xl font-black ${
        isLate ? "bg-red-100/50 text-red-700" : "bg-gray-50 text-foreground"
      }`}>
        {value.toString().padStart(2, '0')}
      </div>
      <span className="text-[10px] font-semibold mt-1 uppercase tracking-wider opacity-70">
        {label}
      </span>
    </div>
  );
}
