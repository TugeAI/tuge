'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

interface DeviceFingerprintData {
  visitorId: string;
  confidence: number;
  components: {
    timezone?: string;
    language?: string;
    platform?: string;
    screenResolution?: string;
    colorDepth?: number;
  };
}

interface UseDeviceFingerprintReturn {
  fingerprint: DeviceFingerprintData | null;
  isLoading: boolean;
  error: string | null;
  getFingerprint: () => Promise<DeviceFingerprintData | null>;
}

const STORAGE_KEY = 'tug_device_fingerprint';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures

interface CachedFingerprint {
  data: DeviceFingerprintData;
  timestamp: number;
}

/**
 * Hook pour collecter l'empreinte de l'appareil via FingerprintJS
 * 
 * Utilise un cache en sessionStorage pour éviter de recalculer à chaque fois
 * Le fingerprint est un identifiant unique basé sur les caractéristiques du navigateur
 */
export function useDeviceFingerprint(): UseDeviceFingerprintReturn {
  const [fingerprint, setFingerprint] = useState<DeviceFingerprintData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fpPromiseRef = useRef<ReturnType<typeof FingerprintJS.load> | null>(null);

  // Récupérer du cache
  const getFromCache = useCallback((): DeviceFingerprintData | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const cached = sessionStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed: CachedFingerprint = JSON.parse(cached);
        // Vérifier si le cache est encore valide
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
          return parsed.data;
        }
        // Cache expiré, supprimer
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Erreur de parsing, ignorer
    }
    return null;
  }, []);

  // Sauvegarder en cache
  const saveToCache = useCallback((data: DeviceFingerprintData) => {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheData: CachedFingerprint = {
        data,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
    } catch {
      // Erreur de sauvegarde, ignorer
    }
  }, []);

  // Générer le fingerprint
  const generateFingerprint = useCallback(async (): Promise<DeviceFingerprintData | null> => {
    try {
      // Utiliser la même instance de FingerprintJS
      if (!fpPromiseRef.current) {
        fpPromiseRef.current = FingerprintJS.load();
      }
      
      const fp = await fpPromiseRef.current;
      const result = await fp.get();
      
      // Extraire les composants utiles pour les metadata
      const components: DeviceFingerprintData['components'] = {};
      const comps = result.components as Record<string, { value?: unknown }>;
      
      // Timezone
      if (comps.timezone?.value) {
        components.timezone = String(comps.timezone.value);
      }
      
      // Language
      if (comps.languages?.value) {
        const langs = comps.languages.value;
        components.language = Array.isArray(langs) ? (langs as string[][])[0]?.[0] : String(langs);
      }
      
      // Platform
      if (comps.platform?.value) {
        components.platform = String(comps.platform.value);
      }
      
      // Screen Resolution
      if (comps.screenResolution?.value) {
        const res = comps.screenResolution.value as number[];
        if (Array.isArray(res)) {
          components.screenResolution = `${res[0]}x${res[1]}`;
        }
      }
      
      // Color Depth
      if (comps.colorDepth?.value) {
        components.colorDepth = Number(comps.colorDepth.value);
      }
      
      const fingerprintData: DeviceFingerprintData = {
        visitorId: result.visitorId,
        confidence: result.confidence.score,
        components,
      };
      
      return fingerprintData;
      
    } catch (err) {
      console.error('[DeviceFingerprint] Error generating fingerprint:', err);
      throw err;
    }
  }, []);

  // Fonction publique pour obtenir le fingerprint
  const getFingerprint = useCallback(async (): Promise<DeviceFingerprintData | null> => {
    // Vérifier le cache d'abord
    const cached = getFromCache();
    if (cached) {
      setFingerprint(cached);
      return cached;
    }
    
    // Générer un nouveau fingerprint
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await generateFingerprint();
      if (data) {
        setFingerprint(data);
        saveToCache(data);
      }
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getFromCache, generateFingerprint, saveToCache]);

  // Charger au montage
  useEffect(() => {
    // Vérifier le cache d'abord
    const cached = getFromCache();
    if (cached) {
      setFingerprint(cached);
      setIsLoading(false);
      return;
    }
    
    // Générer un nouveau fingerprint
    generateFingerprint()
      .then((data) => {
        if (data) {
          setFingerprint(data);
          saveToCache(data);
        }
      })
      .catch((err) => {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [getFromCache, generateFingerprint, saveToCache]);

  return {
    fingerprint,
    isLoading,
    error,
    getFingerprint,
  };
}

export default useDeviceFingerprint;






