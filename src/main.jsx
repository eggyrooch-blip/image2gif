import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import LandingPage from './components/LandingPage.jsx'
import { LanguageProvider } from './contexts/LanguageContext'

// Landing page wrapper component to pass pageKey
const LandingPageWrapper = ({ pageKey }) => {
  return <LandingPage pageKey={pageKey} />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/jpg-to-gif" element={<LandingPageWrapper pageKey="jpg-to-gif" />} />
          <Route path="/png-to-gif" element={<LandingPageWrapper pageKey="png-to-gif" />} />
          <Route path="/jpeg-to-gif" element={<LandingPageWrapper pageKey="jpeg-to-gif" />} />
          <Route path="/photo-to-gif" element={<LandingPageWrapper pageKey="photo-to-gif" />} />
          <Route path="/compress-gif" element={<LandingPageWrapper pageKey="compress-gif" />} />
          <Route path="/no-watermark-gif-maker" element={<LandingPageWrapper pageKey="no-watermark-gif-maker" />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  </StrictMode>,
)
