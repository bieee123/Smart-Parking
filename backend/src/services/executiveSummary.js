/**
 * Executive Summary Generator — Smart Parking & Demand Management.
 *
 * Generates a complete executive summary using:
 *  - Mock data generators (occupancy, predictions, violations)
 *  - Rule-based recommendation engine
 *  - Simple statistics (trends, averages, rates)
 *
 * No ML model or real dataset required — all values are realistic mocks.
 *
 * TODO: Replace mock generators with real data queries and ML predictions
 *       when dataset and models become available.
 */

// ── Mock Data Generators ─────────────────────────────────────────────────────

/**
 * Generate realistic occupancy stats for all areas.
 */
function generateOccupancyData() {
  const now = new Date();
  const hour = now.getHours();

  // Realistic area profiles
  const areas = [
    {
      area_id: 'a1111111-1111-1111-1111-111111111111',
      area: 'Downtown Central',
      area_type: 'public',
      capacity: 250,
      baseOccupancy: hour >= 7 && hour <= 9 ? 0.72 :
                     hour >= 11 && hour <= 14 ? 0.85 :
                     hour >= 17 && hour <= 19 ? 0.88 :
                     hour >= 22 || hour < 5 ? 0.15 : 0.45,
    },
    {
      area_id: 'a2222222-2222-2222-2222-222222222222',
      area: 'Shopping Mall Garage',
      area_type: 'mall',
      capacity: 500,
      baseOccupancy: hour >= 10 && hour <= 16 ? 0.82 :
                     hour >= 17 && hour <= 20 ? 0.70 :
                     hour >= 22 || hour < 6 ? 0.08 : 0.35,
    },
    {
      area_id: 'a3333333-3333-3333-3333-333333333333',
      area: 'Office Complex',
      area_type: 'office',
      capacity: 180,
      baseOccupancy: hour >= 8 && hour <= 17 ? 0.78 :
                     hour >= 18 && hour <= 20 ? 0.40 :
                     hour >= 22 || hour < 6 ? 0.05 : 0.25,
    },
  ];

  // Add small random variation
  areas.forEach((a) => {
    const variation = (Math.random() - 0.5) * 0.06;
    a.occupancy_rate = Math.max(0, Math.min(1, a.baseOccupancy + variation));
    a.occupied_slots = Math.round(a.occupancy_rate * a.capacity);
    a.available_slots = a.capacity - a.occupied_slots;
  });

  const totalCapacity = areas.reduce((s, a) => s + a.capacity, 0);
  const totalOccupied = areas.reduce((s, a) => s + a.occupied_slots, 0);
  const overallRate = totalOccupied / totalCapacity;

  // Find highest/lowest
  const sortedByOccupancy = [...areas].sort((a, b) => b.occupancy_rate - a.occupancy_rate);
  const highestArea = sortedByOccupancy[0];
  const lowestArea = sortedByOccupancy[sortedByOccupancy.length - 1];

  return {
    timestamp: now.toISOString(),
    total_slots: totalCapacity,
    occupied_slots: totalOccupied,
    available_slots: totalCapacity - totalOccupied,
    occupancy_percentage: parseFloat((overallRate * 100).toFixed(1)),
    occupancy_rate: parseFloat(overallRate.toFixed(4)),
    areas: areas.map((a) => ({
      area_id: a.area_id,
      area: a.area,
      area_type: a.area_type,
      capacity: a.capacity,
      occupied_slots: a.occupied_slots,
      available_slots: a.available_slots,
      occupancy_rate: parseFloat(a.occupancy_rate.toFixed(4)),
      occupancy_percentage: parseFloat((a.occupancy_rate * 100).toFixed(1)),
    })),
    highest_occupancy: {
      area: highestArea.area,
      occupancy_percentage: parseFloat((highestArea.occupancy_rate * 100).toFixed(1)),
      occupied_slots: highestArea.occupied_slots,
      capacity: highestArea.capacity,
    },
    lowest_occupancy: {
      area: lowestArea.area,
      occupancy_percentage: parseFloat((lowestArea.occupancy_rate * 100).toFixed(1)),
      occupied_slots: lowestArea.occupied_slots,
      capacity: lowestArea.capacity,
    },
  };
}

/**
 * Generate realistic predicted trends (mock ML output).
 */
