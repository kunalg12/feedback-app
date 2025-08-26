export function calculateAttendanceWeight(attendancePercentage: number): number {
  if (attendancePercentage >= 90) return 1.0;
  if (attendancePercentage >= 75) return 0.9;
  if (attendancePercentage >= 60) return 0.7;
  if (attendancePercentage >= 40) return 0.5;
  if (attendancePercentage >= 25) return 0.3;
  return 0.1;
}

export function getAttendanceLevel(attendancePercentage: number): string {
  if (attendancePercentage >= 90) return 'full';
  if (attendancePercentage >= 75) return 'high';
  if (attendancePercentage >= 60) return 'moderate';
  if (attendancePercentage >= 40) return 'limited';
  if (attendancePercentage >= 25) return 'low';
  return 'minimal';
}

export function calculateWeightedFeedback(responses: any[]): {
  averageScore: number;
  totalResponses: number;
  weightedAverage: number;
  attendanceDistribution: any[];
} {
  if (!responses.length) return {
    averageScore: 0,
    totalResponses: 0,
    weightedAverage: 0,
    attendanceDistribution: []
  };

  let totalWeightedScore = 0;
  let totalWeight = 0;
  let totalScore = 0;
  
  const attendanceGroups = new Map();

  responses.forEach(response => {
    const weight = response.weightFactor;
    const averageScore = calculateAverageScore(response.responses);
    totalWeightedScore += averageScore * weight;
    totalWeight += weight;
    totalScore += averageScore;

    // Group by attendance ranges
    const attendanceRange = getAttendanceRange(response.studentAttendancePercentage);
    if (!attendanceGroups.has(attendanceRange)) {
      attendanceGroups.set(attendanceRange, {
        count: 0,
        totalScore: 0,
        percentage: response.studentAttendancePercentage,
        weight: weight
      });
    }
    const group = attendanceGroups.get(attendanceRange);
    group.count++;
    group.totalScore += averageScore;
  });

  const attendanceDistribution = Array.from(attendanceGroups.entries()).map(([range, data]) => ({
    range,
    count: data.count,
    avgScore: data.totalScore / data.count,
    percentage: data.percentage,
    weight: data.weight,
    level: getAttendanceLevel(data.percentage)
  }));

  return {
    averageScore: totalScore / responses.length,
    totalResponses: responses.length,
    weightedAverage: totalWeight > 0 ? totalWeightedScore / totalWeight : 0,
    attendanceDistribution
  };
}

function calculateAverageScore(responses: Record<string, any>): number {
  const scores = Object.values(responses).filter(value => typeof value === 'number');
  return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
}

function getAttendanceRange(percentage: number): string {
  if (percentage >= 90) return '90%+';
  if (percentage >= 75) return '75-89%';
  if (percentage >= 60) return '60-74%';
  if (percentage >= 40) return '40-59%';
  if (percentage >= 25) return '25-39%';
  return '<25%';
}
