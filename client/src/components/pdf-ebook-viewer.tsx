import { useState, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bookmark, ChevronLeft, ChevronRight, Maximize2, Minimize2, Download, FileText } from "lucide-react";
import { usePdfBookmarks } from "@/hooks/usePdfBookmarks";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker for react-pdf v10 with Vite compatibility
// CRITICAL FIX: Use CDN URL directly to avoid route-relative path resolution issues
// The new URL() approach was resolving to /lessons/pdf.worker.mjs when on lesson pages
// Using a CDN ensures the worker loads from an absolute URL regardless of current route
if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
  // Use CDN with version 5.4.296 which matches react-pdf v10's dependency
  // This is the most reliable approach and avoids Vite path resolution issues
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs';
  console.log('✅ PDF.js worker configured (CDN):', pdfjs.GlobalWorkerOptions.workerSrc);
}

interface PdfEbookViewerProps {
  pdfUrl: string;
  lessonTitle: string;
  lessonId: string;
}

export default function PdfEbookViewer({ pdfUrl, lessonTitle, lessonId }: PdfEbookViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageWidth, setPageWidth] = useState(800);
  const [pdfData, setPdfData] = useState<Blob | string | null>(null);
  const [workerReady, setWorkerReady] = useState(false);
  
  const { bookmarks, toggleBookmark, isBookmarked, removeBookmark } = usePdfBookmarks(lessonId);

  // Verify worker is configured on mount and wait for it to be ready
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkWorker = () => {
        const workerSrc = pdfjs.GlobalWorkerOptions.workerSrc;
        if (workerSrc) {
          console.log('✅ PDF.js worker is configured:', workerSrc);
          // Small delay to ensure worker is fully loaded
          setTimeout(() => {
            setWorkerReady(true);
          }, 100);
        } else {
          console.error('❌ PDF.js worker is NOT configured!');
          // Retry after a short delay in case it's still initializing
          setTimeout(() => {
            const retryWorkerSrc = pdfjs.GlobalWorkerOptions.workerSrc;
            if (retryWorkerSrc) {
              console.log('✅ PDF.js worker configured on retry:', retryWorkerSrc);
              setWorkerReady(true);
            } else {
              setError('PDF viewer worker not initialized. Please refresh the page.');
            }
          }, 500);
        }
      };
      checkWorker();
    }
  }, []);

  // Fetch PDF as blob when URL changes - this helps with CORS and loading issues
  useEffect(() => {
    console.log('PdfEbookViewer mounted/updated with pdfUrl:', pdfUrl);
    if (!pdfUrl) {
      setError('No PDF URL provided.');
      setLoading(false);
      setPdfData(null);
      return;
    }

    // Reset state when PDF URL changes
    setLoading(true);
    setError(null);
    setNumPages(null);
    setPageNumber(1);
    
    // Try fetching as blob first, fallback to direct URL
    const fetchPdf = async () => {
      try {
        console.log('Fetching PDF from:', pdfUrl);
        const response = await fetch(pdfUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Check if response is actually a PDF
        const contentType = response.headers.get('content-type');
        console.log('PDF Content-Type:', contentType);
        
        if (contentType && contentType.includes('application/pdf')) {
          const blob = await response.blob();
          console.log('PDF blob created, size:', blob.size);
          setPdfData(blob);
        } else {
          // If not a blob, try using the URL directly
          console.log('Content-Type not PDF, using URL directly');
          setPdfData(pdfUrl);
        }
      } catch (err: any) {
        console.error('Error fetching PDF:', err);
        // Fallback to using URL directly
        console.log('Falling back to direct URL');
        setPdfData(pdfUrl);
      }
    };

    fetchPdf();
  }, [pdfUrl]);

  // Calculate page width based on container and scale
  useEffect(() => {
    const updatePageWidth = () => {
      const container = document.getElementById('pdf-viewer-container');
      if (container) {
        const containerWidth = container.clientWidth - 64; // padding
        setPageWidth(Math.min(containerWidth, 800) * scale);
      }
    };
    
    updatePageWidth();
    window.addEventListener('resize', updatePageWidth);
    return () => window.removeEventListener('resize', updatePageWidth);
  }, [scale]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully, pages:', numPages);
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    console.error('PDF URL:', pdfUrl);
    console.error('Worker source:', pdfjs.GlobalWorkerOptions.workerSrc);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // More detailed error message with specific handling for worker errors
    let errorMessage = 'Failed to load PDF. ';
    const errorMsg = error.message || '';
    
    if (errorMsg.includes('Missing PDF') || errorMsg.includes('not found')) {
      errorMessage += 'PDF file not found. Please verify the file exists.';
    } else if (errorMsg.includes('Invalid PDF') || errorMsg.includes('format')) {
      errorMessage += 'Invalid PDF format.';
    } else if (errorMsg.includes('Network') || errorMsg.includes('fetch')) {
      errorMessage += 'Network error. Please check your connection and try again.';
    } else if (errorMsg.includes('worker') || errorMsg.includes('specifier') || errorMsg.includes('remapped')) {
      errorMessage += 'PDF viewer worker error. The worker may not be loading correctly. Please refresh the page.';
      console.error('Worker error detected. Current worker source:', pdfjs.GlobalWorkerOptions.workerSrc);
    } else if (errorMsg.includes('CORS') || errorMsg.includes('cross-origin')) {
      errorMessage += 'CORS error. The PDF server may not allow cross-origin requests.';
    } else {
      // Show the actual error message for debugging
      errorMessage += `Error: ${errorMsg || 'Unknown error'}. Please check the browser console for details.`;
    }
    
    setError(errorMessage);
    setLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => {
      if (numPages === null) return prev;
      return Math.min(numPages, prev + 1);
    });
  };

  const goToPage = (page: number) => {
    if (numPages === null) return;
    setPageNumber(Math.max(1, Math.min(numPages, page)));
  };

  const handleBookmark = () => {
    toggleBookmark(pageNumber);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${lessonTitle.replace(/\s+/g, '-')}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't handle if typing in input
      }
      
      if (e.key === 'ArrowLeft') {
        goToPrevPage();
      } else if (e.key === 'ArrowRight') {
        goToNextPage();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [pageNumber, numPages]);

  // Touch/swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      goToNextPage();
    } else if (isRightSwipe) {
      goToPrevPage();
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
      setScale(2);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
      setScale(1.5);
    }
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-8 text-center">
          <FileText className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-700">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <FileText className="w-5 h-5" />
            {lessonTitle}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4 mr-2" />
                  Exit Fullscreen
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Fullscreen
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          id="pdf-viewer-container"
          className="space-y-4"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-4 p-2 bg-gray-50 rounded-lg flex-wrap">
            <Button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1 || loading}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex items-center gap-3 flex-1 justify-center">
              <span className="text-sm text-gray-700">
                Page {pageNumber} of {numPages || '...'}
              </span>
              <input
                type="number"
                min="1"
                max={numPages || 1}
                value={pageNumber}
                onChange={(e) => goToPage(Number(e.target.value))}
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center"
                disabled={loading || !numPages}
              />
            </div>
            
            <Button
              onClick={goToNextPage}
              disabled={pageNumber >= (numPages || 0) || loading}
              variant="outline"
              size="sm"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            
            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              <Download className="w-4 h-4 mr-1" />
              Download PDF
            </Button>
            
            <Button
              onClick={handleBookmark}
              variant={isBookmarked(pageNumber) ? "default" : "outline"}
              size="sm"
              className={isBookmarked(pageNumber) ? "bg-blue-600 text-white" : ""}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked(pageNumber) ? "fill-current" : ""}`} />
            </Button>
          </div>

          {/* PDF Display */}
          <div className="flex justify-center bg-gray-100 rounded-lg p-4 min-h-[600px]">
            {!workerReady ? (
              <div className="flex items-center justify-center h-full w-full">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-gray-600">Initializing PDF viewer...</p>
                </div>
              </div>
            ) : pdfData ? (
              <Document
                file={pdfData}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center h-full w-full">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-gray-600">Loading PDF...</p>
                      <p className="text-xs text-gray-500 mt-2">{pdfUrl}</p>
                    </div>
                  </div>
                }
                className="flex justify-center w-full"
                options={{
                  // Use CDN for cMaps and fonts (these are optional but improve PDF rendering)
                  // The worker is already configured globally above using Vite's new URL() approach
                  cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/cmaps/',
                  cMapPacked: true,
                  httpHeaders: {},
                  withCredentials: false,
                  standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/standard_fonts/',
                }}
                error={
                  <div className="flex items-center justify-center h-full w-full">
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-red-400 mx-auto mb-3" />
                      <p className="text-red-700 font-medium">Failed to load PDF</p>
                      <p className="text-xs text-red-600 mt-2">URL: {pdfUrl}</p>
                      <p className="text-xs text-red-600 mt-1">Check browser console for details</p>
                    </div>
                  </div>
                }
              >
                {numPages && numPages > 0 ? (
                  <Page
                    pageNumber={pageNumber}
                    width={pageWidth}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="shadow-lg"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-gray-600">Rendering PDF page...</p>
                    </div>
                  </div>
                )}
              </Document>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No PDF available</p>
                </div>
              </div>
            )}
          </div>

          {/* Bookmarked Pages List */}
          {bookmarks.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Bookmark className="w-4 h-4 fill-current" />
                Bookmarked Pages ({bookmarks.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {bookmarks.map((bookmarkPage) => (
                  <Button
                    key={bookmarkPage}
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(bookmarkPage)}
                    className="text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    Page {bookmarkPage}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBookmark(bookmarkPage);
                      }}
                      className="ml-2 text-blue-500 hover:text-blue-700"
                    >
                      ×
                    </button>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Help Text */}
          <p className="text-xs text-gray-500 text-center">
            Use arrow keys or swipe left/right to navigate • Click bookmark to save pages for reference
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