function generatePredictedTrends() {
  const now = new Date();
  const currentHour = now.getHours();

  // Base occupancy profile
  const baseProfile = {
    0: 0.15, 1: 0.12, 2: 0.10, 3: 0.08, 4: 0.10, 5: 0.15,
    6: 0.25, 7: 0.40, 8: 0.55, 9: 0.65,
    10: 0.75, 11: 0.82, 12: 0.88, 13: 0.90, 14: 0.92, 15: 0.88,
    16: 0.82, 17: 0.75, 18: 0.65, 19: 0.50,
    20: 0.40, 21: 0.32, 22: 0.25, 23: 0.18,
  };

  // Predict next 6 hours
  const predictions = [];
  for (let i = 1; i <= 6; i++) {
    const futureHour = (currentHour + i) % 24;
    const base = baseProfile[futureHour];
    const variation = (Math.random() - 0.5) * 0.04;
    const rate = Math.max(0, Math.min(1, base + variation));

    predictions.push({
      hour: futureHour,
      time_label: `${String(futureHour).padStart(2, '0')}:00`,
      predicted_occupancy_rate: parseFloat(rate.toFixed(4)),
      predicted_occupancy_percentage: parseFloat((rate * 100).toFixed(1)),
      confidence: parseFloat((0.72 + Math.random() * 0.18).toFixed(2)),
    });
  }

  // Determine trend
  const currentRate = baseProfile[currentHour] || 0.5;
  const futureAvg = predictions.reduce((s, p) => s + p.predicted_occupancy_rate, 0) / predictions.length;
  const trendDiff = futureAvg - currentRate;

  let trend_label;
  if (trendDiff > 0.05) trend_label = 'increasing';
  else if (trendDiff < -0.05) trend_label = 'decreasing';
  else trend_label = 'stable';

  // Predict peak hour (next 12 hours)
  let peakHour = currentHour;
  let peakRate = 0;
  for (let i = 0; i < 12; i++) {
    const h = (currentHour + i) % 24;
    if (baseProfile[h] > peakRate) {
      peakRate = baseProfile[h];
      peakHour = h;
    }
  }
  const hoursToPeak = (peakHour - currentHour + 24) % 24;

  // Bottleneck risk prediction
  const maxPredictedRate = Math.max(...predictions.map((p) => p.predicted_occupancy_rate));
  let bottleneck_risk_level;
  if (maxPredictedRate >= 0.90) bottleneck_risk_level = 'high';
  else if (maxPredictedRate >= 0.75) bottleneck_risk_level = 'medium';
  else bottleneck_risk_level = 'low';

  return {
    generated_at: now.toISOString(),
    model_type: 'rule-based-mock',
    model_version: '0.1.0',
    current_hour: currentHour,
    trend_label,
    trend_direction: trendDiff >= 0 ? 'up' : 'down',
    trend_magnitude: parseFloat(Math.abs(trendDiff * 100).toFixed(1)),
    expected_peak_hour: peakHour,
    expected_peak_time: `${String(peakHour).padStart(2, '0')}:00`,
    hours_to_peak: hoursToPeak === 0 ? 'now' : `${hoursToPeak}h`,
    predicted_next_6_hours: predictions,
    bottleneck_risk_level,
    bottleneck_risk_score: parseFloat(maxPredictedRate.toFixed(4)),
    confidence_overall: parseFloat((0.68 + Math.random() * 0.2).toFixed(2)),
  };
}

/**
 * Generate realistic violation summary.
 */
function generateViolationSummary() {
  const now = new Date();
  const hour = now.getHours();

  // More violations during peak hours
  const baseCount = hour >= 7 && hour <= 19 ? 12 : 4;
  const totalToday = baseCount + Math.round(Math.random() * 8);

  const illegalParking = Math.round(totalToday * (0.25 + Math.random() * 0.1));
  const blocking = Math.round(totalToday * (0.15 + Math.random() * 0.08));
  const improperParking = Math.round(totalToday * (0.20 + Math.random() * 0.1));
  const overtime = Math.round(totalToday * (0.15 + Math.random() * 0.1));
  const other = totalToday - illegalParking - blocking - improperParking - overtime;

  const breakdown = {
    illegal_parking: illegalParking,
    blocking: blocking,
    improper_parking: improperParking,
    overtime: Math.max(0, overtime),
    other: Math.max(0, other),
  };

  // Top 3 hotspots (mock zones)
  const hotspots = [
    {
      zone: 'Zone-A',
      area: 'Downtown Central',
      violations: Math.round(totalToday * 0.35),
      primary_type: illegalParking > blocking ? 'illegal_parking' : 'blocking',
      severity: totalToday > 15 ? 'high' : 'medium',
    },
    {
      zone: 'Zone-B',
      area: 'Shopping Mall Garage',
      violations: Math.round(totalToday * 0.28),
      primary_type: 'improper_parking',
      severity: 'medium',
    },
    {
      zone: 'Zone-C',
      area: 'Office Complex',
      violations: Math.round(totalToday * 0.18),
      primary_type: 'overtime',
      severity: 'low',
    },
  ].sort((a, b) => b.violations - a.violations).slice(0, 3);

  // Yesterday comparison (fake trend)
  const yesterdayTotal = totalToday + Math.round((Math.random() - 0.5) * 6);
  const changePercent = yesterdayTotal > 0
    ? parseFloat(((totalToday - yesterdayTotal) / yesterdayTotal * 100).toFixed(1))
    : 0;
  const trend_direction = changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'stable';

  return {
    generated_at: now.toISOString(),
    total_violations_today: totalToday,
    breakdown,
    top_hotspots: hotspots,
    trend: {
      direction: trend_direction,
      change_percent: changePercent,
      comparison: `vs yesterday (${yesterdayTotal} violations)`,
    },
    resolution_rate: parseFloat((0.60 + Math.random() * 0.25).toFixed(2)),
    avg_resolution_time_minutes: Math.round(15 + Math.random() * 30),
  };
}

