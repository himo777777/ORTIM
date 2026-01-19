import { useState, useCallback } from 'react';
import { useMediaLibrary, useMediaUpload, useEmbedVideo, useDeleteMedia } from '@/hooks/useMedia';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Image as ImageIcon,
  Video,
  FileText,
  Upload,
  Search,
  Trash2,
  MoreVertical,
  Link,
  Loader2,
  AlertTriangle,
  Grid,
  List,
  FolderOpen,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';

type MediaType = 'IMAGE' | 'VIDEO' | 'PDF';

export default function MediaLibraryPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<MediaType | undefined>();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');

  const { data, isLoading, error } = useMediaLibrary({
    search: search || undefined,
    type: typeFilter,
    take: 50,
  });

  const uploadMutation = useMediaUpload();
  const embedMutation = useEmbedVideo();
  const deleteMutation = useDeleteMedia();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      uploadMutation.mutate({ file });
    });
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const handleEmbed = () => {
    if (embedUrl) {
      embedMutation.mutate(
        { url: embedUrl },
        {
          onSuccess: () => {
            setEmbedUrl('');
            setEmbedDialogOpen(false);
          },
        }
      );
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Vill du verkligen ta bort denna fil?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getTypeIcon = (type: MediaType) => {
    switch (type) {
      case 'IMAGE':
        return <ImageIcon className="h-4 w-4" />;
      case 'VIDEO':
        return <Video className="h-4 w-4" />;
      case 'PDF':
        return <FileText className="h-4 w-4" />;
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Kunde inte ladda mediabiblioteket</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-primary" />
            Mediabibliotek
          </h1>
          <p className="text-muted-foreground mt-1">
            Hantera bilder, videor och dokument
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={embedDialogOpen} onOpenChange={setEmbedDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Link className="h-4 w-4 mr-2" />
                Bädda in video
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bädda in video</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  Klistra in en YouTube eller Vimeo-URL
                </p>
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={embedUrl}
                  onChange={(e) => setEmbedUrl(e.target.value)}
                />
                <Button
                  onClick={handleEmbed}
                  disabled={!embedUrl || embedMutation.isPending}
                  className="w-full"
                >
                  {embedMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Video className="h-4 w-4 mr-2" />
                  )}
                  Lägg till video
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Upload Zone */}
      <Card
        {...getRootProps()}
        className={`cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
        }`}
      >
        <CardContent className="py-8">
          <input {...getInputProps()} />
          <div className="flex flex-col items-center text-center">
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-lg font-medium">Laddar upp...</p>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">
                  {isDragActive
                    ? 'Släpp filen här...'
                    : 'Dra och släpp filer här, eller klicka för att välja'}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Stöder JPEG, PNG, GIF, WebP (max 10 MB) och PDF (max 50 MB)
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök media..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs
          value={typeFilter || 'all'}
          onValueChange={(v) => setTypeFilter(v === 'all' ? undefined : (v as MediaType))}
        >
          <TabsList>
            <TabsTrigger value="all">Alla</TabsTrigger>
            <TabsTrigger value="IMAGE">Bilder</TabsTrigger>
            <TabsTrigger value="VIDEO">Video</TabsTrigger>
            <TabsTrigger value="PDF">PDF</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Media Grid/List */}
      {isLoading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4' : 'space-y-2'}>
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className={viewMode === 'grid' ? 'aspect-square rounded-lg' : 'h-16'} />
          ))}
        </div>
      ) : data?.assets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Inga filer hittades</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ladda upp filer eller justera dina filter
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {data?.assets.map((asset) => (
            <Card key={asset.id} className="overflow-hidden group relative">
              <div className="aspect-square bg-muted relative">
                {asset.type === 'IMAGE' ? (
                  <img
                    src={asset.thumbnailUrl || asset.url}
                    alt={asset.alt || asset.filename}
                    className="w-full h-full object-cover"
                  />
                ) : asset.type === 'VIDEO' ? (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900">
                    {asset.thumbnailUrl ? (
                      <img
                        src={asset.thumbnailUrl}
                        alt={asset.alt || 'Video thumbnail'}
                        className="w-full h-full object-cover opacity-70"
                      />
                    ) : null}
                    <Video className="absolute h-12 w-12 text-white" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100">
                    <FileText className="h-12 w-12 text-slate-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => window.open(asset.url, '_blank')}
                      >
                        Öppna
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigator.clipboard.writeText(asset.url)}
                      >
                        Kopiera URL
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(asset.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Ta bort
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardContent className="p-2">
                <p className="text-xs font-medium truncate">{asset.filename}</p>
                <div className="flex items-center justify-between mt-1">
                  <Badge variant="outline" className="text-xs">
                    {getTypeIcon(asset.type)}
                    <span className="ml-1">{asset.type}</span>
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(asset.size)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {data?.assets.map((asset) => (
            <Card key={asset.id}>
              <CardContent className="p-3 flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded flex-shrink-0 overflow-hidden">
                  {asset.type === 'IMAGE' ? (
                    <img
                      src={asset.thumbnailUrl || asset.url}
                      alt={asset.alt || asset.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : asset.type === 'VIDEO' ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900">
                      <Video className="h-6 w-6 text-white" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="h-6 w-6 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{asset.filename}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(asset.size)} • {new Date(asset.createdAt).toLocaleDateString('sv-SE')}
                  </p>
                </div>
                <Badge variant="outline">{asset.type}</Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => window.open(asset.url, '_blank')}>
                      Öppna
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(asset.url)}>
                      Kopiera URL
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(asset.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Ta bort
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      {data && (
        <p className="text-sm text-muted-foreground text-center">
          Visar {data.assets.length} av {data.total} filer
        </p>
      )}
    </div>
  );
}
