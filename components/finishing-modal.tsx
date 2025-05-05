"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, MapPin, Star, X } from "lucide-react"
import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Card, CardContent } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import confetti from "canvas-confetti"

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

interface PlacesModalProps {
  places: Place[]
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
}

export function PlacesModal({
  places,
  isOpen,
  onClose,
  title = "Your Curated Places",
  description = "We've found the perfect places for you based on your preferences.",
}: PlacesModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const totalSlides = places.length + 2 // +2 for intro and outro slides

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : prev))
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev))
  }

  // Trigger confetti when reaching the last slide
  useEffect(() => {
    if (currentSlide === totalSlides - 1) {
      const duration = 3 * 1000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min
      }

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)

        // since particles fall down, start a bit higher than random
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ["#ff0000", "#00ff00", "#0000ff"],
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ["#ffff00", "#ff00ff", "#00ffff"],
        })
      }, 250)

      return () => clearInterval(interval)
    }
  }, [currentSlide, totalSlides])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <div className="absolute right-4 top-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <div className="relative overflow-hidden">
          {/* Slides container */}
          <div
            className="flex transition-transform duration-500 ease-in-out h-[80vh] sm:h-[600px]"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {/* Intro Slide */}
            <div className="min-w-full h-full flex flex-col">
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-purple-500 to-blue-600 text-white">
                <div className="animate-bounce mb-6">
                  <MapPin className="h-16 w-16" />
                </div>
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-3xl font-bold">{title}</DialogTitle>
                  <DialogDescription className="text-white/90 text-lg mt-2">{description}</DialogDescription>
                </DialogHeader>
                <p className="mb-8">Swipe through to discover your perfect destinations!</p>
                <Button onClick={nextSlide} className="bg-white text-blue-600 hover:bg-white/90">
                  Let`s Explore
                </Button>
              </div>
            </div>

            {/* Place Slides */}
            {places.map((place, index) => (
              <div key={place.id} className="min-w-full h-full relative">
                <div className="relative h-full flex flex-col justify-between p-6">
                  <div className="flex justify-between items-start">
                    <Badge className="bg-blue-500 hover:bg-blue-600">{place.type}</Badge>
                    {place.rating && (
                      <div className="flex items-center bg-yellow-500 text-black px-2 py-1 rounded-md">
                        <Star className="h-4 w-4 fill-current mr-1" />
                        <span className="font-medium">{place.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <Card className="w-full bg-white/90 backdrop-blur-md">
                    <CardContent className="p-4">
                      <h3 className="text-xl font-bold mb-2">{place.name}</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="outline" className="bg-white">
                          Relevancy: {(place.relevancy * 100).toFixed(0)}%
                        </Badge>
                      </div>

                      <div className="flex gap-2 mt-4">
                        {place.url && (
                          <Button size="sm" variant="outline" onClick={() => window.open(place.url!, "_blank")}>
                            View Details
                          </Button>
                        )}
                        {place.websiteUrl && (
                          <Button size="sm" onClick={() => window.open(place.websiteUrl!, "_blank")}>
                            Visit Website
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}

            {/* Outro Slide with Confetti */}
            <div className="min-w-full h-full flex flex-col">
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-green-500 to-teal-600 text-white">
                <div className="mb-6">
                  <div className="relative">
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
                      {/* Confetti is triggered by useEffect */}
                    </div>
                    <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center">
                      <MapPin className="h-8 w-8 text-teal-600" />
                    </div>
                  </div>
                </div>
                <h2 className="text-3xl font-bold mb-4">Your Journey Awaits!</h2>
                <p className="mb-8 text-lg">
                  We`ve curated {places.length} amazing places just for you. Ready to start your adventure?
                </p>
                <div className="flex gap-4">
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="border-white text-black hover:bg-white hover:text-teal-700"
                  >
                    Close
                  </Button>
                  <Button onClick={() => setCurrentSlide(1)} className="bg-white text-teal-800 hover:bg-white/90">
                    Review Places
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation arrows */}
          {currentSlide > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/40 text-white"
              onClick={prevSlide}
            >
              <ChevronLeft className="h-6 w-6" />
              <span className="sr-only">Previous</span>
            </Button>
          )}

          {currentSlide < totalSlides - 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/40 text-white"
              onClick={nextSlide}
            >
              <ChevronRight className="h-6 w-6" />
              <span className="sr-only">Next</span>
            </Button>
          )}

          {/* Slide indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1.5">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  currentSlide === index ? "bg-white w-4" : "bg-white/50 hover:bg-white/80",
                )}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

