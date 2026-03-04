// src/components/JsonLd.jsx — Structured data for rich Google results
import { useEffect } from 'react';

// Organization schema — add to Landing page
export function OrganizationSchema() {
  useEffect(function() {
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'org-schema';
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "CivicVerify",
      "url": "https://civicverify.org",
      "logo": "https://civicverify.org/icons/icon-512x512.png",
      "description": "Identity-verified civic engagement platform connecting verified citizens with organizations seeking authentic public opinion through polls, surveys, and community discussions.",
      "foundingDate": "2026",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Indianapolis",
        "addressRegion": "IN",
        "addressCountry": "US"
      },
      "sameAs": [],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "url": "https://civicverify.org/contact"
      }
    });
    // Remove old one first
    var old = document.getElementById('org-schema');
    if (old) old.remove();
    document.head.appendChild(script);
    return function() { script.remove(); };
  }, []);
  return null;
}

// FAQ schema — add to FAQ page (makes FAQ appear directly in Google results)
export function FAQSchema(props) {
  var faqs = props.faqs || [];
  useEffect(function() {
    if (faqs.length === 0) return;
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'faq-schema';
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(function(f) {
        return {
          "@type": "Question",
          "name": f.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": f.answer
          }
        };
      })
    });
    var old = document.getElementById('faq-schema');
    if (old) old.remove();
    document.head.appendChild(script);
    return function() { script.remove(); };
  }, [faqs]);
  return null;
}

// WebSite schema with search — add to Landing page
export function WebSiteSchema() {
  useEffect(function() {
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'website-schema';
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "CivicVerify",
      "url": "https://civicverify.org",
      "description": "Identity-verified civic engagement platform. One person, one verified voice.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://civicverify.org/results?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    });
    var old = document.getElementById('website-schema');
    if (old) old.remove();
    document.head.appendChild(script);
    return function() { script.remove(); };
  }, []);
  return null;
}

// BreadcrumbList schema — add to inner pages
export function BreadcrumbSchema(props) {
  var items = props.items || [];
  useEffect(function() {
    if (items.length === 0) return;
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'breadcrumb-schema';
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items.map(function(item, i) {
        return {
          "@type": "ListItem",
          "position": i + 1,
          "name": item.name,
          "item": item.url
        };
      })
    });
    var old = document.getElementById('breadcrumb-schema');
    if (old) old.remove();
    document.head.appendChild(script);
    return function() { script.remove(); };
  }, [items]);
  return null;
}

// Article schema — for blog posts
export function ArticleSchema(props) {
  useEffect(function() {
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'article-schema';
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": props.title,
      "description": props.description || '',
      "image": props.image || 'https://civicverify.org/og-image.png',
      "datePublished": props.published,
      "dateModified": props.modified || props.published,
      "author": {
        "@type": "Organization",
        "name": "CivicVerify"
      },
      "publisher": {
        "@type": "Organization",
        "name": "CivicVerify",
        "logo": {
          "@type": "ImageObject",
          "url": "https://civicverify.org/icons/icon-512x512.png"
        }
      }
    });
    var old = document.getElementById('article-schema');
    if (old) old.remove();
    document.head.appendChild(script);
    return function() { script.remove(); };
  }, [props.title]);
  return null;
}
