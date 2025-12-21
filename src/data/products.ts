export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  unit: string;
  image: string;
  discount?: number;
  inStock: boolean;
  brand?: string;
  rating?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;
  productCount: number;
}

export const categories: Category[] = [
  { id: "fruits", name: "Fruits", icon: "🍎", image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=200&h=200&fit=crop", productCount: 45 },
  { id: "vegetables", name: "Vegetables", icon: "🥬", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&h=200&fit=crop", productCount: 62 },
  { id: "dairy", name: "Dairy & Eggs", icon: "🥛", image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=200&h=200&fit=crop", productCount: 38 },
  { id: "snacks", name: "Snacks", icon: "🍿", image: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=200&h=200&fit=crop", productCount: 85 },
  { id: "beverages", name: "Beverages", icon: "🥤", image: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=200&h=200&fit=crop", productCount: 52 },
  { id: "bakery", name: "Bakery", icon: "🍞", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop", productCount: 28 },
  { id: "meat", name: "Meat & Fish", icon: "🍖", image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=200&h=200&fit=crop", productCount: 35 },
  { id: "frozen", name: "Frozen", icon: "🧊", image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=200&h=200&fit=crop", productCount: 42 },
  { id: "household", name: "Household", icon: "🧹", image: "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=200&h=200&fit=crop", productCount: 65 },
  { id: "personal", name: "Personal Care", icon: "🧴", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&h=200&fit=crop", productCount: 78 },
];

export const products: Product[] = [
  // Fruits
  { id: "1", name: "Fresh Bananas", category: "fruits", price: 45, originalPrice: 55, unit: "1 dozen", image: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=300&h=300&fit=crop", discount: 18, inStock: true, brand: "Fresh Farm", rating: 4.5 },
  { id: "2", name: "Red Apples", category: "fruits", price: 180, originalPrice: 220, unit: "1 kg", image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&h=300&fit=crop", discount: 18, inStock: true, brand: "Himalayan", rating: 4.7 },
  { id: "3", name: "Sweet Mangoes", category: "fruits", price: 299, originalPrice: 399, unit: "1 kg", image: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&h=300&fit=crop", discount: 25, inStock: true, brand: "Alphonso", rating: 4.9 },
  { id: "4", name: "Fresh Oranges", category: "fruits", price: 89, unit: "1 kg", image: "https://images.unsplash.com/photo-1547514701-42782101795e?w=300&h=300&fit=crop", inStock: true, brand: "Nagpur", rating: 4.3 },
  { id: "5", name: "Grapes (Green)", category: "fruits", price: 120, originalPrice: 150, unit: "500 g", image: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=300&h=300&fit=crop", discount: 20, inStock: true, brand: "Fresh Farm", rating: 4.4 },
  
  // Vegetables
  { id: "6", name: "Fresh Tomatoes", category: "vegetables", price: 35, unit: "500 g", image: "https://images.unsplash.com/photo-1546470427-0d4db154cce8?w=300&h=300&fit=crop", inStock: true, brand: "Local Farm", rating: 4.2 },
  { id: "7", name: "Onions", category: "vegetables", price: 40, originalPrice: 50, unit: "1 kg", image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=300&h=300&fit=crop", discount: 20, inStock: true, brand: "Nashik", rating: 4.5 },
  { id: "8", name: "Potatoes", category: "vegetables", price: 30, unit: "1 kg", image: "https://images.unsplash.com/photo-1518977676601-b53f82ber152?w=300&h=300&fit=crop", inStock: true, brand: "Agra", rating: 4.3 },
  { id: "9", name: "Fresh Spinach", category: "vegetables", price: 25, unit: "250 g", image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&h=300&fit=crop", inStock: true, brand: "Organic Farm", rating: 4.6 },
  { id: "10", name: "Capsicum (Mixed)", category: "vegetables", price: 65, originalPrice: 80, unit: "500 g", image: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=300&h=300&fit=crop", discount: 19, inStock: true, brand: "Fresh Farm", rating: 4.4 },
  
  // Dairy
  { id: "11", name: "Amul Toned Milk", category: "dairy", price: 28, unit: "500 ml", image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=300&fit=crop", inStock: true, brand: "Amul", rating: 4.8 },
  { id: "12", name: "Fresh Paneer", category: "dairy", price: 95, originalPrice: 110, unit: "200 g", image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&h=300&fit=crop", discount: 14, inStock: true, brand: "Mother Dairy", rating: 4.6 },
  { id: "13", name: "Curd (Dahi)", category: "dairy", price: 45, unit: "400 g", image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=300&fit=crop", inStock: true, brand: "Nestle", rating: 4.5 },
  { id: "14", name: "Farm Eggs", category: "dairy", price: 85, originalPrice: 99, unit: "12 pcs", image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop", discount: 14, inStock: true, brand: "Fresho", rating: 4.7 },
  { id: "15", name: "Butter (Salted)", category: "dairy", price: 55, unit: "100 g", image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&h=300&fit=crop", inStock: true, brand: "Amul", rating: 4.8 },
  
  // Snacks
  { id: "16", name: "Lay's Classic Salted", category: "snacks", price: 20, unit: "52 g", image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=300&fit=crop", inStock: true, brand: "Lay's", rating: 4.4 },
  { id: "17", name: "Kurkure Masala Munch", category: "snacks", price: 20, unit: "90 g", image: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=300&h=300&fit=crop", inStock: true, brand: "Kurkure", rating: 4.5 },
  { id: "18", name: "Haldiram's Bhujia", category: "snacks", price: 99, originalPrice: 120, unit: "400 g", image: "https://images.unsplash.com/photo-1613919517767-e5e3b0b5e56d?w=300&h=300&fit=crop", discount: 18, inStock: true, brand: "Haldiram's", rating: 4.7 },
  { id: "19", name: "Oreo Cookies", category: "snacks", price: 30, unit: "120 g", image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&h=300&fit=crop", inStock: true, brand: "Oreo", rating: 4.6 },
  { id: "20", name: "Dark Fantasy", category: "snacks", price: 45, originalPrice: 50, unit: "100 g", image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300&h=300&fit=crop", discount: 10, inStock: true, brand: "Sunfeast", rating: 4.8 },
  
  // Beverages
  { id: "21", name: "Coca-Cola", category: "beverages", price: 40, unit: "750 ml", image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300&h=300&fit=crop", inStock: true, brand: "Coca-Cola", rating: 4.5 },
  { id: "22", name: "Real Mixed Fruit Juice", category: "beverages", price: 99, originalPrice: 120, unit: "1 L", image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=300&h=300&fit=crop", discount: 18, inStock: true, brand: "Real", rating: 4.4 },
  { id: "23", name: "Tata Tea Gold", category: "beverages", price: 285, originalPrice: 320, unit: "500 g", image: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=300&h=300&fit=crop", discount: 11, inStock: true, brand: "Tata", rating: 4.7 },
  { id: "24", name: "Nescafe Classic", category: "beverages", price: 375, unit: "200 g", image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&h=300&fit=crop", inStock: true, brand: "Nescafe", rating: 4.8 },
  { id: "25", name: "Bisleri Water", category: "beverages", price: 20, unit: "1 L", image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300&h=300&fit=crop", inStock: true, brand: "Bisleri", rating: 4.3 },
  
  // Bakery
  { id: "26", name: "Brown Bread", category: "bakery", price: 45, unit: "400 g", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop", inStock: true, brand: "Harvest Gold", rating: 4.4 },
  { id: "27", name: "Milk Bread", category: "bakery", price: 35, unit: "400 g", image: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=300&h=300&fit=crop", inStock: true, brand: "Britannia", rating: 4.5 },
  { id: "28", name: "Croissant", category: "bakery", price: 65, originalPrice: 80, unit: "2 pcs", image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&h=300&fit=crop", discount: 19, inStock: true, brand: "Fresh Bakes", rating: 4.6 },
];

export const offers = [
  { id: "1", title: "Flat 50% OFF", description: "On first order above ₹199", code: "FIRST50", validUntil: "2024-12-31", minOrder: 199, discount: 50, maxDiscount: 100 },
  { id: "2", title: "Free Delivery", description: "On orders above ₹299", code: "FREEDEL", validUntil: "2024-12-31", minOrder: 299, discount: 0, maxDiscount: 40 },
  { id: "3", title: "₹75 OFF", description: "On orders above ₹499", code: "SAVE75", validUntil: "2024-12-31", minOrder: 499, discount: 0, maxDiscount: 75 },
  { id: "4", title: "20% Cashback", description: "Pay with UPI & get cashback", code: "UPI20", validUntil: "2024-12-31", minOrder: 199, discount: 20, maxDiscount: 50 },
];

export const banners = [
  { id: "1", title: "Fresh Vegetables", subtitle: "Farm to table in 10 mins", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&h=400&fit=crop", color: "bg-primary" },
  { id: "2", title: "Dairy Products", subtitle: "Always fresh, always pure", image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&h=400&fit=crop", color: "bg-accent" },
  { id: "3", title: "Snacks & Munchies", subtitle: "Party time essentials", image: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=800&h=400&fit=crop", color: "bg-secondary" },
];
