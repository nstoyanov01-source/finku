import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './styles/global.css'

import posthog from 'posthog-js'
import { PostHogProvider } from '@posthog/react'

posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
  person_profiles: 'identified_only',
  capture_pageview: true,
  capture_pageleave: true,
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PostHogProvider client={posthog}>
      <BrowserRouter>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </BrowserRouter>
    </PostHogProvider>
  </React.StrictMode>
)

const loader = document.getElementById('initial-loader')
if (loader) loader.style.display = 'none'
