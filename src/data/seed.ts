import type { Flight, Gate } from '@/domain/types'

// Deterministic demo dataset (PRD 13). Static data: no Math.random, no Date.now.
// Times are minutes since 00:00 (12:30 = 750). Gate windows never overlap here;
// the demo flights (AU101, DW220, AU115, LW330, NS455) are placed exactly as PRD 13.3 says.
// Invariants are checked in seed.test.ts.

export const SEED_GATES: Gate[] = [
  { id: 'A1', terminal: 'A', sizeCategory: 'WIDE', isClosed: false, closedReason: null },
  { id: 'A2', terminal: 'A', sizeCategory: 'WIDE', isClosed: false, closedReason: null },
  { id: 'A3', terminal: 'A', sizeCategory: 'NARROW', isClosed: false, closedReason: null },
  { id: 'A4', terminal: 'A', sizeCategory: 'NARROW', isClosed: false, closedReason: null },
  { id: 'A5', terminal: 'A', sizeCategory: 'NARROW', isClosed: false, closedReason: null },
  { id: 'A6', terminal: 'A', sizeCategory: 'NARROW', isClosed: false, closedReason: null },
  { id: 'B1', terminal: 'B', sizeCategory: 'NARROW', isClosed: false, closedReason: null },
  { id: 'B2', terminal: 'B', sizeCategory: 'NARROW', isClosed: false, closedReason: null },
  { id: 'B3', terminal: 'B', sizeCategory: 'NARROW', isClosed: false, closedReason: null },
  { id: 'B4', terminal: 'B', sizeCategory: 'NARROW', isClosed: false, closedReason: null },
  { id: 'B5', terminal: 'B', sizeCategory: 'NARROW', isClosed: false, closedReason: null },
  { id: 'B6', terminal: 'B', sizeCategory: 'NARROW', isClosed: true, closedReason: 'Maintenance' },
]

