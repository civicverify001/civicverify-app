// src/components/CanonicalUrl.jsx
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function CanonicalUrl({ override }) {
  const { pathname } = useLocation()
  const base = 'https://civicverify.org'
  const url = override || (base + pathname)

  useEffect(() => {
    let tag = document.querySelector("link[rel='canonical']")
    if (!tag) {
      tag = document.createElement('link')
      tag.setAttribute('rel', 'canonical')
      document.head.appendChild(tag)
    }
    tag.setAttribute('href', url)
    return () => tag.setAttribute('href', base)
  }, [url])

  return null
}
