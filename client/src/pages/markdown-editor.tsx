import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, FileText, Copy } from "lucide-react";
import EnhancedMarkdownEditor from "@/components/enhanced-markdown-editor";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import RoleBasedNavigation from "@/components/role-based-navigation";

export default function MarkdownEditor() {
  const [content, setContent] = useState(`# Welcome to the Enhanced Markdown Editor

This is a powerful markdown editor with live preview, syntax highlighting, and advanced features.

## Features

- **Live Preview**: See your formatted content in real-time
- **Split View**: Write and preview simultaneously
- **Syntax Highlighting**: Code blocks with beautiful syntax highlighting
- **Keyboard Shortcuts**: Quick formatting with Ctrl+B, Ctrl+I, Ctrl+K
- **Word Count**: Track your writing progress
- **Undo/Redo**: Full editing history management
- **GitHub Flavored Markdown**: Tables, task lists, and more

## Getting Started

Use the toolbar above to format your text, or try these keyboard shortcuts:

- \`Ctrl+B\` for **bold text**
- \`Ctrl+I\` for *italic text*
- \`Ctrl+K\` for [links](https://example.com)

### Code Example

Here's a JavaScript function:

\`\`\`javascript
function calculateDiveTime(depth, airSupply) {
  const safetyFactor = 0.8;
  const consumptionRate = depth * 0.5;
  return (airSupply * safetyFactor) / consumptionRate;
}
\`\`\`

### Task List

- [x] Learn markdown basics
- [x] Try the enhanced editor
- [ ] Create professional content
- [ ] Export your work

### Table Example

| Depth (m) | Pressure (bar) | Max Time (min) |
|-----------|----------------|----------------|
| 10        | 2.0            | 120           |
| 20        | 3.0            | 80            |
| 30        | 4.0            | 60            |

---

> **Tip**: Switch between Write, Preview, and Split View tabs to find your preferred editing style.

Happy writing! 🚀`);

  const { toast } = useToast();

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: "Your markdown file has been downloaded.",
    });
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.txt';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setContent(text);
          toast({
            title: "File Loaded!",
            description: `${file.name} has been loaded into the editor.`,
          });
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied!",
        description: "Content copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50" data-sidebar-content="true">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Enhanced Markdown Editor
              </h1>
              <p className="text-lg text-slate-600">
                Create professional content with live preview and advanced formatting
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleUpload}
                variant="outline"
                className="flex items-center gap-2"
                data-testid="button-upload"
              >
                <Upload className="w-4 h-4" />
                Import
              </Button>
              <Button
                onClick={handleCopyToClipboard}
                variant="outline"
                className="flex items-center gap-2"
                data-testid="button-copy"
              >
                <Copy className="w-4 h-4" />
                Copy
              </Button>
              <Button
                onClick={handleDownload}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                data-testid="button-download"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-6 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>{wordCount} words</span>
            </div>
            <div>
              <span>{charCount} characters</span>
            </div>
            <div>
              <span>~{readingTime} min read</span>
            </div>
          </div>
        </div>

        {/* Enhanced Markdown Editor */}
        <Card className="mb-8">
          <CardContent className="p-0">
            <EnhancedMarkdownEditor
              value={content}
              onChange={setContent}
              placeholder="Start writing your markdown content here..."
              height="700px"
              showWordCount={true}
              showPreview={true}
            />
          </CardContent>
        </Card>

        {/* Quick Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900">Keyboard Shortcuts</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li><kbd className="bg-slate-200 px-1 rounded">Ctrl+B</kbd> Bold text</li>
                  <li><kbd className="bg-slate-200 px-1 rounded">Ctrl+I</kbd> Italic text</li>
                  <li><kbd className="bg-slate-200 px-1 rounded">Ctrl+K</kbd> Insert link</li>
                  <li><kbd className="bg-slate-200 px-1 rounded">Ctrl+Z</kbd> Undo</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900">Formatting</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li><code># Text</code> Header 1</li>
                  <li><code>## Text</code> Header 2</li>
                  <li><code>**Text**</code> Bold</li>
                  <li><code>*Text*</code> Italic</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900">Advanced</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li><code>```code```</code> Code block</li>
                  <li><code>- [ ] Task</code> Checklist</li>
                  <li><code>| Table |</code> Tables</li>
                  <li><code>&gt; Quote</code> Blockquote</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        </main>
      </div>
    </>
  );
}