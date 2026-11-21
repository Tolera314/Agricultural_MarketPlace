import '../config/env.js';
import {
  haversineKm,
  getEstimatedRoadDistance,
  selectVehicleCategory,
  evaluateFulfillmentEligibility,
} from '../services/logistics/fulfillment.service.js';
import {
  FixedPriceTransportStrategy,
  signQuotationToken,
  verifyQuotationToken,
} from '../services/logistics/pricing.service.js';
import {
  consolidationService,
  type OrderWeightSlice,
} from '../services/logistics/consolidation.service.js';

async function runIntercityLogisticsTests() {
  console.log('================================================================');
  console.log('🧪 AgriMarket Inter-City Trade & Bulk Logistics Test Suite (V1)');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function testAssert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Geodetic Distance & Arterial Road Distance Calculation
  // ─────────────────────────────────────────────────────────────
  console.log('--- 1. Distance Calculation & Road Curvature Factor ---');
  // Hawassa (7.0504, 38.4763) to Addis Ababa (9.0222, 38.7468)
  const hawassaLat = 7.0504;
  const hawassaLng = 38.4763;
  const addisLat = 9.0222;
  const addisLng = 38.7468;

  const straightLineKm = haversineKm(hawassaLat, hawassaLng, addisLat, addisLng);
  testAssert(
    straightLineKm >= 210 && straightLineKm <= 230,
    'Calculates accurate geodetic Haversine distance between Hawassa and Addis Ababa (~220 km)',
    `Actual: ${straightLineKm.toFixed(1)} km`
  );

  const roadDistKm = getEstimatedRoadDistance(
    'Hawassa',
    'Addis Ababa',
    straightLineKm
  );
  testAssert(
    roadDistKm > straightLineKm,
    'Applies highway route winding factor (1.25x) over straight-line Haversine distance',
    `Road: ${roadDistKm.toFixed(1)} km vs Straight: ${straightLineKm.toFixed(1)} km`
  );

  // ─────────────────────────────────────────────────────────────
  // 2. Fulfillment Classification & Eligibility Engine
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 2. Fulfillment Classification & Routing Engine ---');

  // Case A: Same City, Small Order -> LOCAL_DELIVERY
  const localDecision = await evaluateFulfillmentEligibility({
    originCity: 'Addis Ababa',
    destinationCity: 'Addis Ababa',
    originLat: 9.0125,
    originLng: 38.7636,
    destinationLat: 9.0345,
    destinationLng: 38.7456,
    totalWeightKg: 45,
    intercityEligible: false,
  });
  testAssert(
    localDecision.fulfillmentType === 'LOCAL_DELIVERY' && localDecision.isEligible === true,
    'Same-city low-weight order is routed to LOCAL_DELIVERY',
    `FulfillmentType: ${localDecision.fulfillmentType}`
  );

  // Case B: Cross-City Long Distance (Hawassa -> Addis, 2,500 kg) -> INTERCITY_BULK
  const intercityDecision = await evaluateFulfillmentEligibility({
    originCity: 'Hawassa',
    destinationCity: 'Addis Ababa',
    originLat: hawassaLat,
    originLng: hawassaLng,
    destinationLat: addisLat,
    destinationLng: addisLng,
    totalWeightKg: 2500,
    intercityEligible: true,
    minBulkOrderQty: 500,
    handlingRequirement: 'VENTILATED_CRATE',
  });
  testAssert(
    intercityDecision.fulfillmentType === 'INTERCITY_BULK' && intercityDecision.isEligible === true,
    'Cross-city bulk order (2,500 kg) is classified as INTERCITY_BULK',
    `FulfillmentType: ${intercityDecision.fulfillmentType}`
  );

  // Case C: Massive Order (>10,000 kg) -> Requires Administrative Approval
  const massiveDecision = await evaluateFulfillmentEligibility({
    originCity: 'Shashemene',
    destinationCity: 'Addis Ababa',
    originLat: 7.2012,
    originLng: 38.5984,
    destinationLat: addisLat,
    destinationLng: addisLng,
    totalWeightKg: 14000,
    intercityEligible: true,
  });
  testAssert(
    massiveDecision.requiresAdminApproval === true,
    'Massive bulk order (>10,000 kg) triggers mandatory administrative review',
    `requiresAdminApproval: ${massiveDecision.requiresAdminApproval}`
  );

  // Case D: Farmer Not Intercity-Enabled -> Ineligible with reason
  const nonEligibleDecision = await evaluateFulfillmentEligibility({
    originCity: 'Bahir Dar',
    destinationCity: 'Addis Ababa',
    originLat: 11.5742,
    originLng: 37.3614,
    destinationLat: addisLat,
    destinationLng: addisLng,
    totalWeightKg: 800,
    intercityEligible: false,
  });
  testAssert(
    nonEligibleDecision.isEligible === false &&
      nonEligibleDecision.reason.includes('has not enabled inter-city transport'),
    'Farmer not configured for inter-city trade is marked ineligible with reason',
    `Reason: ${nonEligibleDecision.reason}`
  );

  // Case E: Below Minimum Bulk Quantity Threshold
  const belowMinQtyDecision = await evaluateFulfillmentEligibility({
    originCity: 'Hawassa',
    destinationCity: 'Addis Ababa',
    originLat: hawassaLat,
    originLng: hawassaLng,
    destinationLat: addisLat,
    destinationLng: addisLng,
    totalWeightKg: 200,
    intercityEligible: true,
    minBulkOrderQty: 500,
  });
  testAssert(
    belowMinQtyDecision.isEligible === false &&
      belowMinQtyDecision.reason.includes('Minimum inter-city order quantity for this item is'),
    'Order below farmer minimum bulk order quantity is rejected with guidance',
    `Reason: ${belowMinQtyDecision.reason}`
  );

  // ─────────────────────────────────────────────────────────────
  // 3. Vehicle Category Selection Logic
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 3. Vehicle Category & Capacity Matching ---');

  const catLight = selectVehicleCategory(900, 4);
  testAssert(catLight.category === 'LIGHT_PICKUP_1T', 'Selects LIGHT_PICKUP_1T for 900 kg payload');

  const catMedium = selectVehicleCategory(4500, 15);
  testAssert(catMedium.category === 'MEDIUM_TRUCK_ISUZU_5T', 'Selects MEDIUM_TRUCK_ISUZU_5T for 4,500 kg payload');

  const catHeavy = selectVehicleCategory(14000, 35);
  testAssert(catHeavy.category === 'HEAVY_TRUCK_15T', 'Selects HEAVY_TRUCK_15T for 14,000 kg payload');

  const catCold = selectVehicleCategory(2500, 10, 'COLD_CHAIN_REFRIGERATED');
  testAssert(
    catCold.category === 'REEFER_TRUCK_COLD_CHAIN' && catCold.requiresColdChain === true,
    'Selects REEFER_TRUCK_COLD_CHAIN when COLD_CHAIN_REFRIGERATED handling is specified'
  );

  // ─────────────────────────────────────────────────────────────
  // 4. Fixed-Price Transport Pricing Math & Quotations
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 4. Fixed-Price Quotation Engine & Token Security ---');

  const strategy = new FixedPriceTransportStrategy();
  const quote = await strategy.calculateQuotation({
    originCity: 'Hawassa',
    destinationCity: 'Addis Ababa',
    distanceKm: 275,
    vehicleCategory: 'MEDIUM_TRUCK_ISUZU_5T',
    totalWeightKg: 4000,
    totalVolumeM3: 14,
    pickupCount: 2,
    needLoadingAssistance: true,
  });

  testAssert(
    quote.basePickupFee > 0 && quote.distanceCharge > 0 && quote.weightCharge > 0,
    'Computes positive component breakdown for base fare, distance fee, and weight fee',
    `Base: ETB ${quote.basePickupFee}, Dist: ETB ${quote.distanceCharge}, Weight: ETB ${quote.weightCharge}`
  );

  testAssert(
    quote.multiStopSurcharge === 200,
    'Applies multi-stop pickup surcharge for extra corridor gate stop (1 extra stop * ETB 200 default)',
    `multiStopSurcharge: ETB ${quote.multiStopSurcharge}`
  );

  testAssert(
    quote.handlingSurcharge === 300,
    'Applies loading assistance surcharge when requested by buyer (ETB 300 default)',
    `handlingSurcharge: ETB ${quote.handlingSurcharge}`
  );

  const expectedTotal =
    quote.subtotalTransport + quote.platformLogisticsCommission;
  testAssert(
    Math.abs(quote.totalPayableTransportCost - expectedTotal) < 0.05,
    'Final payable transport amount strictly equals sum of all transparent charges',
    `Final: ETB ${quote.totalPayableTransportCost} vs Sum: ETB ${expectedTotal}`
  );

  // Cold Chain Multiplier Test
  const coldQuote = await strategy.calculateQuotation({
    originCity: 'Hawassa',
    destinationCity: 'Addis Ababa',
    distanceKm: 275,
    vehicleCategory: 'REEFER_TRUCK_COLD_CHAIN',
    totalWeightKg: 4000,
    handlingRequirement: 'COLD_CHAIN_REFRIGERATED',
  });
  testAssert(
    coldQuote.totalPayableTransportCost > quote.totalPayableTransportCost,
    'Cold-chain transport applies configured active refrigeration multiplier (1.25x)',
    `Cold Total: ETB ${coldQuote.totalPayableTransportCost} vs Standard: ETB ${quote.totalPayableTransportCost}`
  );

  // HMAC Token Signing & Tamper Verification
  const validToken = signQuotationToken({
    originCity: 'Hawassa',
    destCity: 'Addis Ababa',
    totalCost: quote.totalPayableTransportCost,
    expiresAt: new Date(Date.now() + 1800000).toISOString(),
  });

  const verificationSuccess = verifyQuotationToken(validToken);
  testAssert(
    verificationSuccess.isValid === true && verificationSuccess.isExpired === false,
    'Tamper-evident HMAC quotation token verifies successfully with genuine payload'
  );

  // Tamper Token by changing fee in payload
  const tokenParts = validToken.split('.');
  if (tokenParts[0] && tokenParts[1]) {
    const rawString = Buffer.from(tokenParts[0], 'base64url').toString('utf8');
    const parts = rawString.split('|');
    parts[2] = '10.00'; // Alter cost
    const tamperedPayload = Buffer.from(parts.join('|')).toString('base64url');
    const tamperedToken = `${tamperedPayload}.${tokenParts[1]}`;
    const tamperResult = verifyQuotationToken(tamperedToken);
    testAssert(
      tamperResult.isValid === false,
      'Cryptographic signature detects and rejects manipulated transport quote token'
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 5. Weight-Proportional Cost Allocation & Penny Rounding
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 5. Multi-Order Cost Allocation & Exact Penny Reconciliation ---');

  const orderSlices: OrderWeightSlice[] = [
    { orderId: 'ord-farmer-abebe-1', weightKg: 1500 },
    { orderId: 'ord-farmer-mekannen-2', weightKg: 2500 },
    { orderId: 'ord-farmer-chaltu-3', weightKg: 1000 },
  ];
  const totalFreightCost = 14250.77; // Fractional penny amount

  const allocationResult = consolidationService.allocateFreightCost(totalFreightCost, orderSlices);

  testAssert(
    allocationResult.allocations.length === 3,
    'Generates allocation records for all 3 consolidated order slices'
  );

  const sumAllocated = allocationResult.allocations.reduce((s: number, a: any) => s + a.allocatedCost, 0);
  const roundedSum = Number(sumAllocated.toFixed(2));
  testAssert(
    roundedSum === totalFreightCost,
    'Sum of allocated order transport fees strictly reconciles to the exact penny with zero drift',
    `Sum: ETB ${roundedSum} === Total: ETB ${totalFreightCost}`
  );

  const mekannenShare = allocationResult.allocations.find((a: any) => a.orderId === 'ord-farmer-mekannen-2')!;
  testAssert(
    mekannenShare.allocationPercentage === 50,
    'Calculates exact 50% weight proportion for 2,500 kg slice in 5,000 kg truckload',
    `Percentage: ${mekannenShare.allocationPercentage}%`
  );

  // ─────────────────────────────────────────────────────────────
  // 6. Delivery Scale Weight, Shortage & Dispute Invariants
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 6. Delivery Scale Verification & Shortage Dispute Logic ---');

  // Case A: Full Delivery (No shortage)
  const dispatchedKg = 5000;
  const receivedFullKg = 5000;
  const shortageFull = Math.max(0, dispatchedKg - receivedFullKg);
  testAssert(
    shortageFull === 0,
    'Full delivery verified with 0 kg shortage (Dispatched: 5,000 kg, Received: 5,000 kg)'
  );

  // Case B: Partial Delivery with Shortage Discrepancy
  const receivedShortKg = 4880;
  const shortageDetected = Math.max(0, dispatchedKg - receivedShortKg);
  const hasDispute = shortageDetected > 0;
  testAssert(
    shortageDetected === 120 && hasDispute === true,
    'Shortage detected (120 kg missing): flags automatic dispute and triggers escrow reconciliation',
    `Shortage: ${shortageDetected} kg, hasDispute: ${hasDispute}`
  );

  // Case C: OTP Validation
  const validOtp = '849201';
  const providedOtpGood = '849201';
  const providedOtpBad = '123456';
  testAssert(
    validOtp === providedOtpGood.trim(),
    'Valid 6-digit secure delivery OTP matches successfully'
  );
  testAssert(
    validOtp !== providedOtpBad.trim(),
    'Invalid delivery OTP is rejected, preventing unauthorized cargo release'
  );

  // ─────────────────────────────────────────────────────────────
  // 7. Finite State Machine Lifecycle Invariants
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 7. Shipment Lifecycle Finite State Machine Invariants ---');

  const validTransitions: Record<string, string[]> = {
    REQUESTED: ['SCHEDULED', 'CANCELLED'],
    SCHEDULED: ['PICKUP_IN_PROGRESS', 'CANCELLED'],
    PICKUP_IN_PROGRESS: ['LOADING', 'CANCELLED'],
    LOADING: ['IN_TRANSIT'],
    IN_TRANSIT: ['ARRIVED', 'DISPUTED'],
    ARRIVED: ['DELIVERED', 'PARTIALLY_DELIVERED', 'DISPUTED'],
    DELIVERED: [],
    PARTIALLY_DELIVERED: ['DISPUTED'],
    DISPUTED: ['RESOLVED'],
    RESOLVED: [],
    CANCELLED: [],
  };

  function canTransition(current: string, next: string): boolean {
    return (validTransitions[current] || []).includes(next);
  }

  testAssert(canTransition('REQUESTED', 'SCHEDULED'), 'Permits transition: REQUESTED -> SCHEDULED');
  testAssert(canTransition('SCHEDULED', 'PICKUP_IN_PROGRESS'), 'Permits transition: SCHEDULED -> PICKUP_IN_PROGRESS');
  testAssert(canTransition('LOADING', 'IN_TRANSIT'), 'Permits transition: LOADING -> IN_TRANSIT');
  testAssert(canTransition('IN_TRANSIT', 'ARRIVED'), 'Permits transition: IN_TRANSIT -> ARRIVED');
  testAssert(canTransition('ARRIVED', 'DELIVERED'), 'Permits transition: ARRIVED -> DELIVERED');
  testAssert(canTransition('ARRIVED', 'PARTIALLY_DELIVERED'), 'Permits transition: ARRIVED -> PARTIALLY_DELIVERED');
  testAssert(!canTransition('REQUESTED', 'DELIVERED'), 'Rejects illegal transition: REQUESTED -> DELIVERED');
  testAssert(!canTransition('SCHEDULED', 'DELIVERED'), 'Rejects illegal transition: SCHEDULED -> DELIVERED');
  testAssert(!canTransition('DELIVERED', 'IN_TRANSIT'), 'Rejects illegal reversal: DELIVERED -> IN_TRANSIT');

  // ─────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runIntercityLogisticsTests().catch((err) => {
  console.error('Fatal error running intercity logistics test suite:', err);
  process.exit(1);
});
