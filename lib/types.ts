export interface Place {
    id: string
    name: string
    lat: number
    lng: number    
    type: string
    relevancy: number
    rating: number | null
    url: string | null 
    websiteUrl: string | null
}
  
export interface Session{
    sessionId: string 
    startTime: string 
    isActive: boolean 
    places: Place[]
}