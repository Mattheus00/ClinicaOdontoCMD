import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';

export type BookingProfessional = {
  id: string;
  name: string;
  specialty?: string | null;
};

export type BookingProcedure = {
  id: string;
  name: string;
  price: number;
};

export type BookingPage = {
  clinicName: string;
  bookingSlug: string;
  professionals: BookingProfessional[];
  procedures: BookingProcedure[];
};

export type BookingLink = {
  slug: string;
  path: string;
  caption: string;
  clinicName: string;
};

export type PublicBookInput = {
  name: string;
  phone: string;
  email?: string;
  professionalId: string;
  procedureId: string;
  startsAt: string;
  notes?: string;
};

export type PublicBookingConfirmation = {
  appointmentId: string;
  clinicName: string;
  professionalName: string;
  procedureName: string;
  startsAt: string;
  patientName: string;
};

export function useBookingLink() {
  return useQuery({
    queryKey: ['booking-link'],
    queryFn: async () => (await api.get<BookingLink>('/clinics/me/booking-link')).data,
  });
}

export function useRegenerateBookingLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post<BookingLink>('/clinics/me/booking-link/regenerate')).data,
    onSuccess: (data) => queryClient.setQueryData(['booking-link'], data),
  });
}

export function usePublicBookingPage(slug: string | undefined) {
  return useQuery({
    queryKey: ['public-booking', slug],
    enabled: Boolean(slug),
    queryFn: async () => (await api.get<BookingPage>(`/public/booking/${slug}`)).data,
    retry: false,
  });
}

export function usePublicAvailability(slug: string | undefined, professionalId: string, date: string) {
  return useQuery({
    queryKey: ['public-availability', slug, professionalId, date],
    enabled: Boolean(slug && professionalId && date),
    queryFn: async () =>
      (
        await api.get<{ date: string; slots: string[] }>(`/public/booking/${slug}/availability`, {
          params: { professionalId, date },
        })
      ).data,
  });
}

export function usePublicBook(slug: string | undefined) {
  return useMutation({
    mutationFn: async (input: PublicBookInput) =>
      (await api.post<PublicBookingConfirmation>(`/public/booking/${slug}/appointments`, input)).data,
  });
}
