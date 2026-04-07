import { asyncHandler } from '../utils/asyncHandler.js';
import { getSlotEfficiency } from '../services/slotEfficiency.js';
import { generateExecutiveSummary } from '../services/executiveSummary.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a random float between min and max, rounded to `decimals` places */
function rand(min, max, decimals = 2) {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

/** Generate an ISO timestamp offset by `hours` from now */
function ts(hoursAgo = 0) {
  const d = new Date(Date.now() - hoursAgo * 3600_000);
  return d.toISOString();
}

/** Pick a random element from an array */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const AREA_IDS = [
  'a1111111-1111-1111-1111-111111111111',
  'a2222222-2222-2222-2222-222222222222',
  'a3333333-3333-3333-3333-333333333333',
];

const AREA_NAMES = {
  'a1111111-1111-1111-1111-111111111111': 'Downtown Central Parking',
  'a2222222-2222-2222-2222-222222222222': 'Shopping Mall Garage',
  'a3333333-3333-3333-3333-333333333333': 'Office Complex Zone',
};

const VIOLATION_TYPES = [
  'illegal_parking',
  'blocking',
  'improper_parking',
  'overtime',
  'disabled_abuse',
];

// ── GET /analytics/occupancy/trends ──────────────────────────────────────────

/**
 * Returns time-series parking occupancy trends per area or slot.
 *
 * Query params:
 *  - range : 1d | 7d | 30d  (default: 7d)
 *  - areaId: UUID string    (optional — filter single area)
 *  - slotId: UUID string    (optional — filter single slot)
 */
export const getOccupancyTrends = asyncHandler(async (req, res) => {
  const { range = '7d', areaId, slotId } = req.query;

  // Map range to number of data points
  const pointMap = { '1d': 24, '7d': 168, '30d': 720 };
  const points = pointMap[range] || pointMap['7d'];
  const intervalHours = range === '1d' ? 1 : range === '7d' ? 1 : 4;

  // Decide which areas to include
  const areas = areaId ? [areaId] : AREA_IDS;

  const trends = areas.map((aid) => {
    const dataPoints = Array.from({ length: points }, (_, i) => {
      const hourOffset = (points - i) * intervalHours;
      // Simulate realistic curve: higher during daytime
      const hourOfDay = (24 - (hourOffset % 24)) % 24;
      const baseRate =
        hourOfDay >= 7 && hourOfDay <= 9 ? rand(0.65, 0.85) :
        hourOfDay >= 11 && hourOfDay <= 14 ? rand(0.70, 0.92) :
        hourOfDay >= 17 && hourOfDay <= 19 ? rand(0.75, 0.95) :
        rand(0.10, 0.45);

      return {
        timestamp: ts(hourOffset),
        occupancyRate: parseFloat(baseRate.toFixed(4)),
        occupiedSlots: Math.round(baseRate * 200),
        totalSlots: 200,
      };
    });

    return {
      areaId: aid,
      areaName: AREA_NAMES[aid] || 'Unknown Area',
      granularity: `${intervalHours}h`,
      dataPoints,
    };
  });

  res.json({
    success: true,
    data: {
      range,
      unit: 'rate (0-1)',
      trends,
    },
    generatedAt: new Date().toISOString(),
  });
});

// ── GET /analytics/traffic/correlation ───────────────────────────────────────

/**
 * Returns correlation analysis between traffic volume and parking demand.
 *
 * Query params:
 *  - range : 7d | 30d  (default: 7d)
 */
export const getTrafficCorrelation = asyncHandler(async (req, res) => {
  const { range = '7d' } = req.query;

  const days = range === '30d' ? 30 : 7;

  const correlations = AREA_IDS.map((aid) => {
    // Pearson-like mock correlation (0.6 – 0.95 is realistic)
    const correlationScore = rand(0.60, 0.95, 4);

    const dailySamples = Array.from({ length: days }, (_, i) => ({
      date: ts((days - i) * 24).split('T')[0],
      trafficVolume: Math.round(rand(800, 3500)),
      parkingDemand: Math.round(rand(400, 2200)),
      occupancyRate: rand(0.40, 0.92, 4),
    }));

    return {
      areaId: aid,
      areaName: AREA_NAMES[aid] || 'Unknown Area',
      correlationScore,
      sampleSize: days,
      dailySamples,
    };
  });

  res.json({
    success: true,
    data: {
      range,
      metric: 'Pearson correlation (traffic volume ↔ parking demand)',
      correlations,
    },
    generatedAt: new Date().toISOString(),
  });
});

// ── GET /analytics/violation/hotspots ────────────────────────────────────────

/**
 * Returns the top zones with illegal parking or violations.
 *
 * Query params:
 *  - limit : number  (default: 10)
 */
export const getViolationHotspots = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const limitNum = Math.min(parseInt(limit) || 10, 50);

  const zones = [
    'Zone-A', 'Zone-B', 'Zone-C', 'Zone-D',
    'Zone-E', 'Zone-F', 'Zone-G', 'Zone-H',
  ];

  const hotspots = zones.slice(0, limitNum).map((zone) => {
    const violationType = pick(VIOLATION_TYPES);
    const totalViolations = Math.round(rand(15, 280));
    const severity = totalViolations > 200 ? 'high' : totalViolations > 80 ? 'medium' : 'low';

    return {
      zone,
      areaId: pick(AREA_IDS),
      areaName: pick(Object.values(AREA_NAMES)),
      violationType,
      totalViolations,
      severity,
      severityScore: severity === 'high' ? rand(0.70, 0.95, 2) :
                      severity === 'medium' ? rand(0.40, 0.69, 2) :
                      rand(0.10, 0.39, 2),
      recentViolations: Array.from({ length: 3 }, () => ({
        timestamp: ts(rand(0, 72)),
        type: pick(VIOLATION_TYPES),
        status: pick(['pending', 'issued', 'resolved']),
      })),
    };
  });

  // Sort by severityScore descending
  hotspots.sort((a, b) => b.severityScore - a.severityScore);

  res.json({
    success: true,
    data: {
      limit: limitNum,
      unit: 'severity score (0-1)',
      hotspots,
    },
    generatedAt: new Date().toISOString(),
  });
});

