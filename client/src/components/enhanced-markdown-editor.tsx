import { useState, useRef, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Bold, 
  Italic, 
  Hash, 
  Link, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Image, 
  Table,
  Eye,
  EyeOff,
  Undo,
  Redo,
  Type,
  AlignLeft,
  CheckSquare,
  Minus
} from "lucide-react";

interface EnhancedMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  showWordCount?: boolean;
  showPreview?: boolean;
}

export default function EnhancedMarkdownEditor({
  value,
  onChange,
  placeholder = "Start writing in Markdown...",
  height = "500px",
  showWordCount = true,
  showPreview = true
}: EnhancedMarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<"write" | "preview" | "split">("split");
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Save to undo stack
  const saveToUndoStack = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-19), value]); // Keep last 20 states
    setRedoStack([]);
  }, [value]);

  // Undo functionality
  const handleUndo = useCallback(() => {
    if (undoStack.length > 0) {
      const lastState = undoStack[undoStack.length - 1];
      setRedoStack(prev => [value, ...prev]);
      setUndoStack(prev => prev.slice(0, -1));
      onChange(lastState);
    }
  }, [undoStack, value, onChange]);

  // Redo functionality
  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const nextState = redoStack[0];
      setUndoStack(prev => [...prev, value]);
      setRedoStack(prev => prev.slice(1));
      onChange(nextState);
    }
  }, [redoStack, value, onChange]);

  // Insert markdown formatting
  const insertMarkdown = useCallback((type: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    saveToUndoStack();
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    let insertText = "";
    let cursorOffset = 0;

    switch (type) {
      case "bold":
        insertText = selectedText ? `**${selectedText}**` : "**bold text**";
        cursorOffset = selectedText ? insertText.length : 2;
        break;
      case "italic":
        insertText = selectedText ? `*${selectedText}*` : "*italic text*";
        cursorOffset = selectedText ? insertText.length : 1;
        break;
      case "header1":
        insertText = selectedText ? `# ${selectedText}` : "# Header 1";
        cursorOffset = insertText.length;
        break;
      case "header2":
        insertText = selectedText ? `## ${selectedText}` : "## Header 2";
        cursorOffset = insertText.length;
        break;
      case "header3":
        insertText = selectedText ? `### ${selectedText}` : "### Header 3";
        cursorOffset = insertText.length;
        break;
      case "link":
        insertText = selectedText ? `[${selectedText}](url)` : "[link text](url)";
        cursorOffset = insertText.length - 4;
        break;
      case "image":
        insertText = selectedText ? `![${selectedText}](image-url)` : "![alt text](image-url)";
        cursorOffset = insertText.length - 11;
        break;
      case "code":
        insertText = selectedText ? `\`${selectedText}\`` : "`code`";
        cursorOffset = selectedText ? insertText.length : 1;
        break;
      case "codeblock":
        insertText = selectedText ? `\`\`\`\n${selectedText}\n\`\`\`` : "```\ncode block\n```";
        cursorOffset = selectedText ? insertText.length : 4;
        break;
      case "quote":
        insertText = selectedText ? `> ${selectedText}` : "> Quote text";
        cursorOffset = insertText.length;
        break;
      case "ul":
        insertText = selectedText ? `- ${selectedText}` : "- List item";
        cursorOffset = insertText.length;
        break;
      case "ol":
        insertText = selectedText ? `1. ${selectedText}` : "1. List item";
        cursorOffset = insertText.length;
        break;
      case "checkbox":
        insertText = selectedText ? `- [ ] ${selectedText}` : "- [ ] Task item";
        cursorOffset = insertText.length;
        break;
      case "table":
        insertText = "| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |";
        cursorOffset = insertText.length;
        break;
      case "hr":
        insertText = "\n---\n";
        cursorOffset = insertText.length;
        break;
      default:
        return;
    }

    const newValue = beforeText + insertText + afterText;
    onChange(newValue);

    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 0);
  }, [value, onChange, saveToUndoStack]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
          break;
        case 'b':
          e.preventDefault();
          insertMarkdown('bold');
          break;
        case 'i':
          e.preventDefault();
          insertMarkdown('italic');
          break;
        case 'k':
          e.preventDefault();
          insertMarkdown('link');
          break;
      }
    }
  }, [handleUndo, handleRedo, insertMarkdown]);

  // Word and character count
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;
  const charCountNoSpaces = value.replace(/\s/g, '').length;

  // Custom markdown components
  const components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={tomorrow}
          language={match[1]}
          PreTag="div"
          className="rounded-lg"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    },
    blockquote({ children }: any) {
      return (
        <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 text-slate-700 italic">
          {children}
        </blockquote>
      );
    },
    table({ children }: any) {
      return (
        <div className="overflow-x-auto my-4">
          <table className="min-w-full border-collapse border border-slate-300">
            {children}
          </table>
        </div>
      );
    },
    th({ children }: any) {
      return (
        <th className="border border-slate-300 bg-slate-100 px-4 py-2 text-left font-semibold">
          {children}
        </th>
      );
    },
    td({ children }: any) {
      return (
        <td className="border border-slate-300 px-4 py-2">
          {children}
        </td>
      );
    },
  };

  return (
    <div className="w-full border border-slate-200 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              Enhanced Markdown Editor
            </Badge>
            {showWordCount && (
              <div className="text-xs text-slate-500 flex items-center space-x-3">
                <span>{wordCount} words</span>
                <span>{charCount} chars</span>
                <span>{charCountNoSpaces} chars (no spaces)</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="h-8 w-8 p-0"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="h-8 w-8 p-0"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Formatting Toolbar */}
        <div className="flex flex-wrap items-center gap-1">
          {/* Text Formatting */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown('bold')}
              className="h-8 w-8 p-0"
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown('italic')}
              className="h-8 w-8 p-0"
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown('code')}
              className="h-8 w-8 p-0"
              title="Inline Code"
            >
              <Code className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Headers */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown('header1')}
              className="h-8 px-2 text-xs"
              title="Header 1"
            >
              H1
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown('header2')}
              className="h-8 px-2 text-xs"
              title="Header 2"
            >
              H2
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown('header3')}
              className="h-8 px-2 text-xs"
              title="Header 3"
            >
              H3
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Lists and Elements */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown('ul')}
              className="h-8 w-8 p-0"
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown('ol')}
              className="h-8 w-8 p-0"
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown('checkbox')}
              className="h-8 w-8 p-0"
              title="Task List"
            >
              <CheckSquare className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown('quote')}
              className="h-8 w-8 p-0"
              title="Quote"
            >
              <Quote className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Links and Media */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown('link')}
              className="h-8 w-8 p-0"
              title="Link (Ctrl+K)"
            >
              <Link className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown('image')}
              className="h-8 w-8 p-0"
              title="Image"
            >
              <Image className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown('table')}
              className="h-8 w-8 p-0"
              title="Table"
            >
              <Table className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Advanced */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown('codeblock')}
              className="h-8 px-2 text-xs"
              title="Code Block"
            >
              ```
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertMarkdown('hr')}
              className="h-8 w-8 p-0"
              title="Horizontal Rule"
            >
              <Minus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="relative">
        {showPreview ? (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="write">Write</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="split">Split View</TabsTrigger>
            </TabsList>

            <TabsContent value="write" className="mt-0">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full p-4 border-0 resize-none focus:outline-none focus:ring-0 font-mono text-sm leading-relaxed"
                style={{ height }}
                data-testid="enhanced-markdown-textarea"
              />
            </TabsContent>

            <TabsContent value="preview" className="mt-0">
              <div 
                className="p-4 overflow-auto prose prose-slate max-w-none"
                style={{ height }}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  rehypePlugins={[rehypeRaw]}
                  components={components}
                >
                  {value || "*Nothing to preview yet. Start writing in the Write tab.*"}
                </ReactMarkdown>
              </div>
            </TabsContent>

            <TabsContent value="split" className="mt-0">
              <div className="grid grid-cols-2 gap-0" style={{ height }}>
                <div className="border-r border-slate-200">
                  <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full h-full p-4 border-0 resize-none focus:outline-none focus:ring-0 font-mono text-sm leading-relaxed"
                    data-testid="enhanced-markdown-textarea-split"
                  />
                </div>
                <div className="overflow-auto p-4 prose prose-slate prose-sm max-w-none bg-slate-50">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    rehypePlugins={[rehypeRaw]}
                    components={components}
                  >
                    {value || "*Nothing to preview yet. Start writing...*"}
                  </ReactMarkdown>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full p-4 border-0 resize-none focus:outline-none focus:ring-0 font-mono text-sm leading-relaxed"
            style={{ height }}
            data-testid="enhanced-markdown-textarea-simple"
          />
        )}
      </div>

      {/* Help Text */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-2">
        <p className="text-xs text-slate-500">
          Supports GitHub Flavored Markdown with tables, task lists, syntax highlighting, and more. 
          Use <kbd className="bg-slate-200 px-1 rounded">Ctrl+B</kbd> for bold, <kbd className="bg-slate-200 px-1 rounded">Ctrl+I</kbd> for italic, 
          <kbd className="bg-slate-200 px-1 rounded">Ctrl+K</kbd> for links.
        </p>
      </div>
    </div>
  );
}