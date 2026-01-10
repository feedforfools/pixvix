import {
  Check,
  Upload,
  Crop,
  Grid3X3,
  Sparkles,
  Download,
  RotateCcw,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import type { WorkflowStep } from "../types";

interface StepInfo {
  id: WorkflowStep;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepInfo[] = [
  { id: "upload", label: "Upload", icon: Upload },
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
  onReset: () => void;
  hasImage: boolean;
}

export function StepIndicator({
  currentStep,
  onStepClick,
  completedSteps,
  disabled = false,
  onReset,
  hasImage,
}: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center justify-between py-3 px-4 bg-card border-b border-border">
      {/* Left spacer for balance */}
      <div className="w-24" />

      {/* Steps in center */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = step.id === currentStep;
          const isClickable =
            !disabled && (isCompleted || index <= currentIndex);
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

      {/* Reset button on right */}
      <div className="w-24 flex justify-end">
        {hasImage ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Start over?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear your current image and all edits. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onReset}>Reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button variant="ghost" size="sm" className="gap-2" disabled>
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        )}
      </div>
    </div>
  );
}
