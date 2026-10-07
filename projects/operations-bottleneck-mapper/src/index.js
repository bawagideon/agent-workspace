// Operations Bottleneck & Cycle Time Mapper Engine
class OperationsBottleneckMapper {
  calculateCycleTimes(stages) {
    const stageMetrics = stages.map(st => {
      const { name, durationHours, standardSlaHours } = st;
      const delayHours = Math.max(0, durationHours - standardSlaHours);
      const isBottleneck = durationHours > (standardSlaHours * 1.5);

      return {
        stageName: name,
        durationHours,
        standardSlaHours,
        delayHours,
        isBottleneck,
        latencyMultiplier: Math.round((durationHours / standardSlaHours) * 10) / 10
      };
    });

    const totalActualHours = stageMetrics.reduce((sum, s) => sum + s.durationHours, 0);
    const totalStandardHours = stageMetrics.reduce((sum, s) => sum + s.standardSlaHours, 0);
    const totalExcessDelayHours = totalActualHours - totalStandardHours;

    const worstStage = [...stageMetrics].sort((a, b) => b.delayHours - a.delayHours)[0];

    return {
      totalActualHours,
      totalStandardHours,
      totalExcessDelayHours,
      primaryBottleneck: worstStage ? worstStage.stageName : 'NONE',
      worstStageDelayHours: worstStage ? worstStage.delayHours : 0,
      stageMetrics
    };
  }
}

module.exports = { OperationsBottleneckMapper };
