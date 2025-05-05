import { SessionForm } from "~/components/session-form"
import Footer from "~/components/footer"
import Header from "~/components/header"

export default function SessionPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 h-full">
        <Header/>
        <div className="h-full w-full flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold">QuickPlan Session (1 Activity) </h1>
            <SessionForm />
        </div>
      <Footer/>
    </div>
  )
}
