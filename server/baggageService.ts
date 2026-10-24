import type { CabinClass } from './types.ts';

export interface BaggageAllowance {
  cabinClass: CabinClass;
  airline: string;
  routeType: 'domestic' | 'international';
  cabinAllowanceText: string;
  checkedAllowanceText: string;
  cabinMaxWeightKg: number;
  cabinMaxPieces: number;
  checkedMaxWeightKg: number;
  checkedMaxPieces: number;
  personalItemIncluded: boolean;
}

export interface AdditionalBaggageOption {
  id: string;
  title: string;
  description: string;
  weightLimitKg: number;
  priceUSD: number;
  maxSelectablePerPax: number;
}

// Industry-standard baseline baggage policies by cabin class and route
export const DEFAULT_BAGGAGE_POLICIES: BaggageAllowance[] = [
  // Domestic
  {
    cabinClass: 'economy',
    airline: 'ALL',
    routeType: 'domestic',
    cabinAllowanceText: '1 Cabin Bag (7 kg) + 1 Personal Item',
    checkedAllowanceText: '15 kg (1 Piece) Included',
    cabinMaxWeightKg: 7,
    cabinMaxPieces: 1,
    checkedMaxWeightKg: 15,
    checkedMaxPieces: 1,
    personalItemIncluded: true,
  },
  {
    cabinClass: 'premiumEconomy',
    airline: 'ALL',
    routeType: 'domestic',
    cabinAllowanceText: '1 Cabin Bag (10 kg) + 1 Personal Item',
    checkedAllowanceText: '25 kg (1 Piece) Included',
    cabinMaxWeightKg: 10,
    cabinMaxPieces: 1,
    checkedMaxWeightKg: 25,
    checkedMaxPieces: 1,
    personalItemIncluded: true,
  },
  {
    cabinClass: 'business',
    airline: 'ALL',
    routeType: 'domestic',
    cabinAllowanceText: '2 Cabin Bags (14 kg total) + 1 Personal Item',
    checkedAllowanceText: '35 kg (2 Pieces) Included',
    cabinMaxWeightKg: 14,
    cabinMaxPieces: 2,
    checkedMaxWeightKg: 35,
    checkedMaxPieces: 2,
    personalItemIncluded: true,
  },
  {
    cabinClass: 'first',
    airline: 'ALL',
    routeType: 'domestic',
    cabinAllowanceText: '2 Cabin Bags (18 kg total) + 1 Personal Item',
    checkedAllowanceText: '40 kg (2 Pieces) Included',
    cabinMaxWeightKg: 18,
    cabinMaxPieces: 2,
    checkedMaxWeightKg: 40,
    checkedMaxPieces: 2,
    personalItemIncluded: true,
  },
  // International
  {
    cabinClass: 'economy',
    airline: 'ALL',
    routeType: 'international',
    cabinAllowanceText: '1 Cabin Bag (7 kg) + 1 Personal Item',
    checkedAllowanceText: '23 kg (1 Piece) Included',
    cabinMaxWeightKg: 7,
    cabinMaxPieces: 1,
    checkedMaxWeightKg: 23,
    checkedMaxPieces: 1,
    personalItemIncluded: true,
  },
  {
    cabinClass: 'premiumEconomy',
    airline: 'ALL',
    routeType: 'international',
    cabinAllowanceText: '1 Cabin Bag (10 kg) + 1 Personal Item',
    checkedAllowanceText: '2 Pieces (23 kg each, 46 kg total) Included',
    cabinMaxWeightKg: 10,
    cabinMaxPieces: 1,
    checkedMaxWeightKg: 46,
    checkedMaxPieces: 2,
    personalItemIncluded: true,
  },
  {
    cabinClass: 'business',
    airline: 'ALL',
    routeType: 'international',
    cabinAllowanceText: '2 Cabin Bags (14 kg total) + 1 Personal Item',
    checkedAllowanceText: '2 Pieces (32 kg each, 64 kg total) Included',
    cabinMaxWeightKg: 14,
    cabinMaxPieces: 2,
    checkedMaxWeightKg: 64,
    checkedMaxPieces: 2,
    personalItemIncluded: true,
  },
  {
    cabinClass: 'first',
    airline: 'ALL',
    routeType: 'international',
    cabinAllowanceText: '2 Cabin Bags (18 kg total) + 1 Personal Item',
    checkedAllowanceText: '3 Pieces (32 kg each, 96 kg total) Included',
    cabinMaxWeightKg: 18,
    cabinMaxPieces: 2,
    checkedMaxWeightKg: 96,
    checkedMaxPieces: 3,
    personalItemIncluded: true,
  },
];

// Additional baggage options available during booking
export const ADDITIONAL_BAGGAGE_OPTIONS: AdditionalBaggageOption[] = [
  {
    id: 'bag_extra_15kg',
    title: 'Additional Checked Bag (up to 15 kg)',
    description: '1 extra checked baggage piece suitable for regional or domestic connections.',
    weightLimitKg: 15,
    priceUSD: 35,
    maxSelectablePerPax: 2,
  },
  {
    id: 'bag_extra_23kg',
    title: 'Standard International Extra Bag (up to 23 kg)',
    description: '1 full-size international standard checked bag piece up to 23 kg / 50 lbs.',
    weightLimitKg: 23,
    priceUSD: 50,
    maxSelectablePerPax: 2,
  },
  {
    id: 'bag_extra_32kg',
    title: 'Heavy Weight Bag Upgrade (up to 32 kg)',
    description: 'Heavy baggage piece allowance up to maximum airport safety limit of 32 kg.',
    weightLimitKg: 32,
    priceUSD: 75,
    maxSelectablePerPax: 1,
  },
  {
    id: 'bag_sports_gear',
    title: 'Specialty Sporting Equipment / Musical Gear',
    description: 'Special handling for skis, golf bag, bicycle, surfboard, or musical instruments.',
    weightLimitKg: 25,
    priceUSD: 45,
    maxSelectablePerPax: 1,
  },
];

let activePolicies: BaggageAllowance[] = [...DEFAULT_BAGGAGE_POLICIES];
let activeOptions: AdditionalBaggageOption[] = [...ADDITIONAL_BAGGAGE_OPTIONS];

export function getBaggageAllowance(
  cabinClass: CabinClass,
  airline: string,
  isInternational: boolean
): BaggageAllowance {
  const routeType = isInternational ? 'international' : 'domestic';
  const found = activePolicies.find(
    (p) =>
      p.cabinClass === cabinClass &&
      p.routeType === routeType &&
      (p.airline === 'ALL' || p.airline.toLowerCase() === airline.toLowerCase())
  );

  return (
    found ||
    activePolicies.find((p) => p.cabinClass === cabinClass && p.routeType === routeType) ||
    activePolicies[0]
  );
}

export function getAllBaggagePolicies(): BaggageAllowance[] {
  return activePolicies;
}

export function getAdditionalBaggageOptions(): AdditionalBaggageOption[] {
  return activeOptions;
}

export function updateBaggagePolicies(
  policies: BaggageAllowance[],
  options?: AdditionalBaggageOption[]
): void {
  activePolicies = policies;
  if (options) {
    activeOptions = options;
  }
}
