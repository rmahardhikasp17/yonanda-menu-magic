/**
 * Receipt Preview Component (Browser)
 * Uses Single Source of Truth architecture
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, X, Loader2, AlertCircle } from 'lucide-react';
import { ReceiptData } from '@/lib/receipt/receipt-types';
import { buildReceiptTemplate } from '@/lib/receipt/receipt-template';
import { HTMLRenderer } from '@/lib/receipt/receipt-renderer-html';
import { ESCPOSRenderer } from '@/lib/receipt/receipt-renderer-escpos';
import { 
  autoConnectSerialPort, 
  isSerialSupported,
} from '@/lib/thermal-printer';
import { getPrinterMode, isPrinterSetupComplete } from '@/components/PrinterSettings';

interface ReceiptPreviewProps {
  data: ReceiptData;
  onClose: () => void;
  onPrint: () => void;
}

export function ReceiptPreview({ data, onClose, onPrint }: ReceiptPreviewProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printSuccess, setPrintSuccess] = useState(false);

  // Get printer settings
  const printerMode = getPrinterMode();
  const isSetupComplete = isPrinterSetupComplete();
  const canDirectPrintSerial = printerMode === 'serial' && isSerialSupported() && isSetupComplete;

  // Check if this is checkout (only 1 copy needed)
  const isCheckout = data.type === 'checkout';
  const printCopies = isCheckout ? 1 : 2;

  // Build template blocks (SINGLE SOURCE OF TRUTH)
  const blocks = buildReceiptTemplate(data);

  // Direct print handler
  const handlePrint = async () => {
    setError(null);
    setPrintSuccess(false);

    if (canDirectPrintSerial) {
      setIsPrinting(true);
      try {
        const port = await autoConnectSerialPort();
        if (!port) {
          throw new Error('Printer belum disetup. Silakan setup printer di Pengaturan.');
        }

        const renderer = new ESCPOSRenderer(port);

        // Print multiple copies
        for (let i = 0; i < printCopies; i++) {
          await renderer.render(blocks);

          // Small delay between copies
          if (i < printCopies - 1) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }

        onPrint();
        setPrintSuccess(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Gagal mencetak';
        setError(message);
      } finally {
        setIsPrinting(false);
      }
    } else {
      // Browser print fallback
      onPrint();
      window.print();
      setPrintSuccess(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl max-h-[95vh] flex flex-col">
        {/* Header - NOT PRINTED */}
        <div className="flex items-center justify-between border-b p-3 no-print flex-shrink-0">
          <h2 className="text-base font-bold">Preview Nota</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Receipt Content - Uses HTML Renderer */}
        <div className="flex-1 overflow-y-auto">
          <HTMLRenderer blocks={blocks} />
        </div>

        {/* Print button - NOT PRINTED */}
        <div className="border-t p-3 no-print flex-shrink-0 space-y-2">
          {/* Success message */}
          {printSuccess && (
            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded">
              <span>✓ Berhasil mencetak {printCopies} nota!</span>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 p-2 rounded">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button 
            onClick={handlePrint} 
            className="w-full" 
            size="lg"
            disabled={isPrinting}
          >
            {isPrinting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Mencetak {printCopies} nota...
              </>
            ) : printSuccess ? (
              <>
                <Printer className="mr-2 h-5 w-5" />
                Cetak Ulang ({printCopies}x)
              </>
            ) : (
              <>
                <Printer className="mr-2 h-5 w-5" />
                Cetak Nota {!isCheckout && `(${printCopies}x)`}
              </>
            )}
          </Button>

          {/* Close button after print */}
          {printSuccess && (
            <Button variant="outline" onClick={onClose} className="w-full">
              Tutup
            </Button>
          )}

          {/* Mode indicator */}
          <p className="text-[10px] text-center text-muted-foreground">
            {canDirectPrintSerial ? '✓ Cetak langsung ke COM Port' : 'Menggunakan dialog print browser'}
            {!isCheckout && ' • 2 rangkap (tamu & kasir)'}
          </p>
        </div>
      </div>
    </div>
  );
}
