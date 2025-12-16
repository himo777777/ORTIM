import { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface AudioReaderProps {
  text: string;
  className?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onProgress?: (progress: number) => void;
}

const VOICES_BY_LANG: Record<string, string[]> = {
  'sv-SE': ['Swedish'],
  'en-US': ['English (US)'],
  'en-GB': ['English (UK)'],
  'nb-NO': ['Norwegian'],
  'da-DK': ['Danish'],
};

export function AudioReader({
  text,
  className,
  onStart,
  onEnd,
  onProgress,
}: AudioReaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      // Prioritize Swedish voices
      const swedishVoices = voices.filter(v => v.lang.startsWith('sv'));
      const nordicVoices = voices.filter(v =>
        v.lang.startsWith('nb') || v.lang.startsWith('da') || v.lang.startsWith('no')
      );
      const englishVoices = voices.filter(v => v.lang.startsWith('en'));

      setAvailableVoices([...swedishVoices, ...nordicVoices, ...englishVoices, ...voices.filter(v =>
        !v.lang.startsWith('sv') && !v.lang.startsWith('nb') &&
        !v.lang.startsWith('da') && !v.lang.startsWith('no') && !v.lang.startsWith('en')
      )]);

      // Default to first Swedish voice if available
      if (swedishVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(swedishVoices[0]);
      } else if (voices.length > 0 && !selectedVoice) {
        setSelectedVoice(voices[0]);
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [selectedVoice]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const play = () => {
    if (isPaused) {
      speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.volume = isMuted ? 0 : volume;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      onStart?.();

      // Estimate progress based on time
      const estimatedDuration = (text.length / 15) * (1 / rate) * 1000; // rough estimate
      let elapsed = 0;
      progressIntervalRef.current = setInterval(() => {
        elapsed += 100;
        const currentProgress = Math.min((elapsed / estimatedDuration) * 100, 99);
        setProgress(currentProgress);
        onProgress?.(currentProgress);
      }, 100);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(100);
      onProgress?.(100);
      onEnd?.();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  };

  const pause = () => {
    if (isPlaying) {
      speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const stop = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (utteranceRef.current) {
      utteranceRef.current.volume = !isMuted ? 0 : volume;
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    if (isPlaying || isPaused) {
      stop();
      // Restart with new rate
      setTimeout(() => play(), 100);
    }
  };

  const handleVoiceChange = (voice: SpeechSynthesisVoice) => {
    setSelectedVoice(voice);
    if (isPlaying || isPaused) {
      stop();
      setTimeout(() => play(), 100);
    }
  };

  // Skip forward/back by restarting at different position (simplified)
  const skipForward = () => {
    // Text-to-speech doesn't support seeking, so we just restart
    if (progress < 90) {
      setProgress(Math.min(progress + 10, 100));
    }
  };

  const skipBack = () => {
    stop();
    setProgress(0);
    play();
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 bg-muted/50 rounded-lg border',
        className
      )}
    >
      {/* Play/Pause */}
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlay}
        className="h-10 w-10"
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5" />
        )}
      </Button>

      {/* Skip back */}
      <Button
        variant="ghost"
        size="icon"
        onClick={skipBack}
        className="h-8 w-8"
      >
        <SkipBack className="h-4 w-4" />
      </Button>

      {/* Progress bar */}
      <div className="flex-1 space-y-1">
        <Slider
          value={[progress]}
          max={100}
          step={1}
          disabled
          className="cursor-default"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{Math.round(progress)}%</span>
          <span>{text.length} tecken</span>
        </div>
      </div>

      {/* Skip forward */}
      <Button
        variant="ghost"
        size="icon"
        onClick={skipForward}
        className="h-8 w-8"
      >
        <SkipForward className="h-4 w-4" />
      </Button>

      {/* Volume */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8">
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
        <Slider
          value={[isMuted ? 0 : volume]}
          max={1}
          step={0.1}
          onValueChange={handleVolumeChange}
          className="w-16"
        />
      </div>

      {/* Settings */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Uppläsningshastighet</DropdownMenuLabel>
          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => (
            <DropdownMenuItem
              key={r}
              onClick={() => handleRateChange(r)}
              className={cn(rate === r && 'bg-accent')}
            >
              {r}x {r === 1 && '(Normal)'}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuLabel>Röst</DropdownMenuLabel>
          {availableVoices.slice(0, 10).map((voice) => (
            <DropdownMenuItem
              key={voice.voiceURI}
              onClick={() => handleVoiceChange(voice)}
              className={cn(selectedVoice?.voiceURI === voice.voiceURI && 'bg-accent')}
            >
              {voice.name} ({voice.lang})
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
