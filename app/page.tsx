"use client";

import Header from "~/components/header";
import Footer from "~/components/footer";
import AnimatedGlobe from "~/components/animated-globe";
import { Button } from "~/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-screen w-full bg-gradient-to-b from-[#f0f0f0] to-[#ffffff]">
      <Header />
      <div className="flex flex-col items-center justify-center h-full w-full">
        <AnimatedGlobe />
        <Button
          variant="outline"
          className="fixed -translate-x-24 border-black text-black hover:bg-black/10"
        >
          <Link href={"/quickplan"}>Quick Plan</Link>
        </Button>
        <Button
          variant="default"
          className="fixed translate-x-24 bg-black hover:bg-black/90 text-white"
        >
          Long Trip
        </Button>
      </div>
      <Footer />
    </div>
  );
}
