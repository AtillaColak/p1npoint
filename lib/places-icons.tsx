import {
    Car,
    Building2,
    Landmark,
    GraduationCap,
    Film,
    Factory,
    BadgeDollarSign,
    UtensilsCrossed,
    Mountain,
    FlagIcon as Government,
    Stethoscope,
    Home,
    Hotel,
    Trees,
    Church,
    Wrench,
    ShoppingBag,
    Trophy,
    Bus,
    MapPin,
    Salad,
    Coffee,
    Pizza,
    Beer,
    Sandwich,
    IceCream,
    Beef,
    Fish,
    Dessert,
    Wine,
    Soup,
    Utensils,
    type LucideIcon,
  } from "lucide-react"
  
  // Main category to icon mapping
  export const categoryToIcon: Record<string, LucideIcon> = {
    Automotive: Car,
    Business: Building2,
    Culture: Landmark,
    Education: GraduationCap,
    "Entertainment and Recreation": Film,
    Facilities: Factory,
    Finance: BadgeDollarSign,
    "Food and Drink": UtensilsCrossed,
    "Geographical Areas": Mountain,
    Government: Government,
    "Health and Wellness": Stethoscope,
    Housing: Home,
    Lodging: Hotel,
    "Natural Features": Trees,
    "Places of Worship": Church,
    Services: Wrench,
    Shopping: ShoppingBag,
    Sports: Trophy,
    Transportation: Bus,
  }
  
  // Food subcategories to specific food icons
  export const foodTypeToIcon: Record<string, LucideIcon> = {
    restaurant: Utensils,
    cafe: Coffee,
    bakery: Sandwich,
    bar: Beer,
    pub: Beer,
    fast_food: Pizza,
    ice_cream: IceCream,
    meal_takeaway: UtensilsCrossed,
    meal_delivery: UtensilsCrossed,
    steakhouse: Beef,
    seafood: Fish,
    dessert: Dessert,
    vegan: Salad,
    vegetarian: Salad,
    italian: Pizza,
    mexican: Soup,
    chinese: Soup,
    japanese: Fish,
    thai: Soup,
    indian: Soup,
    french: Wine,
    american: Sandwich,
    korean: Soup,
    vietnamese: Soup,
    mediterranean: Salad,
    greek: Salad,
    spanish: Soup,
    middle_eastern: Soup,
    asian: Soup,
    latin_american: Soup,
    african: Soup,
    caribbean: Soup,
    european: Wine,
    international: UtensilsCrossed,
    fusion: UtensilsCrossed,
    healthy: Salad,
    gluten_free: Salad,
    organic: Salad,
    breakfast: Coffee,
    brunch: Coffee,
    lunch: Sandwich,
    dinner: Utensils,
    buffet: UtensilsCrossed,
    fine_dining: Wine,
    casual_dining: Utensils,
    family_restaurant: Utensils,
    food_court: UtensilsCrossed,
    food_truck: UtensilsCrossed,
    food_stand: UtensilsCrossed,
    night_club: Beer,
  }
  
  /**
   * Get the appropriate icon component for a place based on its type
   * @param place The place object with type information
   * @returns A Lucide icon component
   */
  export function getPlaceIcon(place: { type: string }): LucideIcon {
    // First check if it's a food place with a specific subtype
    if (place.type.toLowerCase().includes("food") || place.type.toLowerCase().includes("restaurant")) {
      // Extract potential food subtypes from the place type
      const lowerType = place.type.toLowerCase()
  
      // Check for specific food subtypes
      for (const [subtype, icon] of Object.entries(foodTypeToIcon)) {
        if (lowerType.includes(subtype)) {
          return icon
        }
      }
  
      // Default food icon if no specific subtype matched
      return UtensilsCrossed
    }
  
    // Check for main categories
    for (const [category, icon] of Object.entries(categoryToIcon)) {
      if (place.type.includes(category)) {
        return icon
      }
    }
  
    // Default icon if no match found
    return MapPin
  }
  
  /**
   * Component to render the appropriate icon for a place
   */
  export function PlaceIcon({ place, className }: { place: { type: string }; className?: string }) {
    const Icon = getPlaceIcon(place)
    return <Icon className={className} />
  }
  