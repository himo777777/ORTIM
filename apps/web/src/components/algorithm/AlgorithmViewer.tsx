import { useState, useRef } from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Download,
  Info,
  X,
} from 'lucide-react';

interface AlgorithmViewerProps {
  id: string;
  title: string;
  description?: string;
  svgContent: string;
  relatedChapterId?: string;
  className?: string;
}

function Controls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
      <Button
        variant="secondary"
        size="icon"
        onClick={() => zoomIn()}
        className="shadow-md"
        title="Zooma in"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        onClick={() => zoomOut()}
        className="shadow-md"
        title="Zooma ut"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        onClick={() => resetTransform()}
        className="shadow-md"
        title="Återställ vy"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function AlgorithmViewer({
  id,
  title,
  description,
  svgContent,
  relatedChapterId,
  className,
}: AlgorithmViewerProps) {
  const [showInfo, setShowInfo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleDownload = () => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-card border rounded-xl overflow-hidden',
        isFullscreen && 'fixed inset-0 z-50 rounded-none',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/50">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">{title}</h3>
          {description && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowInfo(!showInfo)}
            >
              <Info className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDownload}
            title="Ladda ner SVG"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleFullscreen}
            title="Helskärm"
          >
            {isFullscreen ? (
              <X className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Info Panel */}
      {showInfo && description && (
        <div className="p-4 bg-blue-50 border-b border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">{description}</p>
        </div>
      )}

      {/* SVG Viewer */}
      <div className={cn('relative', isFullscreen ? 'h-[calc(100vh-64px)]' : 'h-[500px]')}>
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={4}
          centerOnInit
          wheel={{ step: 0.1 }}
        >
          <Controls />
          <TransformComponent
            wrapperClass="!w-full !h-full"
            contentClass="!w-full !h-full flex items-center justify-center"
          >
            <div
              className="algorithm-svg max-w-full max-h-full"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          </TransformComponent>
        </TransformWrapper>

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-background/80 px-3 py-1.5 rounded-full">
          Skrolla för att zooma • Dra för att panorera
        </div>
      </div>
    </div>
  );
}
