// src/components/SEO.jsx — Dynamic page-level SEO tags
import { useEffect } from 'react';

var SITE_NAME = 'CivicVerify';
var DEFAULT_TITLE = 'CivicVerify: Identity-Verified Civic Polling | Real Citizen Impact';
var DEFAULT_DESC = 'CivicVerify connects identity-verified citizens with organizations seeking authentic public opinion. Take verified surveys, join community discussions, and make your voice count.';
var DEFAULT_IMAGE = 'https://civicverify.org/og-image.png';
var BASE_URL = 'https://civicverify.org';

export default function SEO(props) {
  var title = props.title ? props.title + ' | ' + SITE_NAME : DEFAULT_TITLE;
  var description = props.description || DEFAULT_DESC;
  var image = props.image || DEFAULT_IMAGE;
  var url = props.path ? BASE_URL + props.path : BASE_URL;

  useEffect(function() {
    // Title
    document.title = title;

    // Helper to set/create meta tags
    function setMeta(attr, key, content) {
      var el = document.querySelector('meta[' + attr + '="' + key + '"]');
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    }

    // Standard meta
    setMeta('name', 'description', description);

    // Open Graph
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:type', props.type || 'website');
    setMeta('property', 'og:site_name', SITE_NAME);

    // Twitter Card
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', image);
  }, [title, description, image, url]);

  return null;
}
