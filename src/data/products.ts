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
  description?: string;
  nutritionInfo?: string;
  shelfLife?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;
  productCount: number;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
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
  { id: "1", name: "Fresh Bananas", category: "fruits", price: 45, originalPrice: 55, unit: "1 dozen", image: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=300&h=300&fit=crop", discount: 18, inStock: true, brand: "Fresh Farm", rating: 4.5, description: "Fresh, ripe organic bananas sourced directly from local farms. Rich in potassium and perfect for breakfast smoothies or as a healthy snack.", nutritionInfo: "Per 100g: Calories 89, Carbs 23g, Fiber 2.6g, Potassium 358mg", shelfLife: "5-7 days" },
  { id: "2", name: "Red Apples", category: "fruits", price: 180, originalPrice: 220, unit: "1 kg", image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&h=300&fit=crop", discount: 18, inStock: true, brand: "Himalayan", rating: 4.7, description: "Premium Shimla apples known for their crisp texture and sweet-tart flavor. Hand-picked from the orchards of Himachal Pradesh.", nutritionInfo: "Per 100g: Calories 52, Carbs 14g, Fiber 2.4g, Vitamin C 4.6mg", shelfLife: "2-3 weeks when refrigerated" },
  { id: "3", name: "Sweet Mangoes", category: "fruits", price: 299, originalPrice: 399, unit: "1 kg", image: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&h=300&fit=crop", discount: 25, inStock: true, brand: "Alphonso", rating: 4.9, description: "The king of mangoes! Premium Alphonso mangoes from Ratnagiri with their distinctive sweet flavor and creamy texture.", nutritionInfo: "Per 100g: Calories 60, Vitamin C 36mg, Vitamin A 54mcg", shelfLife: "5-7 days at room temperature" },
  { id: "4", name: "Fresh Oranges", category: "fruits", price: 89, unit: "1 kg", image: "https://images.unsplash.com/photo-1547514701-42782101795e?w=300&h=300&fit=crop", inStock: true, brand: "Nagpur", rating: 4.3, description: "Juicy Nagpur oranges bursting with citrus flavor. Perfect for fresh juice or as a refreshing snack.", nutritionInfo: "Per 100g: Calories 47, Vitamin C 53mg, Fiber 2.4g", shelfLife: "2 weeks when refrigerated" },
  { id: "5", name: "Grapes (Green)", category: "fruits", price: 120, originalPrice: 150, unit: "500 g", image: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=300&h=300&fit=crop", discount: 20, inStock: true, brand: "Fresh Farm", rating: 4.4, description: "Seedless green grapes with a sweet, refreshing taste. Great for snacking or adding to fruit salads.", nutritionInfo: "Per 100g: Calories 69, Carbs 18g, Fiber 0.9g", shelfLife: "1-2 weeks when refrigerated" },
  
  // Vegetables
  { id: "6", name: "Fresh Tomatoes", category: "vegetables", price: 35, unit: "500 g", image: "https://images.unsplash.com/photo-1546470427-0d4db154cce8?w=300&h=300&fit=crop", inStock: true, brand: "Local Farm", rating: 4.2, description: "Vine-ripened tomatoes with perfect color and taste. Ideal for salads, curries, and everyday cooking.", nutritionInfo: "Per 100g: Calories 18, Carbs 3.9g, Fiber 1.2g, Vitamin C 14mg", shelfLife: "7-10 days" },
  { id: "7", name: "Onions", category: "vegetables", price: 40, originalPrice: 50, unit: "1 kg", image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=300&h=300&fit=crop", discount: 20, inStock: true, brand: "Nashik", rating: 4.5, description: "Premium quality onions from Nashik. Essential for Indian cooking with a perfect balance of pungency and sweetness.", nutritionInfo: "Per 100g: Calories 40, Carbs 9g, Fiber 1.7g", shelfLife: "2-3 weeks in cool, dry place" },
  { id: "8", name: "Potatoes", category: "vegetables", price: 30, unit: "1 kg", image: "https://images.unsplash.com/photo-1518977676601-b53f82ber152?w=300&h=300&fit=crop", inStock: true, brand: "Agra", rating: 4.3, description: "Fresh potatoes perfect for curries, fries, or any preparation. Sourced from the farms of Agra.", nutritionInfo: "Per 100g: Calories 77, Carbs 17g, Fiber 2.2g, Potassium 421mg", shelfLife: "3-4 weeks in cool, dark place" },
  { id: "9", name: "Fresh Spinach", category: "vegetables", price: 25, unit: "250 g", image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&h=300&fit=crop", inStock: true, brand: "Organic Farm", rating: 4.6, description: "Fresh, leafy spinach packed with iron and nutrients. Perfect for palak paneer, smoothies, or salads.", nutritionInfo: "Per 100g: Calories 23, Iron 2.7mg, Vitamin K 483mcg, Fiber 2.2g", shelfLife: "4-5 days when refrigerated" },
  { id: "10", name: "Capsicum (Mixed)", category: "vegetables", price: 65, originalPrice: 80, unit: "500 g", image: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=300&h=300&fit=crop", discount: 19, inStock: true, brand: "Fresh Farm", rating: 4.4, description: "Colorful mix of red, yellow, and green capsicums. Great for stir-fries, salads, and stuffed preparations.", nutritionInfo: "Per 100g: Calories 20, Vitamin C 80mg, Fiber 1.7g", shelfLife: "7-10 days when refrigerated" },
  
  // Dairy
  { id: "11", name: "Amul Toned Milk", category: "dairy", price: 28, unit: "500 ml", image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=300&fit=crop", inStock: true, brand: "Amul", rating: 4.8, description: "India's favorite toned milk from Amul. Rich in calcium and protein, perfect for daily consumption.", nutritionInfo: "Per 100ml: Calories 54, Protein 3.1g, Fat 3g, Calcium 120mg", shelfLife: "5-7 days when refrigerated" },
  { id: "12", name: "Fresh Paneer", category: "dairy", price: 95, originalPrice: 110, unit: "200 g", image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&h=300&fit=crop", discount: 14, inStock: true, brand: "Mother Dairy", rating: 4.6, description: "Soft, fresh paneer made from pure milk. Perfect for paneer tikka, palak paneer, and more.", nutritionInfo: "Per 100g: Calories 265, Protein 18g, Fat 21g, Calcium 480mg", shelfLife: "5-7 days when refrigerated" },
  { id: "13", name: "Curd (Dahi)", category: "dairy", price: 45, unit: "400 g", image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=300&fit=crop", inStock: true, brand: "Nestle", rating: 4.5, description: "Creamy, probiotic-rich curd for a healthy gut. Great with meals or for making lassi and raita.", nutritionInfo: "Per 100g: Calories 60, Protein 3.5g, Calcium 150mg", shelfLife: "10-14 days when refrigerated" },
  { id: "14", name: "Farm Eggs", category: "dairy", price: 85, originalPrice: 99, unit: "12 pcs", image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop", discount: 14, inStock: true, brand: "Fresho", rating: 4.7, description: "Farm fresh eggs from free-range hens. Rich in protein and perfect for breakfast or baking.", nutritionInfo: "Per egg: Calories 70, Protein 6g, Fat 5g, Cholesterol 186mg", shelfLife: "3 weeks when refrigerated" },
  { id: "15", name: "Butter (Salted)", category: "dairy", price: 55, unit: "100 g", image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&h=300&fit=crop", inStock: true, brand: "Amul", rating: 4.8, description: "India's favorite butter made from pure milk fat. Perfect for cooking, spreading on toast, or adding richness to dishes.", nutritionInfo: "Per 100g: Calories 717, Fat 81g, Saturated Fat 51g", shelfLife: "6 months when refrigerated" },
  
  // Snacks
  { id: "16", name: "Lay's Classic Salted", category: "snacks", price: 20, unit: "52 g", image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=300&fit=crop", inStock: true, brand: "Lay's", rating: 4.4, description: "Crispy, golden potato chips with just the right amount of salt. Perfect for snacking anytime.", nutritionInfo: "Per 28g: Calories 160, Fat 10g, Carbs 15g, Sodium 170mg", shelfLife: "3 months" },
  { id: "17", name: "Kurkure Masala Munch", category: "snacks", price: 20, unit: "90 g", image: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=300&h=300&fit=crop", inStock: true, brand: "Kurkure", rating: 4.5, description: "Crunchy, spicy, and oh-so-delicious! India's favorite namkeen snack with a unique masala flavor.", nutritionInfo: "Per 30g: Calories 150, Fat 8g, Carbs 18g", shelfLife: "4 months" },
  { id: "18", name: "Haldiram's Bhujia", category: "snacks", price: 99, originalPrice: 120, unit: "400 g", image: "https://images.unsplash.com/photo-1613919517767-e5e3b0b5e56d?w=300&h=300&fit=crop", discount: 18, inStock: true, brand: "Haldiram's", rating: 4.7, description: "Authentic Bikaneri bhujia with the perfect blend of spices. A timeless Indian snack loved by all.", nutritionInfo: "Per 30g: Calories 170, Fat 10g, Carbs 15g, Protein 5g", shelfLife: "6 months" },
  { id: "19", name: "Oreo Cookies", category: "snacks", price: 30, unit: "120 g", image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&h=300&fit=crop", inStock: true, brand: "Oreo", rating: 4.6, description: "The world's favorite cookie! Chocolate sandwich cookies with a creamy vanilla filling.", nutritionInfo: "Per 3 cookies: Calories 160, Fat 7g, Sugar 14g", shelfLife: "6 months" },
  { id: "20", name: "Dark Fantasy", category: "snacks", price: 45, originalPrice: 50, unit: "100 g", image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300&h=300&fit=crop", discount: 10, inStock: true, brand: "Sunfeast", rating: 4.8, description: "Rich chocolate cookie with a gooey chocolate center. Pure indulgence in every bite.", nutritionInfo: "Per 2 cookies: Calories 130, Fat 6g, Sugar 8g", shelfLife: "6 months" },
  
  // Beverages
  { id: "21", name: "Coca-Cola", category: "beverages", price: 40, unit: "750 ml", image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300&h=300&fit=crop", inStock: true, brand: "Coca-Cola", rating: 4.5, description: "The classic refreshing taste of Coca-Cola. Perfect for parties, gatherings, or everyday refreshment.", nutritionInfo: "Per 100ml: Calories 42, Sugar 10.6g", shelfLife: "9 months" },
  { id: "22", name: "Real Mixed Fruit Juice", category: "beverages", price: 99, originalPrice: 120, unit: "1 L", image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=300&h=300&fit=crop", discount: 18, inStock: true, brand: "Real", rating: 4.4, description: "100% fruit juice blend with no added sugar. A healthy way to get your daily vitamins.", nutritionInfo: "Per 100ml: Calories 50, Vitamin C 20mg", shelfLife: "6 months" },
  { id: "23", name: "Tata Tea Gold", category: "beverages", price: 285, originalPrice: 320, unit: "500 g", image: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=300&h=300&fit=crop", discount: 11, inStock: true, brand: "Tata", rating: 4.7, description: "Premium tea leaves for the perfect cup of chai. Rich aroma and robust flavor in every sip.", nutritionInfo: "Per cup: Calories 2, Antioxidants present", shelfLife: "18 months" },
  { id: "24", name: "Nescafe Classic", category: "beverages", price: 375, unit: "200 g", image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&h=300&fit=crop", inStock: true, brand: "Nescafe", rating: 4.8, description: "100% pure instant coffee with a rich, full-bodied taste. Wake up to the aroma of Nescafe.", nutritionInfo: "Per cup: Calories 4, Caffeine 65mg", shelfLife: "24 months" },
  { id: "25", name: "Bisleri Water", category: "beverages", price: 20, unit: "1 L", image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300&h=300&fit=crop", inStock: true, brand: "Bisleri", rating: 4.3, description: "Pure, safe drinking water that undergoes 114 quality tests. Hydration you can trust.", nutritionInfo: "Per 100ml: Calories 0, Minerals present", shelfLife: "6 months" },
  
  // Bakery
  { id: "26", name: "Brown Bread", category: "bakery", price: 45, unit: "400 g", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop", inStock: true, brand: "Harvest Gold", rating: 4.4, description: "Soft, fresh whole wheat bread made with 100% whole wheat flour. High in fiber and perfect for sandwiches.", nutritionInfo: "Per slice: Calories 69, Carbs 12g, Fiber 1.9g, Protein 3g", shelfLife: "5 days" },
  { id: "27", name: "Milk Bread", category: "bakery", price: 35, unit: "400 g", image: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=300&h=300&fit=crop", inStock: true, brand: "Britannia", rating: 4.5, description: "Soft, fluffy milk bread with a mildly sweet taste. Perfect for sandwiches and toast.", nutritionInfo: "Per slice: Calories 75, Carbs 14g, Protein 2.5g", shelfLife: "4 days" },
  { id: "28", name: "Croissant", category: "bakery", price: 65, originalPrice: 80, unit: "2 pcs", image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&h=300&fit=crop", discount: 19, inStock: true, brand: "Fresh Bakes", rating: 4.6, description: "Buttery, flaky croissants freshly baked to perfection. A French classic for your breakfast.", nutritionInfo: "Per croissant: Calories 230, Fat 12g, Carbs 26g", shelfLife: "3 days" },
];

export const reviews: Review[] = [
  { id: "r1", productId: "1", userName: "Priya S.", rating: 5, comment: "Super fresh bananas! Delivered in perfect condition. Will order again.", date: "2024-01-15", helpful: 12 },
  { id: "r2", productId: "1", userName: "Rahul M.", rating: 4, comment: "Good quality but one was slightly bruised. Overall satisfied.", date: "2024-01-10", helpful: 5 },
  { id: "r3", productId: "1", userName: "Anita K.", rating: 5, comment: "Best bananas I've had! Organic taste is evident.", date: "2024-01-08", helpful: 8 },
  { id: "r4", productId: "2", userName: "Vikram P.", rating: 5, comment: "Crisp and delicious apples. Worth the price!", date: "2024-01-12", helpful: 15 },
  { id: "r5", productId: "2", userName: "Meera R.", rating: 4, comment: "Good Shimla apples, slightly smaller than expected.", date: "2024-01-05", helpful: 3 },
  { id: "r6", productId: "3", userName: "Suresh L.", rating: 5, comment: "Authentic Alphonso mangoes! Sweet and aromatic.", date: "2024-01-14", helpful: 25 },
  { id: "r7", productId: "3", userName: "Kavitha N.", rating: 5, comment: "Best mangoes of the season. Will definitely reorder.", date: "2024-01-11", helpful: 20 },
  { id: "r8", productId: "11", userName: "Amit D.", rating: 5, comment: "Fresh milk, always on time delivery.", date: "2024-01-13", helpful: 4 },
  { id: "r9", productId: "12", userName: "Deepa G.", rating: 5, comment: "Soft and fresh paneer, perfect for cooking!", date: "2024-01-09", helpful: 11 },
  { id: "r10", productId: "14", userName: "Rajesh T.", rating: 5, comment: "Farm fresh eggs with bright orange yolks. Delicious!", date: "2024-01-07", helpful: 18 },
  { id: "r11", productId: "18", userName: "Sneha B.", rating: 4, comment: "Classic bhujia taste. Could be a bit spicier.", date: "2024-01-16", helpful: 7 },
  { id: "r12", productId: "23", userName: "Vijay K.", rating: 5, comment: "Perfect chai every morning. Great quality tea.", date: "2024-01-14", helpful: 9 },
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

export const mockOrders = [
  {
    id: "order1",
    userId: "demo_user",
    date: "22 Dec 2024",
    status: "delivered" as const,
    total: 485,
    items: [
      { name: "Fresh Bananas", qty: 2, price: 45, productId: "1" },
      { name: "Red Apples", qty: 1, price: 180, productId: "2" },
      { name: "Amul Toned Milk", qty: 3, price: 28, productId: "11" },
    ],
    deliveryAddress: "123, Green Park, Sector 15, Chandigarh - 160015",
    deliveryCoordinates: { lat: 30.7333, lng: 76.7794 },
    timeline: [
      { status: "Order Placed", time: "10:30 AM", completed: true },
      { status: "Order Confirmed", time: "10:32 AM", completed: true },
      { status: "Preparing", time: "10:45 AM", completed: true },
      { status: "Out for Delivery", time: "11:00 AM", completed: true },
      { status: "Delivered", time: "11:15 AM", completed: true },
    ],
    deliveredAt: "11:15 AM",
  },
  {
    id: "order2",
    userId: "demo_user",
    date: "23 Dec 2024",
    status: "out_for_delivery" as const,
    total: 675,
    items: [
      { name: "Sweet Mangoes", qty: 1, price: 299, productId: "3" },
      { name: "Fresh Paneer", qty: 2, price: 95, productId: "12" },
      { name: "Farm Eggs", qty: 1, price: 85, productId: "14" },
    ],
    deliveryAddress: "45, Model Town, Phase 2, Ludhiana - 141001",
    deliveryCoordinates: { lat: 30.9010, lng: 75.8573 },
    deliveryPartner: {
      name: "Rajesh Kumar",
      phone: "+91 98765 43210",
      rating: 4.8,
    },
    timeline: [
      { status: "Order Placed", time: "2:00 PM", completed: true },
      { status: "Order Confirmed", time: "2:05 PM", completed: true },
      { status: "Preparing", time: "2:15 PM", completed: true },
      { status: "Out for Delivery", time: "2:30 PM", completed: true },
      { status: "Delivered", time: "", completed: false },
    ],
    eta: "10-15 mins",
  },
  {
    id: "order3",
    userId: "demo_user",
    date: "21 Dec 2024",
    status: "cancelled" as const,
    total: 320,
    items: [
      { name: "Tata Tea Gold", qty: 1, price: 285, productId: "23" },
      { name: "Brown Bread", qty: 1, price: 45, productId: "26" },
    ],
    deliveryAddress: "78, Civil Lines, Jalandhar - 144001",
    timeline: [
      { status: "Order Placed", time: "9:00 AM", completed: true },
      { status: "Cancelled", time: "9:15 AM", completed: true },
    ],
    cancelledReason: "Item out of stock",
  },
  {
    id: "order4",
    userId: "demo_user",
    date: "20 Dec 2024",
    status: "delivered" as const,
    total: 890,
    items: [
      { name: "Nescafe Classic", qty: 1, price: 375, productId: "24" },
      { name: "Haldiram's Bhujia", qty: 2, price: 99, productId: "18" },
      { name: "Croissant", qty: 3, price: 65, productId: "28" },
    ],
    deliveryAddress: "Plot 12, Industrial Area, Mohali - 160062",
    deliveryCoordinates: { lat: 30.7046, lng: 76.7179 },
    timeline: [
      { status: "Order Placed", time: "4:00 PM", completed: true },
      { status: "Order Confirmed", time: "4:05 PM", completed: true },
      { status: "Preparing", time: "4:20 PM", completed: true },
      { status: "Out for Delivery", time: "4:35 PM", completed: true },
      { status: "Delivered", time: "4:50 PM", completed: true },
    ],
    deliveredAt: "4:50 PM",
  },
];

export const getProductById = (id: string): Product | undefined => {
  return products.find(p => p.id === id);
};

export const getProductsByCategory = (categoryId: string): Product[] => {
  return products.filter(p => p.category === categoryId);
};

export const getRelatedProducts = (productId: string, limit: number = 4): Product[] => {
  const product = getProductById(productId);
  if (!product) return [];
  return products
    .filter(p => p.category === product.category && p.id !== productId)
    .slice(0, limit);
};

export const getProductReviews = (productId: string): Review[] => {
  return reviews.filter(r => r.productId === productId);
};
