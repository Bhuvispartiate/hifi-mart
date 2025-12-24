import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Scan, X, Keyboard } from 'lucide-react';

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

const BarcodeScanner = ({ open, onClose, onScan }: BarcodeScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !showManualInput) {
      startScanner();
    }
    
    return () => {
      stopScanner();
    };
  }, [open, showManualInput]);

  const startScanner = async () => {
    setError(null);
    
    try {
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!containerRef.current) return;
      
      const scanner = new Html5Qrcode("barcode-reader");
      scannerRef.current = scanner;
      
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
          onClose();
        },
        () => {
          // Ignore scan errors
        }
      );
      
      setIsScanning(true);
    } catch (err: any) {
      console.error("Scanner error:", err);
      setError("Camera access denied or not available. Use manual entry.");
      setShowManualInput(true);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setIsScanning(false);
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
      onClose();
    }
  };

  const handleClose = () => {
    stopScanner();
    setManualCode('');
    setShowManualInput(false);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Scan Barcode
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!showManualInput ? (
            <>
              <div 
                id="barcode-reader" 
                ref={containerRef}
                className="w-full h-64 bg-muted rounded-lg overflow-hidden"
              />
              
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
              
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    stopScanner();
                    setShowManualInput(true);
                  }}
                >
                  <Keyboard className="h-4 w-4 mr-2" />
                  Enter Code Manually
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Input
                  placeholder="Enter barcode / product ID"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                  autoFocus
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setShowManualInput(false);
                    setError(null);
                  }}
                >
                  <Scan className="h-4 w-4 mr-2" />
                  Use Camera
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleManualSubmit}
                  disabled={!manualCode.trim()}
                >
                  Add Product
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner;