export const SEED_FLIGHTS: Flight[] = [
  // 06:00 AU100 DEP DEPARTED
  { id: 'F-001', flightNumber: 'AU100', airlineCode: 'AU', type: 'DEPARTURE', origin: 'AUR Aurora', destination: 'LHR London', scheduledTime: 360, estimatedTime: 360, actualTime: 360, status: 'DEPARTED', gateId: 'A1', aircraftTypeCode: 'A320', delayReason: null, cancelReason: null },
  // 06:15 DW201 ARR LANDED
  { id: 'F-002', flightNumber: 'DW201', airlineCode: 'DW', type: 'ARRIVAL', origin: 'KBP Kyiv', destination: 'AUR Aurora', scheduledTime: 375, estimatedTime: 375, actualTime: 375, status: 'LANDED', gateId: 'A2', aircraftTypeCode: 'E195', delayReason: null, cancelReason: null },
  // 06:40 NS401 DEP DEPARTED
  { id: 'F-003', flightNumber: 'NS401', airlineCode: 'NS', type: 'DEPARTURE', origin: 'AUR Aurora', destination: 'OSL Oslo', scheduledTime: 400, estimatedTime: 400, actualTime: 400, status: 'DEPARTED', gateId: 'A3', aircraftTypeCode: 'B738', delayReason: null, cancelReason: null },
  // 07:00 AU102 ARR LANDED
  { id: 'F-004', flightNumber: 'AU102', airlineCode: 'AU', type: 'ARRIVAL', origin: 'WAW Warsaw', destination: 'AUR Aurora', scheduledTime: 420, estimatedTime: 420, actualTime: 420, status: 'LANDED', gateId: 'A4', aircraftTypeCode: 'A320', delayReason: null, cancelReason: null },
  // 07:20 BX501 DEP DEPARTED
  { id: 'F-005', flightNumber: 'BX501', airlineCode: 'BX', type: 'DEPARTURE', origin: 'AUR Aurora', destination: 'RIX Riga', scheduledTime: 440, estimatedTime: 440, actualTime: 440, status: 'DEPARTED', gateId: 'A5', aircraftTypeCode: 'E195', delayReason: null, cancelReason: null },
  // 07:45 MA601 ARR LANDED
  { id: 'F-006', flightNumber: 'MA601', airlineCode: 'MA', type: 'ARRIVAL', origin: 'JFK New York', destination: 'AUR Aurora', scheduledTime: 465, estimatedTime: 465, actualTime: 465, status: 'LANDED', gateId: 'A1', aircraftTypeCode: 'B789', delayReason: null, cancelReason: null },
  // 08:00 LW301 DEP DEPARTED
  { id: 'F-007', flightNumber: 'LW301', airlineCode: 'LW', type: 'DEPARTURE', origin: 'AUR Aurora', destination: 'VNO Vilnius', scheduledTime: 480, estimatedTime: 500, actualTime: 500, status: 'DEPARTED', gateId: 'A6', aircraftTypeCode: 'A320', delayReason: 'Late inbound aircraft', cancelReason: null },
  // 08:20 NS402 ARR LANDED
  { id: 'F-008', flightNumber: 'NS402', airlineCode: 'NS', type: 'ARRIVAL', origin: 'CPH Copenhagen', destination: 'AUR Aurora', scheduledTime: 500, estimatedTime: 500, actualTime: 500, status: 'LANDED', gateId: 'B1', aircraftTypeCode: 'B738', delayReason: null, cancelReason: null },
  // 08:40 AU104 DEP DEPARTED
  { id: 'F-009', flightNumber: 'AU104', airlineCode: 'AU', type: 'DEPARTURE', origin: 'AUR Aurora', destination: 'CDG Paris', scheduledTime: 520, estimatedTime: 520, actualTime: 520, status: 'DEPARTED', gateId: 'B2', aircraftTypeCode: 'A321', delayReason: null, cancelReason: null },
  // 09:00 LW302 ARR LANDED
  { id: 'F-010', flightNumber: 'LW302', airlineCode: 'LW', type: 'ARRIVAL', origin: 'TLL Tallinn', destination: 'AUR Aurora', scheduledTime: 540, estimatedTime: 540, actualTime: 540, status: 'LANDED', gateId: 'B3', aircraftTypeCode: 'E195', delayReason: null, cancelReason: null },
  // 09:20 DW203 DEP DEPARTED
  { id: 'F-011', flightNumber: 'DW203', airlineCode: 'DW', type: 'DEPARTURE', origin: 'AUR Aurora', destination: 'KBP Kyiv', scheduledTime: 560, estimatedTime: 560, actualTime: 560, status: 'DEPARTED', gateId: 'B4', aircraftTypeCode: 'E195', delayReason: null, cancelReason: null },
  // 09:45 AU105 ARR CANCELLED
  { id: 'F-012', flightNumber: 'AU105', airlineCode: 'AU', type: 'ARRIVAL', origin: 'FRA Frankfurt', destination: 'AUR Aurora', scheduledTime: 585, estimatedTime: 585, actualTime: null, status: 'CANCELLED', gateId: null, aircraftTypeCode: 'A320', delayReason: null, cancelReason: 'Weather' },
  // 10:00 MA603 DEP DEPARTED
  { id: 'F-013', flightNumber: 'MA603', airlineCode: 'MA', type: 'DEPARTURE', origin: 'AUR Aurora', destination: 'YYZ Toronto', scheduledTime: 600, estimatedTime: 600, actualTime: 600, status: 'DEPARTED', gateId: 'A1', aircraftTypeCode: 'B789', delayReason: null, cancelReason: null },
  // 10:20 BX502 ARR LANDED
  { id: 'F-014', flightNumber: 'BX502', airlineCode: 'BX', type: 'ARRIVAL', origin: 'HEL Helsinki', destination: 'AUR Aurora', scheduledTime: 620, estimatedTime: 655, actualTime: 655, status: 'LANDED', gateId: 'B5', aircraftTypeCode: 'E195', delayReason: 'Weather', cancelReason: null },
  // 10:40 AU106 DEP DEPARTED
  { id: 'F-015', flightNumber: 'AU106', airlineCode: 'AU', type: 'DEPARTURE', origin: 'AUR Aurora', destination: 'VIE Vienna', scheduledTime: 640, estimatedTime: 640, actualTime: 640, status: 'DEPARTED', gateId: 'A2', aircraftTypeCode: 'A320', delayReason: null, cancelReason: null },
  // 11:00 DW205 ARR LANDED
  { id: 'F-016', flightNumber: 'DW205', airlineCode: 'DW', type: 'ARRIVAL', origin: 'LWO Lviv', destination: 'AUR Aurora', scheduledTime: 660, estimatedTime: 660, actualTime: 660, status: 'LANDED', gateId: 'A3', aircraftTypeCode: 'E195', delayReason: null, cancelReason: null },
  // 11:20 NS403 DEP DEPARTED
  { id: 'F-017', flightNumber: 'NS403', airlineCode: 'NS', type: 'DEPARTURE', origin: 'AUR Aurora', destination: 'ARN Stockholm', scheduledTime: 680, estimatedTime: 680, actualTime: 680, status: 'DEPARTED', gateId: 'A4', aircraftTypeCode: 'B738', delayReason: null, cancelReason: null },
  // 11:40 AU107 ARR LANDED
  { id: 'F-018', flightNumber: 'AU107', airlineCode: 'AU', type: 'ARRIVAL', origin: 'AMS Amsterdam', destination: 'AUR Aurora', scheduledTime: 700, estimatedTime: 700, actualTime: 700, status: 'LANDED', gateId: 'A6', aircraftTypeCode: 'A321', delayReason: null, cancelReason: null },
  // 12:15 BX503 DEP BOARDING
  { id: 'F-019', flightNumber: 'BX503', airlineCode: 'BX', type: 'DEPARTURE', origin: 'AUR Aurora', destination: 'RIX Riga', scheduledTime: 735, estimatedTime: 735, actualTime: null, status: 'BOARDING', gateId: 'B1', aircraftTypeCode: 'E195', delayReason: null, cancelReason: null },
  // 12:30 AU101 DEP SCHEDULED
  { id: 'F-020', flightNumber: 'AU101', airlineCode: 'AU', type: 'DEPARTURE', origin: 'AUR Aurora', destination: 'WAW Warsaw', scheduledTime: 750, estimatedTime: 750, actualTime: null, status: 'SCHEDULED', gateId: 'A3', aircraftTypeCode: 'A320', delayReason: null, cancelReason: null },
  // 12:40 DW207 DEP BOARDING
  { id: 'F-021', flightNumber: 'DW207', airlineCode: 'DW', type: 'DEPARTURE', origin: 'AUR Aurora', destination: 'KBP Kyiv', scheduledTime: 760, estimatedTime: 760, actualTime: null, status: 'BOARDING', gateId: 'B2', aircraftTypeCode: 'E195', delayReason: null, cancelReason: null },
  // 13:00 AU115 DEP SCHEDULED
  { id: 'F-022', flightNumber: 'AU115', airlineCode: 'AU', type: 'DEPARTURE', origin: 'AUR Aurora', destination: 'PRG Prague', scheduledTime: 780, estimatedTime: 780, actualTime: null, status: 'SCHEDULED', gateId: 'A4', aircraftTypeCode: 'A320', delayReason: null, cancelReason: null },
  // 13:10 LW330 DEP SCHEDULED
  { id: 'F-023', flightNumber: 'LW330', airlineCode: 'LW', type: 'DEPARTURE', origin: 'AUR Aurora', destination: 'VNO Vilnius', scheduledTime: 790, estimatedTime: 790, actualTime: null, status: 'SCHEDULED', gateId: null, aircraftTypeCode: 'A320', delayReason: null, cancelReason: null },
  // 13:20 DW220 ARR SCHEDULED
  { id: 'F-024', flightNumber: 'DW220', airlineCode: 'DW', type: 'ARRIVAL', origin: 'KBP Kyiv', destination: 'AUR Aurora', scheduledTime: 800, estimatedTime: 800, actualTime: null, status: 'SCHEDULED', gateId: 'A3', aircraftTypeCode: 'E195', delayReason: null, cancelReason: null },
  // 14:00 AU108 ARR SCHEDULED
  { id: 'F-025', flightNumber: 'AU108', airlineCode: 'AU', type: 'ARRIVAL', origin: 'FRA Frankfurt', destination: 'AUR Aurora', scheduledTime: 840, estimatedTime: 840, actualTime: null, status: 'SCHEDULED', gateId: 'B3', aircraftTypeCode: 'A320', delayReason: null, cancelReason: null },
  // 14:20 MA605 ARR DELAYED
  { id: 'F-026', flightNumber: 'MA605', airlineCode: 'MA', type: 'ARRIVAL', origin: 'JFK New York', destination: 'AUR Aurora', scheduledTime: 860, estimatedTime: 900, actualTime: null, status: 'DELAYED', gateId: 'A1', aircraftTypeCode: 'B789', delayReason: 'ATC restriction', cancelReason: null },
  // 14:40 NS455 DEP SCHEDULED
  { id: 'F-027', flightNumber: 'NS455', airlineCode: 'NS', type: 'DEPARTURE', origin: 'AUR Aurora', destination: 'OSL Oslo', scheduledTime: 880, estimatedTime: 880, actualTime: null, status: 'SCHEDULED', gateId: 'B2', aircraftTypeCode: 'B738', delayReason: null, cancelReason: null },
  // 15:00 LW304 ARR DELAYED
  { id: 'F-028', flightNumber: 'LW304', airlineCode: 'LW', type: 'ARRIVAL', origin: 'TLL Tallinn', destination: 'AUR Aurora', scheduledTime: 900, estimatedTime: 925, actualTime: null, status: 'DELAYED', gateId: 'B4', aircraftTypeCode: 'E195', delayReason: 'Late inbound aircraft', cancelReason: null },
  // 15:20 AU110 DEP SCHEDULED
  { id: 'F-029', flightNumber: 'AU110', airlineCode: 'AU', type: 'DEPARTURE', origin: 'AUR Aurora', destination: 'LHR London', scheduledTime: 920, estimatedTime: 920, actualTime: null, status: 'SCHEDULED', gateId: 'B5', aircraftTypeCode: 'A321', delayReason: null, cancelReason: null },
  // 15:45 BX504 ARR SCHEDULED
  { id: 'F-030', flightNumber: 'BX504', airlineCode: 'BX', type: 'ARRIVAL', origin: 'HEL Helsinki', destination: 'AUR Aurora', scheduledTime: 945, estimatedTime: 945, actualTime: null, status: 'SCHEDULED', gateId: 'A2', aircraftTypeCode: 'E195', delayReason: null, cancelReason: null },
  // 16:00 DW209 ARR SCHEDULED
  { id: 'F-031', flightNumber: 'DW209', airlineCode: 'DW', type: 'ARRIVAL', origin: 'LWO Lviv', destination: 'AUR Aurora', scheduledTime: 960, estimatedTime: 960, actualTime: null, status: 'SCHEDULED', gateId: 'A3', aircraftTypeCode: 'E195', delayReason: null, cancelReason: null },
  // 16:20 NS406 DEP CANCELLED
  { id: 'F-032', flightNumber: 'NS406', airlineCode: 'NS', type: 'DEPARTURE', origin: 'AUR Aurora', destination: 'CPH Copenhagen', scheduledTime: 980, estimatedTime: 980, actualTime: null, status: 'CANCELLED', gateId: null, aircraftTypeCode: 'B738', delayReason: null, cancelReason: 'Technical' },
  // 16:40 AU112 ARR DELAYED
  { id: 'F-033', flightNumber: 'AU112', airlineCode: 'AU', type: 'ARRIVAL', origin: 'CDG Paris', destination: 'AUR Aurora', scheduledTime: 1000, estimatedTime: 1055, actualTime: null, status: 'DELAYED', gateId: 'A4', aircraftTypeCode: 'A321', delayReason: 'Technical', cancelReason: null },
  // 17:00 MA607 DEP SCHEDULED
  { id: 'F-034', flightNumber: 'MA607', airlineCode: 'MA', type: 'DEPARTURE', origin: 'AUR Aurora', destination: 'YYZ Toronto', scheduledTime: 1020, estimatedTime: 1020, actualTime: null, status: 'SCHEDULED', gateId: 'A1', aircraftTypeCode: 'B789', delayReason: null, cancelReason: null },
  // 17:20 AU114 DEP SCHEDULED
  { id: 'F-035', flightNumber: 'AU114', airlineCode: 'AU', type: 'DEPARTURE', origin: 'AUR Aurora', destination: 'VIE Vienna', scheduledTime: 1040, estimatedTime: 1040, actualTime: null, status: 'SCHEDULED', gateId: 'A5', aircraftTypeCode: 'A320', delayReason: null, cancelReason: null },
  // 17:40 LW306 ARR SCHEDULED
  { id: 'F-036', flightNumber: 'LW306', airlineCode: 'LW', type: 'ARRIVAL', origin: 'VNO Vilnius', destination: 'AUR Aurora', scheduledTime: 1060, estimatedTime: 1060, actualTime: null, status: 'SCHEDULED', gateId: 'A6', aircraftTypeCode: 'A320', delayReason: null, cancelReason: null },
  // 18:00 BX505 DEP DELAYED
  { id: 'F-037', flightNumber: 'BX505', airlineCode: 'BX', type: 'DEPARTURE', origin: 'AUR Aurora', destination: 'RIX Riga', scheduledTime: 1080, estimatedTime: 1110, actualTime: null, status: 'DELAYED', gateId: 'B1', aircraftTypeCode: 'E195', delayReason: 'Crew', cancelReason: null },
  // 18:20 AU116 ARR SCHEDULED
  { id: 'F-038', flightNumber: 'AU116', airlineCode: 'AU', type: 'ARRIVAL', origin: 'AMS Amsterdam', destination: 'AUR Aurora', scheduledTime: 1100, estimatedTime: 1100, actualTime: null, status: 'SCHEDULED', gateId: 'B2', aircraftTypeCode: 'A321', delayReason: null, cancelReason: null },
  // 18:40 DW211 DEP SCHEDULED
  { id: 'F-039', flightNumber: 'DW211', airlineCode: 'DW', type: 'DEPARTURE', origin: 'AUR Aurora', destination: 'KBP Kyiv', scheduledTime: 1120, estimatedTime: 1120, actualTime: null, status: 'SCHEDULED', gateId: 'B3', aircraftTypeCode: 'E195', delayReason: null, cancelReason: null },
  // 19:00 NS407 ARR SCHEDULED
  { id: 'F-040', flightNumber: 'NS407', airlineCode: 'NS', type: 'ARRIVAL', origin: 'OSL Oslo', destination: 'AUR Aurora', scheduledTime: 1140, estimatedTime: 1140, actualTime: null, status: 'SCHEDULED', gateId: 'B4', aircraftTypeCode: 'B738', delayReason: null, cancelReason: null },
  // 19:20 AU118 DEP SCHEDULED
  { id: 'F-041', flightNumber: 'AU118', airlineCode: 'AU', type: 'DEPARTURE', origin: 'AUR Aurora', destination: 'BCN Barcelona', scheduledTime: 1160, estimatedTime: 1160, actualTime: null, status: 'SCHEDULED', gateId: 'B5', aircraftTypeCode: 'A321', delayReason: null, cancelReason: null },
  // 19:40 LW308 DEP DELAYED
  { id: 'F-042', flightNumber: 'LW308', airlineCode: 'LW', type: 'DEPARTURE', origin: 'AUR Aurora', destination: 'TLL Tallinn', scheduledTime: 1180, estimatedTime: 1240, actualTime: null, status: 'DELAYED', gateId: 'A1', aircraftTypeCode: 'E195', delayReason: 'Weather', cancelReason: null },
  // 20:00 AU120 ARR SCHEDULED
  { id: 'F-043', flightNumber: 'AU120', airlineCode: 'AU', type: 'ARRIVAL', origin: 'WAW Warsaw', destination: 'AUR Aurora', scheduledTime: 1200, estimatedTime: 1200, actualTime: null, status: 'SCHEDULED', gateId: 'A2', aircraftTypeCode: 'A320', delayReason: null, cancelReason: null },
  // 20:20 DW213 ARR SCHEDULED
  { id: 'F-044', flightNumber: 'DW213', airlineCode: 'DW', type: 'ARRIVAL', origin: 'KBP Kyiv', destination: 'AUR Aurora', scheduledTime: 1220, estimatedTime: 1220, actualTime: null, status: 'SCHEDULED', gateId: 'A3', aircraftTypeCode: 'E195', delayReason: null, cancelReason: null },
  // 20:40 BX506 ARR SCHEDULED
  { id: 'F-045', flightNumber: 'BX506', airlineCode: 'BX', type: 'ARRIVAL', origin: 'HEL Helsinki', destination: 'AUR Aurora', scheduledTime: 1240, estimatedTime: 1240, actualTime: null, status: 'SCHEDULED', gateId: 'A4', aircraftTypeCode: 'E195', delayReason: null, cancelReason: null },
  // 21:00 MA609 ARR SCHEDULED
  { id: 'F-046', flightNumber: 'MA609', airlineCode: 'MA', type: 'ARRIVAL', origin: 'JFK New York', destination: 'AUR Aurora', scheduledTime: 1260, estimatedTime: 1260, actualTime: null, status: 'SCHEDULED', gateId: 'A2', aircraftTypeCode: 'B789', delayReason: null, cancelReason: null },
  // 21:20 AU122 DEP SCHEDULED
  { id: 'F-047', flightNumber: 'AU122', airlineCode: 'AU', type: 'DEPARTURE', origin: 'AUR Aurora', destination: 'MXP Milan', scheduledTime: 1280, estimatedTime: 1280, actualTime: null, status: 'SCHEDULED', gateId: 'A5', aircraftTypeCode: 'A321', delayReason: null, cancelReason: null },
  // 21:40 NS408 ARR SCHEDULED
  { id: 'F-048', flightNumber: 'NS408', airlineCode: 'NS', type: 'ARRIVAL', origin: 'ARN Stockholm', destination: 'AUR Aurora', scheduledTime: 1300, estimatedTime: 1300, actualTime: null, status: 'SCHEDULED', gateId: 'A6', aircraftTypeCode: 'B738', delayReason: null, cancelReason: null },
]
