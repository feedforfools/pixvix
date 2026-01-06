import { Check, Crop, Grid3X3, Sparkles, Download } from "lucide-react";
import { cn } from "../lib/utils";
import type { WorkflowStep } from "../types";

interface StepInfo {
  id: WorkflowStep;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepInfo[] = [
  { id: "crop", label: "Crop", icon: Crop },
  { id: "grid", label: "Grid", icon: Grid3X3 },
  { id: "refine", label: "Refine", icon: Sparkles },
  { id: "export", label: "Export", icon: Download },
];

interface StepIndicatorProps {
  currentStep: WorkflowStep;
  onStepClick: (step: WorkflowStep) => void;
  completedSteps: Set<WorkflowStep>;
  disabled?: boolean;
}

export function StepIndicator({
  currentStep,
  onStepClick,
  completedSteps,
  disabled = false,
}: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center justify-center gap-2 py-3 px-4 bg-card border-b border-border">
      {STEPS.map((step, index) => {
        const isCompleted = completedSteps.has(step.id);
        const isCurrent = step.id === currentStep;
        const isClickable = !disabled && (isCompleted || index <= currentIndex);
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step button */}
            <button
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                isCurrent && "bg-primary text-primary-foreground",
                !isCurrent &&
                  isCompleted &&
                  "bg-muted text-foreground hover:bg-muted/80",
                !isCurrent && !isCompleted && "text-muted-foreground",
                isClickable && !isCurrent && "cursor-pointer",
                !isClickable && "cursor-not-allowed opacity-50"
              )}
            >
              {isCompleted && !isCurrent ? (
                <Check className="h-4 w-4" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </button>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "w-8 h-0.5 mx-1",
                  index < currentIndex ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
