import { useEffect, useRef, useState } from 'react';
import { isTurnstileConfigured, turnstileSiteKey } from '../../lib/supabase';

const TURNSTILE_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let turnstileLoader;

export default function TurnstileChallenge({ onVerify, resetKey = 0 }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!turnstileSiteKey) return undefined;

    let active = true;

    loadTurnstile()
      .then(() => {
        if (!active || !containerRef.current) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: turnstileSiteKey,
          theme: 'dark',
          size: 'flexible',
          callback: (token) => {
            setLoadError(false);
            onVerify(token);
          },
          'expired-callback': () => onVerify(''),
          'error-callback': () => {
            onVerify('');
            if (active) setLoadError(true);
          },
        });
      })
      .catch(() => {
        if (active) setLoadError(true);
      });

    return () => {
      active = false;
      if (window.turnstile && widgetIdRef.current !== null) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onVerify, resetKey]);

  if (!isTurnstileConfigured) {
    return <p className="guestbook-state">Spam protection is not configured. Signing in is currently unavailable.</p>;
  }

  return (
    <div>
      <div ref={containerRef} />
      {loadError && <p className="form-status" role="alert">Spam verification could not load. Close and reopen the form to retry.</p>}
    </div>
  );
}

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve();
  if (turnstileLoader) return turnstileLoader;

  turnstileLoader = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TURNSTILE_URL;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => {
      script.remove();
      turnstileLoader = undefined;
      reject(new Error('Turnstile failed to load.'));
    };
    document.head.append(script);
  });

  return turnstileLoader;
}
