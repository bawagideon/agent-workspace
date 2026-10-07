// Customer Journey Black Box & Attribution Radar Engine
class CustomerJourneyBlackBox {
  stitchJourney(events) {
    const sorted = [...events].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const touchpoints = sorted.map(e => e.channel);
    const firstTouch = sorted[0] ? sorted[0].channel : 'UNKNOWN';
    const lastTouch = sorted[sorted.length - 1] ? sorted[sorted.length - 1].channel : 'UNKNOWN';

    const converted = sorted.some(e => e.action === 'CONVERTED' || e.action === 'PURCHASED');

    return {
      totalTouchpoints: sorted.length,
      firstTouchChannel: firstTouch,
      lastTouchChannel: lastTouch,
      converted,
      touchpointsSequence: touchpoints,
      journeyTimeline: sorted
    };
  }
}

module.exports = { CustomerJourneyBlackBox };
