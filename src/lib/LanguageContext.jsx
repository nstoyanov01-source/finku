import { useState, useEffect } from 'react'

let _lang = localStorage.getItem('finku_lang') === 'en' ? 'en' : 'bg'
let _listeners = []

function _notify(lang) {
  _listeners.forEach(fn => fn(lang))
}

export function useLanguage() {
  const [language, setLocal] = useState(_lang)

  useEffect(() => {
    const handler = (lang) => setLocal(lang)
    _listeners.push(handler)
    return () => { _listeners = _listeners.filter(l => l !== handler) }
  }, [])

  const setLanguage = (lang) => {
    _lang = lang
    localStorage.setItem('finku_lang', lang)
    document.documentElement.lang = lang
    _notify(lang)
  }

  return { language, setLanguage }
}

export function LanguageProvider({ children }) {
  return children
}
