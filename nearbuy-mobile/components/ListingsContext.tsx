import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/lib/AuthContext';
import {
  type ApiListing,
  type CreateListingInput,
  listingsApi,
  type ListingStatus,
  type ListingType,
} from '@/lib/api';
import type { Mode } from '@/lib/theme';

export const MODE_TO_LISTING_TYPE: Record<Mode, ListingType> = {
  shop: 'GOOD',
  services: 'SERVICE',
  rent: 'RENTAL',
};

export const LISTING_TYPE_TO_MODE: Record<ListingType, Mode> = {
  GOOD: 'shop',
  SERVICE: 'services',
  RENTAL: 'rent',
};

interface ListingsContextValue {
  listings: ApiListing[];
  myListings: ApiListing[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createListing: (input: CreateListingInput) => Promise<ApiListing>;
  setListingStatus: (listing: ApiListing, status: ListingStatus) => Promise<ApiListing>;
  removeListing: (listing: ApiListing) => Promise<void>;
  findListing: (id: number) => ApiListing | undefined;
  draftCategory: string;
  setDraftCategory: (category: string) => void;
}

const ListingsContext = createContext<ListingsContextValue | null>(null);

export function ListingsProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [listings, setListings] = useState<ApiListing[]>([]);
  const [myListings, setMyListings] = useState<ApiListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftCategory, setDraftCategory] = useState('');

  const refresh = useCallback(async () => {
    if (!token) {
      setListings([]);
      setMyListings([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [all, mine] = await Promise.all([listingsApi.all(token), listingsApi.mine(token)]);
      setListings(all);
      setMyListings(mine);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load listings');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<ListingsContextValue>(
    () => ({
      listings,
      myListings,
      isLoading,
      error,
      refresh,
      createListing: async (input) => {
        if (!token) throw new Error('Log in to create a listing');
        const created = await listingsApi.create(token, input);
        setListings((current) => [created, ...current]);
        setMyListings((current) => [created, ...current]);
        return created;
      },
      setListingStatus: async (listing, status) => {
        if (!token) throw new Error('Log in to update a listing');
        const updated = await listingsApi.setStatus(token, listing.id, status);
        setMyListings((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setListings((current) => {
          const without = current.filter((item) => item.id !== updated.id);
          return updated.status === 'ACTIVE' ? [updated, ...without] : without;
        });
        return updated;
      },
      removeListing: async (listing) => {
        if (!token) throw new Error('Log in to delete a listing');
        await listingsApi.remove(token, listing.id);
        setListings((current) => current.filter((item) => item.id !== listing.id));
        setMyListings((current) => current.filter((item) => item.id !== listing.id));
      },
      findListing: (id) =>
        listings.find((listing) => listing.id === id) ?? myListings.find((listing) => listing.id === id),
      draftCategory,
      setDraftCategory,
    }),
    [listings, myListings, isLoading, error, refresh, token, draftCategory]
  );

  return <ListingsContext.Provider value={value}>{children}</ListingsContext.Provider>;
}

export function useListings(): ListingsContextValue {
  const ctx = useContext(ListingsContext);
  if (!ctx) throw new Error('useListings must be used within a <ListingsProvider>');
  return ctx;
}
