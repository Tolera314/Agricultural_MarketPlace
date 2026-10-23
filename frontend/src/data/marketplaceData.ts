import { Farmer, MarketLocation, Product } from '../types';

const catVegetables = '/images/cat_vegetables.jpg';
const catFruits = '/images/cat_fruits.jpg';
const catGrains = '/images/cat_grains.jpg';
const catCoffeeSpices = '/images/cat_coffee_spices.jpg';
const catLivestock = '/images/cat_livestock.jpg';
const catSeeds = '/images/cat_seeds.jpg';

const prodTomatoes = '/images/prod_tomatoes.jpg';
const prodOrange = '/images/prod_orange.jpg';
const prodMaize = '/images/prod_maize.jpg';
const prodCoffee = '/images/prod_coffee.jpg';
const prodLettuce = '/images/prod_lettuce.jpg';

const avatarAbebe = '/images/avatar_abebe_hd.jpg';
const avatarSelamawit = '/images/avatar_selamawit_hd.jpg';
const avatarMekonnen = '/images/avatar_mekonnen_hd.jpg';

export const POPULAR_CATEGORIES = [
  {
    id: 'vegetables',
    name: 'Vegetables',
    image: catVegetables,
    count: '240+ Items',
  },
  {
    id: 'fruits',
    name: 'Fruits',
    image: catFruits,
    count: '180+ Items',
  },
  {
    id: 'grains-cereals',
    name: 'Grains & Cereals',
    image: catGrains,
    count: '95+ Items',
  },
  {
    id: 'coffee-spices',
    name: 'Coffee & Spices',
    image: catCoffeeSpices,
    count: '140+ Items',
  },
  {
    id: 'livestock',
    name: 'Livestock',
    image: catLivestock,
    count: '60+ Listings',
  },
  {
    id: 'seeds-inputs',
    name: 'Seeds & Inputs',
    image: catSeeds,
    count: '85+ Items',
  },
];

export interface FeaturedProductItem {
  id: string;
  name: string;
  categoryTag: string;
  pricePerKg: number;
  distanceKm: number;
  rating: number;
  reviewsCount: number;
  image: string;
  cultivationMethod: string;
  farmerName: string;
  description: string;
}

export const EXACT_FEATURED_PRODUCTS: FeaturedProductItem[] = [
  {
    id: 'prod-tomatoes-1',
    name: 'Tomatoes',
    categoryTag: 'Vegetable • Organic',
    pricePerKg: 16,
    distanceKm: 1.2,
    rating: 4.8,
    reviewsCount: 120,
    image: prodTomatoes,
    cultivationMethod: 'Organic',
    farmerName: 'Abebe Tadesse Farm',
    description: 'Vine-ripened organic red tomatoes freshly harvested from local fertile fields, rich in flavor and sweetness.',
  },
  {
    id: 'prod-orange-2',
    name: 'Orange',
    categoryTag: 'Fruit • Fresh',
    pricePerKg: 22,
    distanceKm: 2.4,
    rating: 4.7,
    reviewsCount: 98,
    image: prodOrange,
    cultivationMethod: 'Sun-ripened Natural',
    farmerName: 'Awash Valley Orchards',
    description: 'Juicy, vitamin C-rich sweet citrus oranges freshly picked from sunny highland orchards.',
  },
  {
    id: 'prod-maize-3',
    name: 'Maize',
    categoryTag: 'Grain • Organic',
    pricePerKg: 15,
    distanceKm: 3.6,
    rating: 4.8,
    reviewsCount: 75,
    image: prodMaize,
    cultivationMethod: 'Organic Heirloom',
    farmerName: 'Debre Zeit Grain Cooperative',
    description: 'Crisp golden sweet corn ears harvested at peak tenderness, ideal for roasting, boiling, and flour.',
  },
  {
    id: 'prod-coffee-4',
    name: 'Coffee Beans',
    categoryTag: 'Coffee • Premium',
    pricePerKg: 120,
    distanceKm: 2.8,
    rating: 4.9,
    reviewsCount: 210,
    image: prodCoffee,
    cultivationMethod: 'Single Origin Shade Grown',
    farmerName: 'Yirgacheffe Highland Growers',
    description: 'World-renowned Ethiopian single-origin specialty Arabica beans, sun-dried with floral aroma and rich notes.',
  },
  {
    id: 'prod-lettuce-5',
    name: 'Lettuce',
    categoryTag: 'Vegetable • Fresh',
    pricePerKg: 12,
    distanceKm: 5.1,
    rating: 4.9,
    reviewsCount: 62,
    image: prodLettuce,
    cultivationMethod: 'Hydro-fresh Crisp',
    farmerName: 'Sululta Greenery Farms',
    description: 'Crisp, vibrant green ruffled lettuce heads harvested early morning with pristine natural spring irrigation.',
  },
];

