/**
 * BottleneckMap — visual placeholder for bottleneck detection.
 * Shows colored circles on a simple block representing parking areas.
 *
 * Props:
 *  - bottlenecks: { id: string, name: string, severity: number, status: string, x: number, y: number }[]
 *  - title: string
 */

const STATUS_COLORS = {
  active: 'bg-red-500 animate-pulse',
  mitigating: 'bg-yellow-500 animate-pulse',
  resolved: 'bg-green-400',
};

const STATUS_LABEL_COLORS = {
  active: 'bg-red-100 text-red-700',
  mitigating: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
};

export default function BottleneckMap({ bottlenecks, title }) {
  return (
    <div className="w-full">
      {title && <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>}

      {/* Map placeholder */}
      <div className="relative w-full bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg border border-slate-200 overflow-hidden" style={{ minHeight: 260 }}>
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        {/* Area labels */}
        <div className="absolute top-3 left-4 text-xs font-medium text-slate-500 bg-white/70 px-2 py-1 rounded">
          🅿️ Area A — Downtown
        </div>
        <div className="absolute top-3 right-4 text-xs font-medium text-slate-500 bg-white/70 px-2 py-1 rounded">
          🏬 Area B — Mall
        </div>
        <div className="absolute bottom-3 left-4 text-xs font-medium text-slate-500 bg-white/70 px-2 py-1 rounded">
          🏢 Area C — Office
        </div>

        {/* Bottleneck dots */}
        {bottlenecks.map((b) => (
          <div
            key={b.id}
            className="absolute group"
            style={{ left: `${b.x}%`, top: `${b.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            {/* Pulsing dot */}
            <div className={`w-5 h-5 rounded-full ${STATUS_COLORS[b.status] || 'bg-gray-400'} shadow-lg border-2 border-white`} />

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
              <div className="bg-white rounded-lg shadow-xl border border-gray-200 px-3 py-2 text-xs whitespace-nowrap">
                <p className="font-semibold text-gray-800">{b.name}</p>
                <p className="text-gray-500">Severity: {(b.severity * 100).toFixed(0)}%</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_LABEL_COLORS[b.status]}`}>
                  {b.status}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Center message */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm text-slate-400 bg-white/60 px-3 py-1 rounded-full">
            Real-time bottleneck data will appear here
          </p>
        </div>
      </div>
    </div>
  );
}
