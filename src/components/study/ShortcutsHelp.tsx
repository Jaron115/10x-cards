import { memo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { KEYBOARD_SHORTCUTS } from "@/lib/constants/study";

interface ShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Shortcuts help dialog component
 * Displays keyboard shortcuts for study session
 */
export const ShortcutsHelp = memo<ShortcutsHelpProps>(({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Skróty klawiszowe</DialogTitle>
          <DialogDescription>Użyj klawiatury aby przyśpieszyć naukę</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {KEYBOARD_SHORTCUTS.map((shortcut) => (
            <div key={shortcut.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm">{shortcut.description}</span>
              <Badge variant="secondary" className="font-mono">
                {shortcut.key}
              </Badge>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          💡 Naciśnij <kbd className="px-2 py-1 bg-muted rounded text-xs">?</kbd> aby pokazać/ukryć tę pomoc
        </p>
      </DialogContent>
    </Dialog>
  );
});

ShortcutsHelp.displayName = "ShortcutsHelp";
