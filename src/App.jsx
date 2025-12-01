import { useEffect } from 'react'
import './App.css'
import Pages from "@/pages/index.jsx"
import { loadSeedHospitals } from "@/data/seedHospitals"

function App() {
  // Load seed data on app startup
  useEffect(() => {
    loadSeedHospitals();
  }, []);

  return (
    <>
      <Pages />
    </>
  )
}

export default App 