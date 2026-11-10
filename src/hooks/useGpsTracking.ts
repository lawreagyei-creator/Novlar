import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { CollectorLocation } from '@/types';

interface UseGpsTrackingOptions {
  collectorId: string;
  requestId: string | null;
  enabled: boolean;
  isSimulated: boolean;
  simulateStart?: { lat: number; lng: number };
  simulateEnd?: { lat: number; lng: number };
}

export function useGpsTracking({
  collectorId,
  requestId,
  enabled,
  isSimulated,
  simulateStart,
  simulateEnd,
}: UseGpsTrackingOptions) {
  const [location, setLocation] = useState<CollectorLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'tracking' | 'simulating' | 'error' | 'denied'>('idle');
  const watchIdRef = useRef<number | null>(null);
  const simulateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const simulateStepRef = useRef(0);

  const updateLocationInDb = useCallback(
    async (lat: number, lng: number, accuracy?: number, heading?: number, speed?: number) => {
      const payload = {
        collector_id: collectorId,
        request_id: requestId,
        latitude: lat,
        longitude: lng,
        accuracy: accuracy ?? null,
        heading: heading ?? null,
        speed: speed ?? null,
        is_online: true,
        is_simulated: isSimulated,
        last_updated: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from('collector_locations')
        .upsert(payload, { onConflict: 'collector_id' });

      if (upsertError) {
        console.error('Location update failed:', upsertError.message);
      }

      setLocation({
        collector_id: collectorId,
        request_id: requestId,
        latitude: lat,
        longitude: lng,
        accuracy: accuracy ?? null,
        heading: heading ?? null,
        speed: speed ?? null,
        is_online: true,
        is_simulated: isSimulated,
        last_updated: new Date().toISOString(),
      });
    },
    [collectorId, requestId, isSimulated]
  );

  const startRealGps = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported on this device');
      setStatus('error');
      return;
    }

    setStatus('tracking');
    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, heading, speed } = pos.coords;
        updateLocationInDb(latitude, longitude, accuracy ?? undefined, heading ?? undefined, speed ?? undefined);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location permission denied. Enable GPS in browser settings or use simulation mode.');
          setStatus('denied');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('GPS signal unavailable. Try going outdoors or use simulation mode.');
          setStatus('error');
        } else if (err.code === err.TIMEOUT) {
          setError('GPS request timed out. Retrying...');
        } else {
          setError(err.message);
          setStatus('error');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );
  }, [updateLocationInDb]);

  const startSimulatedGps = useCallback(() => {
    if (!simulateStart || !simulateEnd) {
      setError('Simulation start and end points are required');
      setStatus('error');
      return;
    }

    setStatus('simulating');
    setError(null);
    simulateStepRef.current = 0;

    const totalSteps = 60;
    const startLat = simulateStart.lat;
    const startLng = simulateStart.lng;
    const endLat = simulateEnd.lat;
    const endLng = simulateEnd.lng;

    simulateIntervalRef.current = setInterval(() => {
      const step = simulateStepRef.current;
      if (step >= totalSteps) {
        if (simulateIntervalRef.current) clearInterval(simulateIntervalRef.current);
        return;
      }

      const progress = step / totalSteps;
      const lat = startLat + (endLat - startLat) * progress;
      const lng = startLng + (endLng - startLng) * progress;
      const heading = (Math.atan2(endLat - startLat, endLng - startLng) * 180) / Math.PI;

      updateLocationInDb(lat, lng, 15, heading, 5);
      simulateStepRef.current += 1;
    }, 2000);
  }, [simulateStart, simulateEnd, updateLocationInDb]);

  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (simulateIntervalRef.current) {
      clearInterval(simulateIntervalRef.current);
      simulateIntervalRef.current = null;
    }

    setStatus('idle');

    await supabase
      .from('collector_locations')
      .update({ is_online: false, last_updated: new Date().toISOString() })
      .eq('collector_id', collectorId);
  }, [collectorId]);

  useEffect(() => {
    if (!enabled) {
      stopTracking();
      return;
    }

    if (isSimulated) {
      startSimulatedGps();
    } else {
      startRealGps();
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (simulateIntervalRef.current) {
        clearInterval(simulateIntervalRef.current);
        simulateIntervalRef.current = null;
      }
    };
  }, [enabled, isSimulated, startRealGps, startSimulatedGps, stopTracking]);

  return { location, error, status, stopTracking };
}
