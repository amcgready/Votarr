// src/components/ui/steps.tsx
import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepsProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export const Steps = React.forwardRef<HTMLDivElement, StepsProps>(
  ({ steps, currentStep, className }, ref) => {
    return (
      <div ref={ref} className={cn("w-full", className)}>
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <div key={step} className="flex flex-col items-center relative z-10">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2",
                    isCompleted ? "bg-blue-600 border-blue-600" :
                    isCurrent ? "border-blue-600 bg-gray-800" :
                    "border-gray-600 bg-gray-800"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : (
                    <span className={cn(
                      "text-sm",
                      isCurrent ? "text-blue-600" : "text-gray-500"
                    )}>
                      {index + 1}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-xs mt-2 absolute -bottom-6 transform -translate-x-1/2 whitespace-nowrap",
                  isCurrent ? "text-blue-600" : "text-gray-500"
                )}>
                  {step}
                </span>
              </div>
            );
          })}

          {/* Progress bar */}
          <div className="absolute top-4 left-0 right-0 -translate-y-1/2 h-[2px] bg-gray-600">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{
                width: `${(currentStep / (steps.length - 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    );
  }
);

Steps.displayName = 'Steps';

export const Step: React.FC<{ title: string }> = ({ title }) => {
  return null; // This is just for semantic purposes
};
