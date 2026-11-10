import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { CollectorLocation } from '@/types';

export function useCollectorLocation(collectorId: string | null | undefined, enabled: boolean = true) {
  const [location, setLocation] = useState<CollectorLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!collectorId || !enabled) {
      setLocation(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const channel = supabase
      .channel(`collector-location-${collectorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collector_locations',
          filter: `collector_id=eq.${collectorId}`,
        },
        (payload) => {
          const newLocation = payload.new as CollectorLocation;
          setLocation(newLocation);
          setLoading(false);
        }
      )
      .subscribe();

    supabase
      .from('collector_locations')
      .select('*')
      .eq('collector_id', collectorId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setLocation(data as CollectorLocation);
        }
        setLoading(false);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [collectorId, enabled]);

  return { location, loading };
}
