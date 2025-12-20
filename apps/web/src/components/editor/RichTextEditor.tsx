import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Link,
  Image,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table,
  Minus,
  Eye,
  Edit3,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  mode?: 'wysiwyg' | 'markdown' | 'split';
  className?: string;
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title: string;
}

function ToolbarButton({ icon, onClick, active, title }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-colors ${
        active
          ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
      }`}
    >
      {icon}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Börja skriva...',
  minHeight = 300,
  mode: initialMode = 'wysiwyg',
  className = '',
}: RichTextEditorProps) {
  const [mode, setMode] = useState<'wysiwyg' | 'markdown' | 'preview'>(
    initialMode === 'split' ? 'wysiwyg' : initialMode
  );
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync content to editor
  useEffect(() => {
    if (editorRef.current && mode === 'wysiwyg') {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value, mode]);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const insertHeading = (level: 1 | 2 | 3) => {
    execCommand('formatBlock', `h${level}`);
  };

  const insertList = (ordered: boolean) => {
    execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList');
  };

  const insertLink = (url: string) => {
    execCommand('createLink', url);
    setShowLinkModal(false);
  };

  const insertImage = (url: string, alt: string) => {
    execCommand('insertImage', url);
    setShowImageModal(false);
  };

  const insertTable = () => {
    const table = `
      <table border="1" style="border-collapse: collapse; width: 100%;">
        <tr>
          <th style="padding: 8px; border: 1px solid #ddd;">Header 1</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Header 2</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Header 3</th>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Cell 1</td>
          <td style="padding: 8px; border: 1px solid #ddd;">Cell 2</td>
          <td style="padding: 8px; border: 1px solid #ddd;">Cell 3</td>
        </tr>
      </table>
    `;
    execCommand('insertHTML', table);
  };

  const insertHorizontalRule = () => {
    execCommand('insertHorizontalRule');
  };

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {/* Mode switcher */}
        <div className="flex gap-1 mr-2">
          <button
            onClick={() => setMode('wysiwyg')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              mode === 'wysiwyg'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Edit3 className="w-4 h-4 inline mr-1" />
            Redigera
          </button>
          <button
            onClick={() => setMode('markdown')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              mode === 'markdown'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Code className="w-4 h-4 inline mr-1" />
            Markdown
          </button>
          <button
            onClick={() => setMode('preview')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              mode === 'preview'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-1" />
            Förhandsgranska
          </button>
        </div>

        <ToolbarDivider />

        {/* Text formatting */}
        <ToolbarButton
          icon={<Bold className="w-4 h-4" />}
          onClick={() => execCommand('bold')}
          title="Fet (Ctrl+B)"
        />
        <ToolbarButton
          icon={<Italic className="w-4 h-4" />}
          onClick={() => execCommand('italic')}
          title="Kursiv (Ctrl+I)"
        />
        <ToolbarButton
          icon={<Underline className="w-4 h-4" />}
          onClick={() => execCommand('underline')}
          title="Understruken (Ctrl+U)"
        />

        <ToolbarDivider />

        {/* Headings */}
        <ToolbarButton
          icon={<Heading1 className="w-4 h-4" />}
          onClick={() => insertHeading(1)}
          title="Rubrik 1"
        />
        <ToolbarButton
          icon={<Heading2 className="w-4 h-4" />}
          onClick={() => insertHeading(2)}
          title="Rubrik 2"
        />
        <ToolbarButton
          icon={<Heading3 className="w-4 h-4" />}
          onClick={() => insertHeading(3)}
          title="Rubrik 3"
        />

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarButton
          icon={<List className="w-4 h-4" />}
          onClick={() => insertList(false)}
          title="Punktlista"
        />
        <ToolbarButton
          icon={<ListOrdered className="w-4 h-4" />}
          onClick={() => insertList(true)}
          title="Numrerad lista"
        />

        <ToolbarDivider />

        {/* Alignment */}
        <ToolbarButton
          icon={<AlignLeft className="w-4 h-4" />}
          onClick={() => execCommand('justifyLeft')}
          title="Vänsterjustera"
        />
        <ToolbarButton
          icon={<AlignCenter className="w-4 h-4" />}
          onClick={() => execCommand('justifyCenter')}
          title="Centrera"
        />
        <ToolbarButton
          icon={<AlignRight className="w-4 h-4" />}
          onClick={() => execCommand('justifyRight')}
          title="Högerjustera"
        />

        <ToolbarDivider />

        {/* Special elements */}
        <ToolbarButton
          icon={<Quote className="w-4 h-4" />}
          onClick={() => execCommand('formatBlock', 'blockquote')}
          title="Citat"
        />
        <ToolbarButton
          icon={<Code className="w-4 h-4" />}
          onClick={() => execCommand('formatBlock', 'pre')}
          title="Kodblock"
        />
        <ToolbarButton
          icon={<Link className="w-4 h-4" />}
          onClick={() => setShowLinkModal(true)}
          title="Infoga länk"
        />
        <ToolbarButton
          icon={<Image className="w-4 h-4" />}
          onClick={() => setShowImageModal(true)}
          title="Infoga bild"
        />
        <ToolbarButton
          icon={<Table className="w-4 h-4" />}
          onClick={insertTable}
          title="Infoga tabell"
        />
        <ToolbarButton
          icon={<Minus className="w-4 h-4" />}
          onClick={insertHorizontalRule}
          title="Horisontell linje"
        />

        <ToolbarDivider />

        {/* Undo/Redo */}
        <ToolbarButton
          icon={<Undo className="w-4 h-4" />}
          onClick={() => execCommand('undo')}
          title="Ångra (Ctrl+Z)"
        />
        <ToolbarButton
          icon={<Redo className="w-4 h-4" />}
          onClick={() => execCommand('redo')}
          title="Gör om (Ctrl+Y)"
        />
      </div>

      {/* Editor Content */}
      <div style={{ minHeight }}>
        {mode === 'wysiwyg' && (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            className="p-4 focus:outline-none prose dark:prose-invert max-w-none"
            style={{ minHeight }}
            data-placeholder={placeholder}
          />
        )}

        {mode === 'markdown' && (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full p-4 bg-transparent resize-none focus:outline-none font-mono text-sm"
            style={{ minHeight }}
          />
        )}

        {mode === 'preview' && (
          <div className="p-4 prose dark:prose-invert max-w-none" style={{ minHeight }}>
            {value ? (
              <div dangerouslySetInnerHTML={{ __html: value }} />
            ) : (
              <p className="text-gray-400 italic">{placeholder}</p>
            )}
          </div>
        )}
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <LinkModal
          onClose={() => setShowLinkModal(false)}
          onInsert={insertLink}
        />
      )}

      {/* Image Modal */}
      {showImageModal && (
        <ImageModal
          onClose={() => setShowImageModal(false)}
          onInsert={insertImage}
        />
      )}
    </div>
  );
}

// Link Modal Component
function LinkModal({
  onClose,
  onInsert,
}: {
  onClose: () => void;
  onInsert: (url: string) => void;
}) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onInsert(url.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4"
      >
        <h3 className="text-lg font-semibold mb-4">Infoga länk</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-primary-500 outline-none mb-4"
            autoFocus
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={!url.trim()}
              className="flex-1 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
            >
              Infoga
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Image Modal Component
function ImageModal({
  onClose,
  onInsert,
}: {
  onClose: () => void;
  onInsert: (url: string, alt: string) => void;
}) {
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onInsert(url.trim(), alt.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4"
      >
        <h3 className="text-lg font-semibold mb-4">Infoga bild</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Bild-URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-primary-500 outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Alt-text (valfritt)</label>
            <input
              type="text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Beskrivning av bilden"
              className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={!url.trim()}
              className="flex-1 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
            >
              Infoga
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
