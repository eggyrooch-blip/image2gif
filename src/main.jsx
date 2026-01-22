import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { routes } from './seo/routes'
import './index.css'
import App from './App.jsx'
import LandingPage from './components/LandingPage.jsx'
import NotFound from './components/NotFound.jsx'
import { LanguageProvider } from './contexts/LanguageContext'
import CompressMp4Page from './components/CompressMp4Page.jsx'
import CropGifPage from './components/CropGifPage.jsx'
import GifCanvasPage from './components/GifCanvasPage.jsx'
import AddTextToGifPage from './components/AddTextToGifPage.jsx'

// Landing page wrapper component to pass pageKey
const LandingPageWrapper = ({ pageKey }) => {
  return <LandingPage pageKey={pageKey} />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          {routes.map((route) => {
            // Special cases for non-LandingPage components
            if (route.path === '/') return <Route key={route.path} path="/" element={<App lockMode initialMode="images" />} />;
            if (route.path === '/video-to-gif') return <Route key={route.path} path={route.path} element={<App initialMode="video" lockMode />} />;
            if (route.key === 'image-to-mp4') return <Route key={route.path} path={route.path} element={<App lockMode initialMode="images" />} />; // Merged into main tool
            if (route.key === 'compress-mp4') return <Route key={route.path} path={route.path} element={<CompressMp4Page />} />;
            if (route.key === 'crop-gif') return <Route key={route.path} path={route.path} element={<CropGifPage />} />;
            if (route.key === 'gif-canvas') return <Route key={route.path} path={route.path} element={<GifCanvasPage />} />;
            if (route.key === 'add-text-to-gif') return <Route key={route.path} path={route.path} element={<AddTextToGifPage />} />;

            // Default: LandingPageWrapper with SEO data
            return <Route key={route.path} path={route.path} element={<LandingPageWrapper pageKey={route.key} />} />;
          })}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  </StrictMode>,
)
