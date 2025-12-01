import { useEffect } from 'react'
import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { loadSeedHospitals } from "@/data/seedHospitals"

function App() {
  // Load seed data on app startup
  useEffect(() => {
    loadSeedHospitals();
  }, []);

  return (
    <>
      <Pages />
      <Toaster />
    </>
  )
}

export default App 