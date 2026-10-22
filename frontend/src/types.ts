export interface MarketLocation {
  id: string;
  name: string;
  region: string;
  state: string;
  lat: number;
  lng: number;
  radiusMiles: number;
  activeFarmersCount: number;
  hubName: string;
}

export interface Farmer {
  id: string;
  name: string;
  farmName: string;
  locationName: string;
  lat: number;
  lng: number;
  baseDistanceMiles: number;
  specialty: string;
  bio: string;
  accreditation: string;
  harvestPractices: string;
  avatarUrl: string;
  establishedYear: number;
  deliveryWindow: string;
  featuredProduce: string[];
}

export interface Product {
  id: string;
  name: string;
  category: 'vegetables' | 'fruits' | 'grains' | 'legumes' | 'dairy' | 'specialty';
  farmerId: string;
  farmerName: string;
  farmName: string;
  farmerLocation: string;
  price: number;
  unit: string;
  availableQty: number;
  minimumOrder: number;
  harvestDate: string;
  cultivationMethod: 'Certified Organic' | 'Regenerative' | 'Heirloom / Natural' | 'Pesticide-Free' | 'Pasture-Raised';
  originCity: string;
  isIntercityEligible: boolean;
  image: string;
  description: string;
  storageNotes: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type UserRole = 'buyer' | 'farmer' | 'retailer' | 'wholesaler' | 'delivery' | 'admin';
