import { useState, useEffect } from 'react';
import OccupancyChart from '../components/analytics/OccupancyChart';
import PredictedDemandChart from '../components/analytics/PredictedDemandChart';
import CorrelationChart from '../components/analytics/CorrelationChart';
import ViolationHeatmap from '../components/analytics/ViolationHeatmap';
import BottleneckMap from '../components/analytics/BottleneckMap';
import EfficiencyStats from '../components/analytics/EfficiencyStats';

// ── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_OCCUPANCY_HOURLY = [12, 8, 5, 4, 5, 10, 35, 68, 82, 78, 72, 85, 90, 88, 75, 62, 55, 70, 88, 92, 78, 55, 30, 18];
const MOCK_OCCUPANCY_LABELS = Array.from({ length: 24 }, (_, i) => `${i}:00`);

const MOCK_OCCUPANCY_DAILY = [65, 72, 68, 80, 85, 45, 38];
const MOCK_OCCUPANCY_DAILY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MOCK_DEMAND_DATA = [
  { hour: '+1h', predicted: 72, actual: 68 },
  { hour: '+2h', predicted: 85, actual: 80 },
  { hour: '+3h', predicted: 90, actual: null },
  { hour: '+4h', predicted: 78, actual: null },
  { hour: '+5h', predicted: 65, actual: null },
  { hour: '+6h', predicted: 55, actual: null },
];

const MOCK_CORRELATION_DATA = [
  { label: 'Downtown Central', traffic: 0.82, occupancy: 0.74 },
  { label: 'Shopping Mall', traffic: 0.91, occupancy: 0.88 },
  { label: 'Office Complex', traffic: 0.68, occupancy: 0.62 },
];

const MOCK_HEATMAP_DATA = [];
const ZONE_LETTERS = ['A', 'B', 'C', 'D', 'E'];
for (let r = 0; r < 5; r++) {
  for (let c = 0; c < 5; c++) {
    MOCK_HEATMAP_DATA.push({
      zone: `${ZONE_LETTERS[r]}-${c + 1}`,
      row: r,
      col: c,
      value: Math.round((Math.random() * 9 + 0.5) * 10) / 10,
    });
  }
}

const MOCK_BOTTLENECKS = [
  { id: 'b1', name: 'Downtown Main Entrance', severity: 0.82, status: 'active', x: 25, y: 30 },
  { id: 'b2', name: 'Mall Level 2 North Wing', severity: 0.91, status: 'mitigating', x: 65, y: 25 },
  { id: 'b3', name: 'Office Tower B Exit', severity: 0.65, status: 'resolved', x: 45, y: 70 },
];

const MOCK_EFFICIENCY = [
  { label: 'Slot Utilization', value: '74%', icon: '🅿️', trend: '+3%', color: 'blue' },
  { label: 'Turnover Rate', value: '1.2/hr', icon: '🔄', trend: '+0.1', color: 'green' },
  { label: 'Peak Hour', value: '17:00', icon: '⏰', trend: '', color: 'purple' },
  { label: 'Avg Duration', value: '87 min', icon: '⏱️', trend: '-5 min', color: 'amber' },
  { label: 'Traffic Flow', value: '0.76', icon: '🚦', trend: '+0.04', color: 'teal' },
];

// ── Skeleton Loader ──────────────────────────────────────────────────────────

function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-5 animate-pulse ${className}`}>
      <div className="h-4 bg-gray-200 rounded w-40 mb-4" />
      <div className="h-48 bg-gray-200 rounded" />
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('daily'); // hourly | daily | weekly
  const [horizon, setHorizon] = useState(6);   // 1-6 hours selector

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const occupancyData = range === 'hourly'
    ? { data: MOCK_OCCUPANCY_HOURLY, labels: MOCK_OCCUPANCY_LABELS }
    : { data: MOCK_OCCUPANCY_DAILY, labels: MOCK_OCCUPANCY_DAILY_LABELS };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">
          Smart parking demand analysis and infrastructure insights
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-700">
          <span>⚡</span>
          <span>Mock data — AI model integration pending</span>
        </div>
      </div>

      {loading ? (
        /* ── Skeleton Loading ── */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonCard className="h-40" />
          <SkeletonCard />
        </div>
      ) : (
        /* ── Content ── */
        <div className="space-y-6">

          {/* Row 1: Occupancy Trends + Predicted Demand */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1 — Occupancy Trends */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Occupancy Trends</h3>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  {['hourly', 'daily', 'weekly'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                        range === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <OccupancyChart
                data={occupancyData.data}
                labels={occupancyData.labels}
                title=""
                height={220}
              />
            </div>

            {/* 2 — Predicted Demand */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Predicted Demand</h3>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  {[1, 2, 3, 4, 5, 6].map((h) => (
                    <button
                      key={h}
                      onClick={() => setHorizon(h)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                        horizon === h ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      +{h}h
                    </button>
                  ))}
                </div>
              </div>
              <PredictedDemandChart
                data={MOCK_DEMAND_DATA.slice(0, horizon)}
                title=""
              />
              <p className="text-xs text-gray-400 mt-2 text-center">
                Machine learning predictions will appear here.
              </p>
            </div>
          </div>

          {/* Row 2: Correlation + Violation Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 3 — Traffic vs Occupancy Correlation */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <CorrelationChart
                data={MOCK_CORRELATION_DATA}
                title="Traffic Volume vs Parking Occupancy"
              />
            </div>

            {/* 4 — Violation Hotspots */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <ViolationHeatmap
                data={MOCK_HEATMAP_DATA}
                rows={5}
                cols={5}
                title="Violation Hotspots"
              />
            </div>
          </div>

          {/* Row 3: Bottleneck Map */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <BottleneckMap bottlenecks={MOCK_BOTTLENECKS} title="Bottleneck Detection" />
          </div>

          {/* Row 4: System Efficiency */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <EfficiencyStats
              metrics={MOCK_EFFICIENCY}
              title="System Efficiency Summary"
            />
          </div>
        </div>
      )}
    </div>
  );
}