export const TESTIMONIALS_DATA = [
  {
    id: 'test-1',
    name: 'Abebe Tadesse',
    role: 'Farmer • Oromia',
    quote: '"This platform helps me sell my harvest at a fair price. I get orders from nearby buyers and beyond."',
    avatar: avatarAbebe,
    rating: 5,
  },
  {
    id: 'test-2',
    name: 'Selamawit Kebede',
    role: 'Buyer • Addis Ababa',
    quote: '"I find fresh, quality products near my location. The delivery is fast and reliable. Highly recommended!"',
    avatar: avatarSelamawit,
    rating: 5,
  },
  {
    id: 'test-3',
    name: 'Mekonnen Girma',
    role: 'Delivery Worker • Addis Ababa',
    quote: '"The work is flexible and well organized. I receive orders close to my location."',
    avatar: avatarMekonnen,
    rating: 5,
  },
];

export function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

export const SUPPORTED_LOCATIONS: MarketLocation[] = [
  {
    id: 'addis-ababa',
    name: 'Addis Ababa Central',
    region: 'Shewa',
    state: 'Ethiopia',
    lat: 9.03,
    lng: 38.74,
    radiusMiles: 30,
    activeFarmersCount: 124,
    hubName: 'Bole Agri Hub',
  },
  {
    id: 'dire-dawa',
    name: 'Dire Dawa Intercity Hub',
    region: 'Eastern Region',
    state: 'Ethiopia',
    lat: 9.59,
    lng: 41.86,
    radiusMiles: 45,
    activeFarmersCount: 88,
    hubName: 'Eastern Logistics Depot',
  },
  {
    id: 'hawassa',
    name: 'Hawassa Lake Basin',
    region: 'Sidama',
    state: 'Ethiopia',
    lat: 7.05,
    lng: 38.48,
    radiusMiles: 35,
    activeFarmersCount: 96,
    hubName: 'Sidama Fresh Cooperative',
  },
];

export const DEMO_FARMERS: Farmer[] = [
  {
    id: 'farmer-1',
    name: 'Abebe Tadesse',
    farmName: 'Oromia Highland Greenery',
    locationName: 'Debre Zeit / Oromia',
    lat: 8.75,
    lng: 38.98,
    baseDistanceMiles: 1.2,
    specialty: 'Organic Tomatoes & Vegetables',
    bio: 'Family farm cultivating organic vegetables and heirloom crops for over 18 years.',
    accreditation: 'Verified Organic & Fair Trade',
    harvestPractices: 'Daily Morning Pick with Spring Irrigation',
    avatarUrl: avatarAbebe,
    establishedYear: 2006,
    deliveryWindow: 'Daily Same-Day Delivery',
    featuredProduce: ['Tomatoes', 'Lettuce', 'Sweet Peppers'],
  },
];

export const DEMO_PRODUCTS: Product[] = EXACT_FEATURED_PRODUCTS.map((p) => ({
  id: p.id,
  name: p.name,
  category: p.name === 'Orange' ? 'fruits' : p.name === 'Maize' ? 'grains' : p.name === 'Coffee Beans' ? 'specialty' : 'vegetables',
  farmerId: 'farmer-1',
  farmerName: p.farmerName,
  farmName: p.farmerName,
  farmerLocation: `${p.distanceKm} km away`,
  price: p.pricePerKg,
  unit: 'kg',
  availableQty: 450,
  minimumOrder: 1,
  harvestDate: 'Today, 6:00 AM',
  cultivationMethod: 'Certified Organic',
  originCity: 'Debre Zeit',
  isIntercityEligible: true,
  image: p.image,
  description: p.description,
  storageNotes: 'Keep in a cool, ventilated basket or refrigerator for optimal freshness.',
}));
