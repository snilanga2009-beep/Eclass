import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseRFIDReaderOptions {
  onScan: (tag: string, scanType?: 'BARCODE' | 'RFID') => void;
  enabled?: boolean;
  minChars?: number;
  maxIntervalMs?: number;
  preventEnterDefault?: boolean;
  normalizeDigits?: boolean;
}

/**
 * Custom React hook for capturing USB Barcode Scanners & USB 125kHz HID RFID Card Reader inputs
 * across Windows PC/Laptop and Android USB-C (via OTG).
 *
 * Both 1D/2D USB Barcode scanners and 125kHz RFID readers emulate hardware keyboard input,
 * typing out barcodes/card UIDs rapidly followed by an 'Enter' keypress.
 */
export function useRFIDReader({
  onScan,
  enabled = true,
  minChars = 4,
  maxIntervalMs = 120, // Accommodates both ultra-fast RFID and standard USB Barcode guns
  preventEnterDefault = true,
  normalizeDigits = false
}: UseRFIDReaderOptions) {
  const [lastScannedTag, setLastScannedTag] = useState<string | null>(null);
  const [lastScanTimestamp, setLastScanTimestamp] = useState<number | null>(null);
  const [isReaderActive, setIsReaderActive] = useState<boolean>(true);

  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignore non-character modifier keys
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape'].includes(event.key)) {
      return;
    }

    const now = Date.now();
    const interval = now - lastKeyTimeRef.current;
    lastKeyTimeRef.current = now;

    // If Enter key is pressed, evaluate accumulated buffer
    if (event.key === 'Enter') {
      const tagCandidate = bufferRef.current.trim();
      bufferRef.current = '';

      if (tagCandidate.length >= minChars) {
        // High-confidence barcode or RFID hardware scan detected
        if (preventEnterDefault) {
          event.preventDefault();
          event.stopPropagation();
        }

        const isBarcode = tagCandidate.toUpperCase().includes('STU') || tagCandidate.toUpperCase().includes('CAMS') || tagCandidate.includes('-');
        const scanType: 'BARCODE' | 'RFID' = isBarcode ? 'BARCODE' : 'RFID';

        const finalTag = normalizeDigits ? tagCandidate.replace(/^0+/, '') : tagCandidate;
        setLastScannedTag(finalTag);
        setLastScanTimestamp(now);
        onScanRef.current(finalTag, scanType);
      }
      return;
    }

    // Single character keys
    if (event.key.length === 1) {
      // If time between keystrokes exceeds threshold, reset buffer (likely human typing or new scan)
      if (interval > maxIntervalMs && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      bufferRef.current += event.key;
    }
  }, [enabled, minChars, maxIntervalMs, preventEnterDefault, normalizeDigits]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    setIsReaderActive(true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [handleKeyDown]);

  /**
   * Programmatic simulation for instant hardware testing or manual override
   */
  const simulateScan = useCallback((tag: string) => {
    const clean = tag.trim();
    if (!clean) return;
    setLastScannedTag(clean);
    setLastScanTimestamp(Date.now());
    onScanRef.current(clean);
  }, []);

  return {
    lastScannedTag,
    lastScanTimestamp,
    isReaderActive,
    simulateScan
  };
}

export const useBarcodeReader = useRFIDReader;
