import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  var location = useLocation();
  useEffect(function () {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return null;
}
