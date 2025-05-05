import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card"
import { Calendar, Clock, Film, MapPin, Share2, Utensils, Users } from "lucide-react"
// L Generated. I'll fix this + make it pretty later. 
export default function PlanResultPage() {
  const plan = {
    title: "Weekend Hangout",
    city: "San Francisco",
    date: "Saturday, May 10, 2025",
    startTime: "4:00 PM",
    endTime: "10:30 PM",
    activities: [
      {
        id: 1,
        type: "food",
        name: "Dinner at Tartine",
        time: "4:00 PM - 5:30 PM",
        location: "Mission District",
        description: "Casual dinner with friends",
      },
      {
        id: 2,
        type: "movie",
        name: "Movie at AMC",
        time: "6:00 PM - 8:30 PM",
        location: "Downtown",
        description: "Watching the latest blockbuster",
      },
      {
        id: 3,
        type: "food",
        name: "Dessert at Ghirardelli",
        time: "9:00 PM - 10:30 PM",
        location: "Ghirardelli Square",
        description: "Ice cream and chocolates",
      },
    ],
    participants: [
      { id: 1, name: "Alex", avatar: "/placeholder.svg" },
      { id: 2, name: "Jamie", avatar: "/placeholder.svg" },
      { id: 3, name: "Taylor", avatar: "/placeholder.svg" },
      { id: 4, name: "Jordan", avatar: "/placeholder.svg" },
      { id: 5, name: "Casey", avatar: "/placeholder.svg" },
    ],
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "food":
        return <Utensils className="h-5 w-5" />
      case "movie":
        return <Film className="h-5 w-5" />
      default:
        return <Calendar className="h-5 w-5" />
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-rose-500 to-pink-500 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{plan.title}</h1>
              <div className="flex items-center mt-2 text-white/90">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{plan.city}</span>
              </div>
              <div className="flex items-center mt-1 text-white/90">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{plan.date}</span>
              </div>
              <div className="flex items-center mt-1 text-white/90">
                <Clock className="h-4 w-4 mr-1" />
                <span>
                  {plan.startTime} - {plan.endTime}
                </span>
              </div>
            </div>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Timeline</h2>
          <div className="space-y-6">
            {plan.activities.map((activity, index) => (
              <div key={activity.id} className="relative">
                {/* Timeline connector */}
                {index < plan.activities.length - 1 && (
                  <div className="absolute left-6 top-10 bottom-0 w-0.5 bg-muted-foreground/20 -ml-[2px]" />
                )}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 z-10">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-100 text-rose-600">
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="font-medium">{activity.name}</h3>
                      <Badge variant="outline" className="mt-1 sm:mt-0 w-fit">
                        {activity.time}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{activity.location}</p>
                    <p className="text-sm mt-1">{activity.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <div className="flex items-center mb-4">
              <Users className="h-5 w-5 mr-2" />
              <h2 className="text-lg font-semibold">Participants</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {plan.participants.map((participant) => (
                <div key={participant.id} className="flex flex-col items-center">
                  <Avatar className="h-12 w-12 border-2 border-background">
                    <AvatarImage src={participant.avatar || "/placeholder.svg"} alt={participant.name} />
                    <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs mt-1">{participant.name}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 px-6 py-4">
          <Button className="w-full">Join Plan</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
