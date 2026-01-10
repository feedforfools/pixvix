import { useCallback, useMemo, useState } from "react";
import { Palette, RotateCcw, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import type {
  PaletteEntry,
  ColorGroup,
  ColorGroupId,
  GroupAdjustment,
  GroupAdjustments,
} from "../types";
import {
  groupColorsByHue,
  createDefaultAdjustment,
  isDefaultAdjustment,
  applyAdjustmentToColor,
  hslToRgb,
  hasActiveAdjustments,
} from "../core/colorGroups";
import { colorToHex } from "../core/gridSampler";

interface ColorPaletteProps {
  palette: PaletteEntry[];
  groupAdjustments: GroupAdjustments;
  onGroupAdjustmentChange: (
    groupId: ColorGroupId,
    adjustment: GroupAdjustment | null
  ) => void;
  onClearAllAdjustments: () => void;
}

/**
 * Generate a representative color swatch for a group.
 */
function getGroupSwatchColor(
  group: ColorGroup,
  adjustment?: GroupAdjustment
): string {
  // Use a representative color from the group (most common)
  const representativeColor = group.colors[0]?.color;
  if (!representativeColor) {
    // Fallback: generate from representative hue
    const fallback = hslToRgb({
      h: group.representativeHue,
      s: group.id === "grays" ? 0 : 60,
      l: 50,
    });
    return colorToHex(
      adjustment ? applyAdjustmentToColor(fallback, adjustment) : fallback
    );
  }

  if (adjustment && !isDefaultAdjustment(adjustment)) {
    return colorToHex(applyAdjustmentToColor(representativeColor, adjustment));
  }
  return colorToHex(representativeColor);
}

interface GroupEditorProps {
  group: ColorGroup;
  adjustment: GroupAdjustment;
  onChange: (adjustment: GroupAdjustment) => void;
  onReset: () => void;
}

function GroupEditor({
  group,
  adjustment,
  onChange,
  onReset,
}: GroupEditorProps) {
  const isModified = !isDefaultAdjustment(adjustment);

  return (
    <div className="space-y-3 pt-2">
      {/* Hue Shift */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <Label className="text-xs">Hue</Label>
          <span className="text-xs font-mono text-muted-foreground">
            {adjustment.hueShift > 0 ? "+" : ""}
            {adjustment.hueShift}°
          </span>
        </div>
        <Slider
          min={-180}
          max={180}
          step={5}
          value={[adjustment.hueShift]}
          onValueChange={([value]) =>
            onChange({ ...adjustment, hueShift: value })
          }
        />
      </div>

      {/* Saturation */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <Label className="text-xs">Saturation</Label>
          <span className="text-xs font-mono text-muted-foreground">
            {Math.round(adjustment.saturationScale * 100)}%
          </span>
        </div>
        <Slider
          min={0}
          max={200}
          step={5}
          value={[adjustment.saturationScale * 100]}
          onValueChange={([value]) =>
            onChange({ ...adjustment, saturationScale: value / 100 })
          }
        />
      </div>

      {/* Lightness */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <Label className="text-xs">Lightness</Label>
          <span className="text-xs font-mono text-muted-foreground">
            {Math.round(adjustment.lightnessScale * 100)}%
          </span>
        </div>
        <Slider
          min={0}
          max={200}
          step={5}
          value={[adjustment.lightnessScale * 100]}
          onValueChange={([value]) =>
            onChange({ ...adjustment, lightnessScale: value / 100 })
          }
        />
      </div>

      {/* Reset button for this group */}
      {isModified && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-7 text-xs"
          onClick={onReset}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset {group.name}
        </Button>
      )}
    </div>
  );
}

export function ColorPalette({
  palette,
  groupAdjustments,
  onGroupAdjustmentChange,
  onClearAllAdjustments,
}: ColorPaletteProps) {
  const [expandedGroup, setExpandedGroup] = useState<ColorGroupId | null>(null);

  // Group colors by hue
  const colorGroups = useMemo(() => groupColorsByHue(palette), [palette]);

  const handleGroupClick = useCallback((groupId: ColorGroupId) => {
    setExpandedGroup((prev) => (prev === groupId ? null : groupId));
  }, []);

  const handleAdjustmentChange = useCallback(
    (groupId: ColorGroupId, adjustment: GroupAdjustment) => {
      onGroupAdjustmentChange(groupId, adjustment);
    },
    [onGroupAdjustmentChange]
  );

  const handleResetGroup = useCallback(
    (groupId: ColorGroupId) => {
      onGroupAdjustmentChange(groupId, null);
    },
    [onGroupAdjustmentChange]
  );

  const hasAnyAdjustments = hasActiveAdjustments(groupAdjustments);

  if (palette.length === 0) {
    return null;
  }

  // Count total pixel coverage
  const totalPixels = palette.reduce((sum, p) => sum + p.count, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Palette className="h-4 w-4" />
            Color Groups
          </div>
          <span className="text-xs text-muted-foreground font-normal">
            {colorGroups.length} groups
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Adjust colors by group. Changes preserve relative differences within
          each group.
        </p>

        {/* Color groups */}
        <div className="space-y-1 max-h-[232px] overflow-y-auto pr-1">
          {colorGroups.map((group) => {
            const adjustment =
              groupAdjustments.get(group.id) ?? createDefaultAdjustment();
            const isExpanded = expandedGroup === group.id;
            const isModified = !isDefaultAdjustment(adjustment);
            const groupPixels = group.colors.reduce(
              (sum, c) => sum + c.count,
              0
            );
            const percentage = Math.round((groupPixels / totalPixels) * 100);

            return (
              <div
                key={group.id}
                className={`rounded-lg border transition-colors ${
                  isExpanded ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                {/* Group header */}
                <button
                  onClick={() => handleGroupClick(group.id)}
                  className="w-full flex items-center gap-2 p-2 text-left"
                >
                  {/* Color swatch */}
                  <div
                    className={`w-6 h-6 rounded border ${
                      isModified ? "border-primary" : "border-border"
                    }`}
                    style={{
                      backgroundColor: getGroupSwatchColor(group, adjustment),
                    }}
                  />

                  {/* Group info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">{group.name}</span>
                      {isModified && (
                        <span className="text-[10px] text-primary">●</span>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {group.colors.length} color
                      {group.colors.length !== 1 ? "s" : ""} · {percentage}%
                    </div>
                  </div>

                  {/* Expand indicator */}
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {/* Expanded editor */}
                {isExpanded && (
                  <div className="px-2 pb-2">
                    <GroupEditor
                      group={group}
                      adjustment={adjustment}
                      onChange={(adj) => handleAdjustmentChange(group.id, adj)}
                      onReset={() => handleResetGroup(group.id)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Reset all button */}
        {hasAnyAdjustments && (
          <div className="pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onClearAllAdjustments}
            >
              <RotateCcw className="h-3 w-3 mr-2" />
              Reset All Groups
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
