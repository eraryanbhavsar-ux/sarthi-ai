import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Ensures pages always load at the top when navigating between routes.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  }, [pathname]);

  return null;
}
