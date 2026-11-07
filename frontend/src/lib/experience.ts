export const isUxDemo = import.meta.env.MODE === "ux-demo";
// Live links require a clinic-provided slug.
export const bookingPath = isUxDemo
  ? "/agendar/demonstracao"
  : import.meta.env.VITE_PUBLIC_BOOKING_SLUG
    ? `/agendar/${encodeURIComponent(import.meta.env.VITE_PUBLIC_BOOKING_SLUG)}`
    : "/agendar";
