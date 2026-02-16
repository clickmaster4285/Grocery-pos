"use client";

import React, { useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';

const BarcodeSVG = ({ value }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          width: 2,
          height: 50, // Slightly reduced height for better fit
          displayValue: true,
          fontSize: 12,
          margin: 5,
        });
      } catch (error) {
        console.error("Barcode generation failed", error);
      }
    }
  }, [value]);

  return <svg ref={svgRef} style={{ maxWidth: '100%' }}></svg>;
};

/**
 * BarcodePrint Component
 * 
 * This component handles the rendering of barcodes for A4 printing.
 * 
 * What is stored in the barcode?
 * - The barcode stores the value passed via the 'value' prop.
 * - In this system, it defaults to the variant's unique 'barcode' string if available.
 * - If the 'barcode' field is empty, it falls back to using the variant's 'SKU'.
 * - The format used is CODE128, which supports both numbers and letters.
 */
const BarcodePrint = React.forwardRef(({ value, count, productName }, ref) => {
  if (!value) return null;

  return (
    <div ref={ref} className="barcode-print-wrapper">
      <div className="barcode-container">
        {Array.from({ length: count || 1 }).map((_, i) => (
          <div key={i} className="barcode-card">
            <div className="barcode-header">
              <span className="product-label">{productName}</span>
            </div>
            <div className="barcode-body">
              <BarcodeSVG value={value} />
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .barcode-print-wrapper {
          width: 210mm;
          min-height: 297mm;
          background: white;
          padding: 10mm;
          margin: 0 auto;
          box-sizing: border-box;
        }
        .barcode-container {
          display: flex;
          flex-wrap: wrap;
          gap: 10mm 5mm; /* Vertical and horizontal gap */
          justify-content: flex-start;
          align-content: flex-start;
        }
        .barcode-card {
          width: 60mm; /* Fixed width to fit 3 per row on A4 (approx 190mm usable width) */
          display: flex;
          flex-direction: column;
          align-items: center;
          border: 0.5pt solid #ccc;
          padding: 2mm;
          box-sizing: border-box;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .barcode-header {
          width: 100%;
          text-align: center;
          margin-bottom: 1mm;
        }
        .product-label {
          font-size: 8pt;
          font-weight: bold;
          text-transform: uppercase;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.2;
        }
        .barcode-body {
          display: flex;
          justify-content: center;
          width: 100%;
          overflow: hidden;
        }
      `}</style>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          .barcode-print-wrapper {
            margin: 0;
            padding: 10mm;
            width: 210mm;
            height: auto;
            visibility: visible !important;
            display: block !important;
            position: static !important;
          }
          /* Hide everything else on the page during print */
          body > *:not(.barcode-print-wrapper) {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
});

BarcodePrint.displayName = 'BarcodePrint';

export default BarcodePrint;