// ── GET /analytics/bottlenecks ───────────────────────────────────────────────

/**
 * Returns predicted or known bottleneck areas (static / mock for now).
 */
export const getBottlenecks = asyncHandler(async (req, res) => {
  const bottlenecks = [
    {
      bottleneckId: 'b1111111-1111-1111-1111-111111111111',
      areaId: AREA_IDS[0],
      areaName: AREA_NAMES[AREA_IDS[0]],
      locationName: 'Downtown Main Entrance',
      latitude: -6.209,
      longitude: 106.846,
      bottleneckType: 'entry_queue',
      severityScore: 0.82,
      congestionLevel: 'high',
      affectedSlots: 15,
      affectedCapacity: 15,
      currentOccupancy: 14,
      occupancyRate: 0.9333,
      avgWaitTimeMin: 12.5,
      contributingFactors: { event: 'rush_hour', weather: 'clear' },
      resolutionStatus: 'active',
      detectedAt: ts(2),
      predictedDuration: '45 min',
    },
    {
      bottleneckId: 'b2222222-2222-2222-2222-222222222222',
      areaId: AREA_IDS[1],
      areaName: AREA_NAMES[AREA_IDS[1]],
      locationName: 'Mall Level 2 North Wing',
      latitude: -6.2299,
      longitude: 106.829,
      bottleneckType: 'overload',
      severityScore: 0.91,
      congestionLevel: 'critical',
      affectedSlots: 45,
      affectedCapacity: 45,
      currentOccupancy: 44,
      occupancyRate: 0.9778,
      avgWaitTimeMin: 18.3,
      contributingFactors: { event: 'weekend_shopping', promotion: 'sale' },
      resolutionStatus: 'mitigating',
      detectedAt: ts(3),
      predictedDuration: '90 min',
    },
    {
      bottleneckId: 'b3333333-3333-3333-3333-333333333333',
      areaId: AREA_IDS[2],
      areaName: AREA_NAMES[AREA_IDS[2]],
      locationName: 'Office Tower B Exit',
      latitude: -6.2188,
      longitude: 106.803,
      bottleneckType: 'exit_block',
      severityScore: 0.65,
      congestionLevel: 'medium',
      affectedSlots: 8,
      affectedCapacity: 8,
      currentOccupancy: 6,
      occupancyRate: 0.75,
      avgWaitTimeMin: 5.2,
      contributingFactors: { event: 'shift_change' },
      resolutionStatus: 'resolved',
      detectedAt: ts(5),
      predictedDuration: '35 min',
    },
  ];

  res.json({
    success: true,
    data: {
      total: bottlenecks.length,
      activeCount: bottlenecks.filter((b) => b.resolutionStatus === 'active').length,
      unit: 'severity score (0-1)',
      bottlenecks,
    },
    generatedAt: new Date().toISOString(),
  });
});

