/**
 * Whiteboard Component
 * 
 * Interactive drawing/doodling whiteboard for dive operation planning,
 * sketches, notes, and visual communication
 */

import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PenTool, 
  Eraser, 
  Trash2, 
  Download, 
  Upload,
  Minus,
  Circle,
  Square,
  Type,
  Undo,
  Redo
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Point {
  x: number;
  y: number;
}

interface DrawingPath {
  points: Point[];
  color: string;
  lineWidth: number;
  tool: 'pen' | 'eraser';
}

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'pen' | 'eraser' | 'line' | 'circle' | 'rect' | 'text'>('pen');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const { toast } = useToast();

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width - 32; // Account for padding
        canvas.height = 600;
        // Initialize with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Save initial state
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setDrawingHistory([imageData]);
        setHistoryStep(0);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Redraw from history
    if (historyStep >= 0 && drawingHistory[historyStep]) {
      ctx.putImageData(drawingHistory[historyStep], 0, 0);
    }
  };

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = drawingHistory.slice(0, historyStep + 1);
    newHistory.push(imageData);
    setDrawingHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCoordinates(e);
    setIsDrawing(true);
    setStartPoint(point);

    if (currentTool === 'pen' || currentTool === 'eraser') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : currentColor;
      ctx.lineWidth = currentTool === 'eraser' ? lineWidth * 2 : lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const point = getCoordinates(e);

    if (currentTool === 'pen' || currentTool === 'eraser') {
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    } else if (startPoint && (currentTool === 'line' || currentTool === 'circle' || currentTool === 'rect')) {
      // Preview shape while dragging
      redrawCanvas();
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      
      if (currentTool === 'line') {
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      } else if (currentTool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(point.x - startPoint.x, 2) + 
          Math.pow(point.y - startPoint.y, 2)
        );
        ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (currentTool === 'rect') {
        ctx.rect(
          startPoint.x,
          startPoint.y,
          point.x - startPoint.x,
          point.y - startPoint.y
        );
        ctx.stroke();
      }
    }
  };

  const handleMouseUp = (e?: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    // If it's a shape tool, finalize the shape
    if (startPoint && e && (currentTool === 'line' || currentTool === 'circle' || currentTool === 'rect')) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const endPoint = getCoordinates(e);
      redrawCanvas(); // Clear preview

      ctx.strokeStyle = currentColor;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();

      if (currentTool === 'line') {
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.stroke();
      } else if (currentTool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(endPoint.x - startPoint.x, 2) + 
          Math.pow(endPoint.y - startPoint.y, 2)
        );
        ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (currentTool === 'rect') {
        ctx.rect(
          startPoint.x,
          startPoint.y,
          endPoint.x - startPoint.x,
          endPoint.y - startPoint.y
        );
        ctx.stroke();
      }
    }
    
    setIsDrawing(false);
    saveState();
    setStartPoint(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveState();
    toast({
      title: "Canvas cleared",
      description: "The whiteboard has been cleared",
    });
  };

  const undo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      redrawCanvas();
    }
  };

  const redo = () => {
    if (historyStep < drawingHistory.length - 1) {
      setHistoryStep(historyStep + 1);
      redrawCanvas();
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
    toast({
      title: "Downloaded",
      description: "Whiteboard image has been downloaded",
    });
  };

  const loadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        saveState();
        toast({
          title: "Image loaded",
          description: "Image has been loaded onto the whiteboard",
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <PenTool className="w-5 h-5" />
          <span>Whiteboard</span>
        </CardTitle>
        <CardDescription>
          Interactive drawing and doodling space for dive operation planning, sketches, and visual notes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-lg border">
          {/* Drawing Tools */}
          <div className="flex items-center space-x-1 border-r pr-2">
            <Button
              variant={currentTool === 'pen' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('pen')}
              title="Pen"
            >
              <PenTool className="w-4 h-4" />
            </Button>
            <Button
              variant={currentTool === 'eraser' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('eraser')}
              title="Eraser"
            >
              <Eraser className="w-4 h-4" />
            </Button>
            <Button
              variant={currentTool === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('line')}
              title="Line"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Button
              variant={currentTool === 'circle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('circle')}
              title="Circle"
            >
              <Circle className="w-4 h-4" />
            </Button>
            <Button
              variant={currentTool === 'rect' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('rect')}
              title="Rectangle"
            >
              <Square className="w-4 h-4" />
            </Button>
          </div>

          {/* Color Picker */}
          <div className="flex items-center space-x-2 border-r pr-2">
            <label className="text-sm font-medium">Color:</label>
            <input
              type="color"
              value={currentColor}
              onChange={(e) => setCurrentColor(e.target.value)}
              className="w-8 h-8 rounded border cursor-pointer"
            />
          </div>

          {/* Line Width */}
          <div className="flex items-center space-x-2 border-r pr-2">
            <label className="text-sm font-medium">Width:</label>
            <input
              type="range"
              min="1"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-xs text-slate-500 w-8">{lineWidth}px</span>
          </div>

          {/* History */}
          <div className="flex items-center space-x-1 border-r pr-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={historyStep <= 0}
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={historyStep >= drawingHistory.length - 1}
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={clearCanvas}
              title="Clear"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadCanvas}
              title="Download"
            >
              <Download className="w-4 h-4" />
            </Button>
            <label className="cursor-pointer">
              <Button
                variant="outline"
                size="sm"
                asChild
                title="Upload Image"
              >
                <span>
                  <Upload className="w-4 h-4" />
                </span>
              </Button>
              <input
                type="file"
                accept="image/*"
                onChange={loadImage}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Canvas */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => handleMouseUp()}
            className="cursor-crosshair w-full"
            style={{ touchAction: 'none' }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

