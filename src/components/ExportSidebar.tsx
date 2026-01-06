import { Download, ChevronLeft, Eye, Frame, Info } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import type { OutputFrame } from "../types";

interface ExportSidebarProps {
  gridDimensions: { cols: number; rows: number };
  outputFrame: OutputFrame | null;
  ignoredCount: number;
  ignoredInFrame: number; // Transparent pixels within the output frame
  onExport: () => void;
  onBack: () => void;
}

export function ExportSidebar({
  gridDimensions,
  outputFrame,
  ignoredCount,
  ignoredInFrame,
  onExport,
  onBack,
}: ExportSidebarProps) {
  // Calculate final output dimensions
  const outputCols = outputFrame
    ? outputFrame.endCol - outputFrame.startCol + 1
    : gridDimensions.cols;
  const outputRows = outputFrame
    ? outputFrame.endRow - outputFrame.startRow + 1
    : gridDimensions.rows;

  const totalPixels = outputCols * outputRows;
  const transparentInOutput = outputFrame ? ignoredInFrame : ignoredCount;
  const visiblePixels = totalPixels - transparentInOutput;

  return (
    <aside className="w-72 h-full bg-card border-r border-border p-4 flex flex-col gap-4 overflow-y-auto">
      {/* Preview Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Eye className="h-4 w-4" />
            Export Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            The yellow border on the canvas shows the exact area that will be
            exported.
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* Export Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Frame className="h-4 w-4" />
            Output Dimensions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">SVG Size:</span>
            <span className="font-medium">
              {outputCols} × {outputRows} px
            </span>
          </div>
          {outputFrame && (
            <p className="text-xs text-amber-500 italic">
              Limited by output frame selection
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Download className="h-4 w-4" />
            Pixel Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total in output:</span>
            <span>{totalPixels}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Visible (drawn):</span>
            <span className="text-green-500">{visiblePixels}</span>
          </div>
          {transparentInOutput > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transparent:</span>
              <span className="text-yellow-500">{transparentInOutput}</span>
            </div>
          )}
          <div className="flex justify-between text-sm pt-1 border-t">
            <span className="text-muted-foreground">Format:</span>
            <span>SVG</span>
          </div>
        </CardContent>
      </Card>

      {/* Info about transparent pixels */}
      {transparentInOutput > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-4 pb-3">
            <div className="flex gap-2 text-xs text-amber-500">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                Transparent pixels remain in the SVG dimensions but won't be
                drawn. The SVG viewBox will still be {outputCols}×{outputRows}{" "}
                pixels.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Navigation */}
      <div className="space-y-2">
        <Button className="w-full" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Download SVG
        </Button>
        <Button variant="outline" className="w-full" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Refine
        </Button>
      </div>
    </aside>
  );
}
