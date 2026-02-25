import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  var location = useLocation();
  useEffect(function () {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return null;
}
```

Click **Commit changes**.

**Step 2 — Edit App.jsx:**

Go to `src/App.jsx` → click **pencil icon** → press **Ctrl+H**

**Replace 1 — Find:**
```
import Contact from './pages/public/Contact'
```
**Replace with:**
```
import Contact from './pages/public/Contact'
import ScrollToTop from './components/ScrollToTop'
```

**Replace 2 — Find:**
```
      <AuthProvider>
```
**Replace with:**
```
      <ScrollToTop />
      <AuthProvider>