// ── GET /analytics/efficiency ────────────────────────────────────────────────

/**
 * Returns current system efficiency analysis:
 *  - slot usage efficiency
 *  - peak vs off-peak patterns
 *  - average turnover rate
 */
export const getEfficiency = asyncHandler(async (req, res) => {
  const areaEfficiency = AREA_IDS.map((aid) => {
    const peakOccupancy = rand(0.75, 0.95, 4);
    const offPeakOccupancy = rand(0.15, 0.45, 4);
    const turnoverRate = rand(0.3, 1.8, 2); // sessions per hour
    const efficiencyScore = rand(0.55, 0.92, 4);

    return {
      areaId: aid,
      areaName: AREA_NAMES[aid] || 'Unknown Area',
      slotUsageEfficiency: {
        totalSlots: Math.round(rand(150, 500)),
        activeSlots: Math.round(rand(120, 480)),
        maintenanceSlots: Math.round(rand(5, 30)),
        overallOccupancyRate: rand(0.50, 0.88, 4),
        turnoverRate,
      },
      peakVsOffPeak: {
        peakHours: '07:00-09:00, 12:00-14:00, 17:00-19:00',
        peakOccupancyRate: peakOccupancy,
        offPeakOccupancyRate: offPeakOccupancy,
        peakOffPeakRatio: parseFloat((peakOccupancy / offPeakOccupancy).toFixed(2)),
      },
      efficiencyScore,
      avgSessionDurationMin: Math.round(rand(45, 180)),
      revenuePerSlotPerHour: rand(3000, 12000, 0),
    };
  });

  // Overall system score (weighted average mock)
  const overallScore = parseFloat(
    (areaEfficiency.reduce((sum, a) => sum + a.efficiencyScore, 0) / areaEfficiency.length).toFixed(4)
  );

  res.json({
    success: true,
    data: {
      overallEfficiencyScore: overallScore,
      unit: 'score (0-1)',
      areas: areaEfficiency,
    },
    generatedAt: new Date().toISOString(),
  });
});

// ── GET /analytics/efficiency/slots ──────────────────────────────────────────

/**
 * Returns rule-based slot efficiency metrics calculated from live PostgreSQL data.
 * Includes: occupancy %, available slots, avg duration, turnover rate, utilization score.
 *
 * No query params required — computes from all slots & logs.
 */
export const getSlotEfficiencyController = asyncHandler(async (req, res) => {
  const result = await getSlotEfficiency();

  res.json({
    success: true,
    data: {
      occupancyPercentage: result.occupancyPercentage,
      availableSlots: result.availableSlots,
      totalSlots: result.totalSlots,
      occupiedSlots: result.occupiedSlots,
      averageDurationMinutes: result.averageDurationMinutes,
      turnoverRate: result.turnoverRate,
      utilizationScore: result.utilizationScore,
    },
    generatedAt: result.timestamp,
  });
});

// ── GET /analytics/executive-summary ─────────────────────────────────────────

/**
 * Returns a complete automated executive summary.
 * Includes occupancy stats, predicted trends, violation summary, and recommendations.
 * All data is mock/rule-based — ready for ML integration later.
 */
export const getExecutiveSummary = asyncHandler(async (_req, res) => {
  const summary = generateExecutiveSummary();

  if (!summary.success) {
    return res.status(500).json({
      success: false,
      error: 'Failed to generate summary',
      details: summary.details || null,
      generated_at: summary.generated_at,
    });
  }

  res.json(summary);
});
