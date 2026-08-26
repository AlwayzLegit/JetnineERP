'use client';

/**
 * The strip above every print view: back link + the Print button.
 * Hidden on paper via the inline @media print rule.
 */
export function PrintToolbar({
  backHref,
  onPrint,
  label,
  note,
}: {
  backHref: string;
  onPrint: () => void | Promise<void>;
  label: string;
  note?: string;
}) {
  return (
    <div
      className="print-toolbar"
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        padding: '10px 16px',
        borderBottom: '1px solid #ddd',
        background: '#f6f6f6',
        color: '#000',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: 13,
      }}
    >
      <style>{`@media print { .print-toolbar { display: none !important; } }`}</style>
      <a href={backHref} style={{ color: '#000' }}>
        ← Back
      </a>
      <button
        type="button"
        data-testid="print-button"
        onClick={() => void onPrint()}
        style={{
          padding: '6px 14px',
          border: '1px solid #000',
          background: '#fff',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        {label}
      </button>
      {note && <span style={{ color: '#555' }}>{note}</span>}
    </div>
  );
}
