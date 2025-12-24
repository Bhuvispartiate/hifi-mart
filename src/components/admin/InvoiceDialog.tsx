import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import InvoiceReceipt from './InvoiceReceipt';
import { Order } from '@/lib/firestoreService';

interface InvoiceDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InvoiceDialog = ({ order, open, onOpenChange }: InvoiceDialogProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${order?.id?.slice(0, 8).toUpperCase()}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .text-xs { font-size: 10px; }
            .text-sm { font-size: 11px; }
            .text-xl { font-size: 16px; }
            .mt-1 { margin-top: 4px; }
            .mb-4 { margin-bottom: 12px; }
            .pb-4 { padding-bottom: 12px; }
            .pt-4 { padding-top: 12px; }
            .py-1 { padding-top: 2px; padding-bottom: 2px; }
            .pr-2 { padding-right: 8px; }
            .space-y-1 > * + * { margin-top: 4px; }
            .border-dashed { border-style: dashed; }
            .border-b { border-bottom: 1px dashed #ccc; }
            .border-t { border-top: 1px dashed #ccc; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .flex-1 { flex: 1; }
            .w-12 { width: 40px; }
            .w-16 { width: 50px; }
            .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .text-muted { color: #666; }
            .text-success { color: #16a34a; }
            .capitalize { text-transform: capitalize; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice #{order.id.slice(0, 8).toUpperCase()}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="border border-border rounded-lg overflow-hidden">
          <InvoiceReceipt ref={printRef} order={order} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDialog;
