import { useState, useEffect } from 'react';
import { Focus, X, Timer, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useStudyStore } from '@/stores/studyStore';
import { cn } from '@/lib/utils';

interface FocusModeProps {
  onActivate?: () => void;
  onDeactivate?: () => void;
}

export function FocusMode({ onActivate, onDeactivate }: FocusModeProps) {
  const {
    focusMode,
    toggleFocusMode,
    focusSettings,
    updateFocusSettings,
    addStudyTime,
  } = useStudyStore();

  const [timeRemaining, setTimeRemaining] = useState(focusSettings.pomodoroLength * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  // Timer logic
  useEffect(() => {
    if (!isTimerRunning || !focusMode) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Timer complete
          setIsTimerRunning(false);
          setSessionsCompleted((s) => s + 1);
          addStudyTime(focusSettings.pomodoroLength);

          // Play notification sound if enabled
          if (focusSettings.soundEnabled) {
            playNotificationSound();
          }

          // Reset timer
          return focusSettings.pomodoroLength * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, focusMode, focusSettings, addStudyTime]);

  // Handle focus mode changes
  useEffect(() => {
    if (focusMode) {
      onActivate?.();
      document.body.classList.add('focus-mode-active');

      // Hide distracting elements
      if (focusSettings.hideNavigation) {
        document.body.classList.add('focus-hide-nav');
      }
    } else {
      onDeactivate?.();
      document.body.classList.remove('focus-mode-active', 'focus-hide-nav');
      setIsTimerRunning(false);
    }

    return () => {
      document.body.classList.remove('focus-mode-active', 'focus-hide-nav');
    };
  }, [focusMode, focusSettings.hideNavigation, onActivate, onDeactivate]);

  const playNotificationSound = () => {
    // Simple beep using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setTimeRemaining(focusSettings.pomodoroLength * 60);
    setIsTimerRunning(false);
  };

  // Focus mode toggle button
  if (!focusMode) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Focus className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Focus className="h-5 w-5" />
              Fokusläge
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <p className="text-sm text-muted-foreground">
              Aktivera fokusläge för en distraktionsfri studieupplevelse med
              pomodoro-timer och anpassade inställningar.
            </p>

            {/* Settings */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Pomodoro-längd (minuter)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[focusSettings.pomodoroLength]}
                    min={5}
                    max={60}
                    step={5}
                    onValueChange={([value]) =>
                      updateFocusSettings({ pomodoroLength: value })
                    }
                    className="flex-1"
                  />
                  <span className="w-12 text-right font-medium">
                    {focusSettings.pomodoroLength}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="sound">Ljudnotifikation</Label>
                <Switch
                  id="sound"
                  checked={focusSettings.soundEnabled}
                  onCheckedChange={(checked) =>
                    updateFocusSettings({ soundEnabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="hideNav">Dölj navigation</Label>
                <Switch
                  id="hideNav"
                  checked={focusSettings.hideNavigation}
                  onCheckedChange={(checked) =>
                    updateFocusSettings({ hideNavigation: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="dimBg">Dimma bakgrund</Label>
                <Switch
                  id="dimBg"
                  checked={focusSettings.dimBackground}
                  onCheckedChange={(checked) =>
                    updateFocusSettings({ dimBackground: checked })
                  }
                />
              </div>
            </div>

            <Button
              className="w-full"
              onClick={toggleFocusMode}
            >
              <Focus className="h-4 w-4 mr-2" />
              Aktivera fokusläge
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Active focus mode UI
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 pointer-events-none',
        focusSettings.dimBackground && 'bg-black/20'
      )}
    >
      {/* Focus mode controls */}
      <div className="fixed top-4 right-4 pointer-events-auto">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/95 border shadow-lg backdrop-blur">
          {/* Timer */}
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-lg font-semibold">
              {formatTime(timeRemaining)}
            </span>
          </div>

          {/* Timer controls */}
          <div className="flex items-center gap-1 border-l pl-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTimer}
              className="h-8"
            >
              {isTimerRunning ? 'Pausa' : 'Starta'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetTimer}
              className="h-8"
            >
              Återställ
            </Button>
          </div>

          {/* Sessions counter */}
          <div className="border-l pl-2 text-sm text-muted-foreground">
            {sessionsCompleted} sessioner
          </div>

          {/* Sound toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              updateFocusSettings({ soundEnabled: !focusSettings.soundEnabled })
            }
            className="h-8 w-8"
          >
            {focusSettings.soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>

          {/* Exit focus mode */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFocusMode}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Study time summary when timer completes */}
      {sessionsCompleted > 0 && !isTimerRunning && (
        <div className="fixed bottom-4 right-4 pointer-events-auto">
          <div className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400">
            <p className="text-sm font-medium">
              Bra jobbat! {sessionsCompleted * focusSettings.pomodoroLength} minuter
              studerat idag.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact focus mode trigger for toolbar
export function FocusModeTrigger() {
  const { focusMode, toggleFocusMode } = useStudyStore();

  return (
    <Button
      variant={focusMode ? 'default' : 'ghost'}
      size="icon"
      onClick={toggleFocusMode}
      className={cn(focusMode && 'bg-primary text-primary-foreground')}
    >
      <Focus className="h-5 w-5" />
    </Button>
  );
}
