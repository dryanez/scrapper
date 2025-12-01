import { useEffect } from 'react'
import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { loadSeedHospitals } from "@/data/seedHospitals"
import ScrapingStatusBar from "@/components/scraping/ScrapingStatusBar"

function App() {
  // Load seed data on app startup
  useEffect(() => {
    loadSeedHospitals();
  }, []);

  return (
    <>
      <Pages />
      <Toaster />
      <ScrapingStatusBar />
    </>
  )
}

export default App 