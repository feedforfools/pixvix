import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  MousePointer,
  Info,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { ColorPalette } from "./ColorPalette";
import type {
  PaletteEntry,
  ColorGroupId,
  GroupAdjustment,
  GroupAdjustments,
} from "../types";

interface RefineSidebarProps {
  gridDimensions: { cols: number; rows: number };
  ignoredCount: number;
  onClearIgnored: () => void;
  onBack: () => void;
  onNext: () => void;
  palette: PaletteEntry[];
  groupAdjustments: GroupAdjustments;
  onGroupAdjustmentChange: (
    groupId: ColorGroupId,
    adjustment: GroupAdjustment | null
  ) => void;
  onClearAllAdjustments: () => void;
}

export function RefineSidebar({
  gridDimensions,
  ignoredCount,
  onClearIgnored,
  onBack,
  onNext,
  palette,
  groupAdjustments,
  onGroupAdjustmentChange,
  onClearAllAdjustments,
}: RefineSidebarProps) {
  return (
    <aside className="w-72 h-full bg-card border-r border-border p-4 flex flex-col gap-4">
      {/* Summary Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Refine Your Pixel Art
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Fine-tune your output by marking pixels as transparent or replacing
            colors globally.
          </p>

          {/* Grid Info */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Grid size:</span>
              <span className="font-mono">
                {gridDimensions.cols} × {gridDimensions.rows} px
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Transparent Pixels */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <MousePointer className="h-4 w-4" />
            Transparent Pixels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Click or drag on pixels to toggle transparency.
          </p>

          {ignoredCount > 0 ? (
            <>
              <div className="flex justify-between items-center text-sm">
                <span>Marked transparent:</span>
                <span className="font-mono text-yellow-500">
                  {ignoredCount}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onClearIgnored}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore All Pixels
              </Button>
            </>
          ) : (
            <p className="text-xs text-muted-foreground/70 italic">
              No pixels marked as transparent
            </p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Color Palette */}
      <ColorPalette
        palette={palette}
        groupAdjustments={groupAdjustments}
        onGroupAdjustmentChange={onGroupAdjustmentChange}
        onClearAllAdjustments={onClearAllAdjustments}
      />

      {/* Help hint */}
      <div className="flex gap-2 text-xs text-muted-foreground px-1">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Hold <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Shift</kbd>{" "}
          and drag to pan. Scroll to zoom.
        </p>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Navigation */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button className="flex-1" onClick={onNext}>
          Export
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </aside>
  );
}
