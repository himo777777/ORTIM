import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  X,
  Image,
  Film,
  Upload,
  Library,
  Link as LinkIcon,
  Check,
  Loader2,
  Search,
} from 'lucide-react';
import { useMediaLibrary, useMediaUpload, useEmbedVideo } from '@/hooks/useMedia';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MediaPickerModalProps {
  onClose: () => void;
  onInsert: (html: string) => void;
  allowedTypes?: ('image' | 'video')[];
}

interface MediaAsset {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  filename: string;
  alt?: string | null;
  type: 'IMAGE' | 'VIDEO' | 'PDF';
  videoProvider?: string | null;
  videoId?: string | null;
}

export function MediaPickerModal({
  onClose,
  onInsert,
  allowedTypes = ['image', 'video'],
}: MediaPickerModalProps) {
  const [tab, setTab] = useState<'library' | 'upload' | 'embed'>('library');
  const [search, setSearch] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset | null>(null);
  const [embedUrl, setEmbedUrl] = useState('');
  const [embedError, setEmbedError] = useState('');

  const { data: libraryData, isLoading: libraryLoading } = useMediaLibrary({
    type: allowedTypes.includes('video') && !allowedTypes.includes('image') ? 'VIDEO' : undefined,
    search: search || undefined,
    take: 24,
  });

  const uploadMutation = useMediaUpload();
  const embedMutation = useEmbedVideo();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      try {
        const result = await uploadMutation.mutateAsync({ file }) as MediaAsset | undefined;
        if (result) {
          const html = `<img src="${result.url}" alt="${result.alt || result.filename || 'uploaded image'}" />`;
          onInsert(html);
        }
      } catch (error) {
        console.error('Upload failed:', error);
      }
    },
    [uploadMutation, onInsert]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const handleSelectMedia = (media: MediaAsset) => {
    setSelectedMedia(media);
  };

  const handleInsertSelected = () => {
    if (!selectedMedia) return;

    let html = '';
    if (selectedMedia.type === 'IMAGE') {
      html = `<img src="${selectedMedia.url}" alt="${selectedMedia.alt || selectedMedia.filename}" />`;
    } else if (selectedMedia.type === 'VIDEO' && selectedMedia.videoProvider && selectedMedia.videoId) {
      html = getVideoEmbedHtml(selectedMedia.videoProvider, selectedMedia.videoId);
    }

    if (html) {
      onInsert(html);
    }
  };

  const handleEmbed = async () => {
    if (!embedUrl.trim()) return;

    setEmbedError('');

    try {
      const result = await embedMutation.mutateAsync({ url: embedUrl });
      if (result && result.videoProvider && result.videoId) {
        const html = getVideoEmbedHtml(result.videoProvider, result.videoId);
        onInsert(html);
      }
    } catch (error) {
      setEmbedError('Kunde inte tolka video-URL. Kontrollera att det är en giltig YouTube eller Vimeo-länk.');
    }
  };

  const getVideoEmbedHtml = (provider: string, videoId: string) => {
    if (provider === 'youtube') {
      return `<div class="video-embed" data-provider="youtube" data-video-id="${videoId}"><iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
    } else if (provider === 'vimeo') {
      return `<div class="video-embed" data-provider="vimeo" data-video-id="${videoId}"><iframe src="https://player.vimeo.com/video/${videoId}" width="560" height="315" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
    }
    return '';
  };

  const filteredMedia = (libraryData?.assets as MediaAsset[] | undefined)?.filter((asset) => {
    if (allowedTypes.includes('image') && asset.type === 'IMAGE') return true;
    if (allowedTypes.includes('video') && asset.type === 'VIDEO') return true;
    return false;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">Infoga media</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'library' | 'upload' | 'embed')} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Library className="w-4 h-4" />
              Bibliotek
            </TabsTrigger>
            {allowedTypes.includes('image') && (
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Ladda upp
              </TabsTrigger>
            )}
            {allowedTypes.includes('video') && (
              <TabsTrigger value="embed" className="flex items-center gap-2">
                <Film className="w-4 h-4" />
                Bädda in video
              </TabsTrigger>
            )}
          </TabsList>

          {/* Library Tab */}
          <TabsContent value="library" className="flex-1 overflow-hidden flex flex-col m-0 p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Sök media..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {libraryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredMedia?.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Library className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Inga media hittades</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {filteredMedia?.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => handleSelectMedia(asset)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedMedia?.id === asset.id
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      {asset.type === 'IMAGE' ? (
                        <img
                          src={asset.thumbnailUrl || asset.url}
                          alt={asset.alt || asset.filename}
                          className="w-full h-full object-cover"
                        />
                      ) : asset.type === 'VIDEO' ? (
                        <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <Film className="w-8 h-8 text-gray-400" />
                        </div>
                      ) : null}
                      {selectedMedia?.id === asset.id && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="w-8 h-8 text-primary" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedMedia && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <Button onClick={handleInsertSelected}>
                  Infoga vald media
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="flex-1 overflow-hidden m-0 p-4">
            <div
              {...getRootProps()}
              className={`h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 dark:border-gray-700 hover:border-primary'
              }`}
            >
              <input {...getInputProps()} />
              {uploadMutation.isPending ? (
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium mb-2">
                    {isDragActive ? 'Släpp filen här' : 'Dra och släpp en bild här'}
                  </p>
                  <p className="text-sm text-gray-500">eller klicka för att välja fil</p>
                  <p className="text-xs text-gray-400 mt-2">
                    JPEG, PNG, GIF, WebP. Max 10 MB.
                  </p>
                </>
              )}
            </div>
          </TabsContent>

          {/* Embed Tab */}
          <TabsContent value="embed" className="flex-1 overflow-hidden m-0 p-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  YouTube eller Vimeo URL
                </label>
                <Input
                  type="url"
                  value={embedUrl}
                  onChange={(e) => setEmbedUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... eller https://vimeo.com/..."
                />
                {embedError && (
                  <p className="text-sm text-destructive mt-2">{embedError}</p>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Stödda format:</strong>
                </p>
                <ul className="text-sm text-gray-500 mt-2 space-y-1">
                  <li>• youtube.com/watch?v=VIDEO_ID</li>
                  <li>• youtu.be/VIDEO_ID</li>
                  <li>• vimeo.com/VIDEO_ID</li>
                </ul>
              </div>

              <Button
                onClick={handleEmbed}
                disabled={!embedUrl.trim() || embedMutation.isPending}
                className="w-full"
              >
                {embedMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <LinkIcon className="w-4 h-4 mr-2" />
                )}
                Bädda in video
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