// ── Rule-Based Recommendation Engine ─────────────────────────────────────────

/**
 * Generate automatic recommendations based on occupancy, predictions, and violations.
 * 100% rule-based — no ML required.
 */
function generateRecommendations(occupancy, predictions, violations) {
  const recommendations = [];

  // ── Occupancy Rules ──────────────────────────────────────────────────────

  // Rule: Area at or near full capacity
  const fullAreas = occupancy.areas.filter((a) => a.occupancy_rate >= 0.95);
  if (fullAreas.length > 0) {
    const names = fullAreas.map((a) => a.area).join(', ');
    const alternatives = occupancy.areas
      .filter((a) => a.occupancy_rate < 0.60)
      .map((a) => a.area);

    recommendations.push({
      priority: 'critical',
      category: 'overflow',
      action: `Redirect drivers away from ${names}. ${
        alternatives.length > 0
          ? `Available alternatives: ${alternatives.join(', ')}.`
          : 'All areas near capacity — activate remote parking protocol.'
      }`,
      reason: `${fullAreas.length} area(s) at ≥95% occupancy`,
    });
  }

  // Rule: High occupancy approaching capacity
  const highAreas = occupancy.areas.filter(
    (a) => a.occupancy_rate >= 0.85 && a.occupancy_rate < 0.95
  );
  if (highAreas.length > 0) {
    const names = highAreas.map((a) => a.area).join(', ');
    recommendations.push({
      priority: 'high',
      category: 'congestion_risk',
      action: `Prepare overflow parking for ${names}. Update digital signage to redirect incoming traffic.`,
      reason: `${highAreas.length} area(s) at ≥85% occupancy — approaching critical level`,
    });
  }

  // Rule: Underutilized area — suggest load shifting
  const underutilized = occupancy.areas.filter((a) => a.occupancy_rate < 0.40);
  if (underutilized.length > 0) {
    const names = underutilized.map((a) => a.area).join(', ');
    recommendations.push({
      priority: 'medium',
      category: 'optimization',
      action: `Consider dynamic pricing discounts for ${names} to attract demand from busier areas.`,
      reason: `${underutilized.length} area(s) below 40% occupancy`,
    });
  }

  // ── Prediction Rules ─────────────────────────────────────────────────────

  // Rule: Peak hour within 2 hours
  if (predictions.hours_to_peak !== 'now') {
    const hoursNum = parseInt(predictions.hours_to_peak);
    if (hoursNum <= 2 && predictions.bottleneck_risk_level !== 'low') {
      recommendations.push({
        priority: 'high',
        category: 'peak_preparation',
        action: `Predicted peak at ${predictions.expected_peak_time} (${hoursNum}h away). Prepare overflow parking zone and increase staff readiness.`,
        reason: `Peak occupancy predicted within ${hoursNum} hours with ${predictions.bottleneck_risk_level} bottleneck risk`,
      });
    }
  }

  // Rule: Increasing trend with high bottleneck risk
  if (predictions.trend_label === 'increasing' && predictions.bottleneck_risk_level === 'high') {
    recommendations.push({
      priority: 'critical',
      category: 'congestion_mitigation',
      action: 'Activate congestion mitigation workflow. Deploy traffic officers to high-risk zones. Enable real-time overflow alerts.',
      reason: `Increasing demand trend with HIGH bottleneck risk (${predictions.bottleneck_risk_score})`,
    });
  }

  // Rule: Decreasing trend — opportunity for maintenance
  if (predictions.trend_label === 'decreasing') {
    recommendations.push({
      priority: 'low',
      category: 'maintenance_window',
      action: 'Demand decreasing — good window for scheduled maintenance of sensors, cameras, and payment systems.',
      reason: `Decreasing demand trend (${predictions.trend_magnitude}% projected drop)`,
    });
  }

  // ── Violation Rules ──────────────────────────────────────────────────────

  // Rule: Rising violations
  if (violations.trend.direction === 'up' && violations.total_violations_today > 10) {
    recommendations.push({
      priority: 'high',
      category: 'enforcement',
      action: `Increase patrol frequency. ${violations.total_violations_today} violations today (${violations.trend.change_percent}% vs yesterday). Focus on ${violations.top_hotspots[0]?.zone || 'high-risk zones'}.`,
      reason: `Violation count rising — ${violations.total_violations_today} incidents today`,
    });
  }

  // Rule: Specific violation type spikes
  if (violations.breakdown.blocking >= 3) {
    recommendations.push({
      priority: 'critical',
      category: 'safety',
      action: `Dispatch officers to clear blocking incidents immediately. ${violations.breakdown.blocking} blocking events detected — fire lane access may be compromised.`,
      reason: `${violations.breakdown.blocking} blocking incidents — safety risk`,
    });
  }

  if (violations.breakdown.illegal_parking >= 5) {
    recommendations.push({
      priority: 'high',
      category: 'enforcement',
      action: `Deploy mobile patrol for illegal parking enforcement. ${violations.breakdown.illegal_parking} incidents detected today.`,
      reason: `${violations.breakdown.illegal_parking} illegal parking incidents`,
    });
  }

  // Rule: Hotspot concentration
  if (violations.top_hotspots.length > 0) {
    const topSpot = violations.top_hotspots[0];
    if (topSpot.severity === 'high') {
      recommendations.push({
        priority: 'high',
        category: 'hotspot_intervention',
        action: `Focused intervention needed at ${topSpot.zone} (${topSpot.area}). Primary issue: ${topSpot.primary_type.replace(/_/g, ' ')}. ${topSpot.violations} violations recorded.`,
        reason: `High-severity hotspot: ${topSpot.zone} with ${topSpot.violations} violations`,
      });
    }
  }

  // Ensure at least one recommendation
  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'low',
      category: 'monitoring',
      action: 'System operating within normal parameters. Continue routine monitoring.',
      reason: 'All metrics within acceptable ranges',
    });
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return recommendations.sort(
    (a, b) => (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4)
  );
}

