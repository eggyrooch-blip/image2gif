import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import LandingPage from './components/LandingPage.jsx'
import NotFound from './components/NotFound.jsx'
import { LanguageProvider } from './contexts/LanguageContext'
import ImageToMp4Page from './components/ImageToMp4Page.jsx'
import CompressMp4Page from './components/CompressMp4Page.jsx'

// Landing page wrapper component to pass pageKey
const LandingPageWrapper = ({ pageKey }) => {
  return <LandingPage pageKey={pageKey} />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App lockMode initialMode="images" />} />
          <Route path="/jpg-to-gif" element={<LandingPageWrapper pageKey="jpg-to-gif" />} />
          <Route path="/png-to-gif" element={<LandingPageWrapper pageKey="png-to-gif" />} />
          <Route path="/jpeg-to-gif" element={<LandingPageWrapper pageKey="jpeg-to-gif" />} />
          <Route path="/photo-to-gif" element={<LandingPageWrapper pageKey="photo-to-gif" />} />
          <Route path="/compress-gif" element={<LandingPageWrapper pageKey="compress-gif" />} />
          <Route path="/no-watermark-gif-maker" element={<LandingPageWrapper pageKey="no-watermark-gif-maker" />} />
          <Route path="/video-to-gif" element={<App initialMode="video" lockMode />} />
          <Route path="/mp4-to-gif" element={<LandingPageWrapper pageKey="mp4-to-gif" />} />
          <Route path="/screen-recording-to-gif" element={<LandingPageWrapper pageKey="screen-recording-to-gif" />} />
          <Route path="/image-to-mp4" element={<ImageToMp4Page />} />
          <Route path="/compress-mp4" element={<CompressMp4Page />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  </StrictMode>,
)
