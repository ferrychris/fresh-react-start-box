import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 minute fresh
      gcTime: 5 * 60_000, // keep cache around for 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