// ── Master Summary Generator ─────────────────────────────────────────────────

/**
 * Generate the complete executive summary.
 * Combines occupancy, predictions, violations, and recommendations.
 *
 * @returns {Object} Complete executive summary
 */
function generateExecutiveSummary() {
  try {
    const occupancy = generateOccupancyData();
    const predictions = generatePredictedTrends();
    const violations = generateViolationSummary();
    const recommendations = generateRecommendations(occupancy, predictions, violations);

    // Overall system health score (0-100)
    const occupancyScore = Math.max(0, 100 - occupancy.occupancy_percentage);
    const violationScore = Math.max(0, 100 - violations.total_violations_today * 3);
    const predictionScore =
      predictions.bottleneck_risk_level === 'low' ? 90 :
      predictions.bottleneck_risk_level === 'medium' ? 60 : 30;

    const health_score = parseFloat(
      (occupancyScore * 0.4 + violationScore * 0.3 + predictionScore * 0.3).toFixed(1)
    );

    let system_status;
    if (health_score >= 70) system_status = 'healthy';
    else if (health_score >= 50) system_status = 'moderate';
    else if (health_score >= 30) system_status = 'warning';
    else system_status = 'critical';

    return {
      success: true,
      generated_at: new Date().toISOString(),
      system_status,
      health_score,
      data: {
        occupancy,
        predictions,
        violations,
        recommendations,
      },
      metadata: {
        data_source: 'mock-rule-based',
        ml_model_connected: false,
        ml_predictions_available: false,
        rule_engine_version: '0.1.0',
        note: 'All values generated from mock data and rule-based logic. Connect real data sources and ML models for production accuracy.',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to generate summary',
      details: error.message,
      generated_at: new Date().toISOString(),
    };
  }
}

// ── Exports ──────────────────────────────────────────────────────────────────

export {
  generateExecutiveSummary,
  generateOccupancyData,
  generatePredictedTrends,
  generateViolationSummary,
  generateRecommendations,
};
