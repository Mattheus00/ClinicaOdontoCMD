// Synthetic data only. The harness intercepts every API request; unknown requests fail closed.
export const professionals = [
  { id: "d1", name: "Dra. Ana Oliveira", specialty: "Clínica geral" },
  { id: "d2", name: "Dr. Lucas Almeida", specialty: "Ortodontia" },
];
export const procedures = [
  { id: "r1", name: "Avaliação odontológica", price: 150 },
  { id: "r2", name: "Limpeza", price: 250 },
];
export const date = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
}).format(new Date());
export const appointments = ["09:00", "10:30", "14:00"].map((time, i) => ({
  id: `a${i}`,
  patient: {
    id: `p${i}`,
    name: ["Marina Costa", "Rafael Santos", "Clara Lima"][i],
    phone: "11999990000",
  },
  professional: professionals[i % 2],
  procedure: procedures[0],
  startsAt: `${date}T${time}:00-03:00`,
  endsAt: `${date}T${time.slice(0, 2)}:30:00-03:00`,
  durationMinutes: 30,
  status: ["SCHEDULED", "PENDING", "COMPLETED"][i],
  report: "",
}));
export async function mockApi(
  page,
  { auth = false, scenario = "normal" } = {},
) {
  const state = { scenario, posts: [] };
  const paged = (content) => ({
    content,
    totalPages: 1,
    totalElements: content.length,
    number: 0,
    size: 20,
  });
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api/, "");
    let data;
    let status = 200;
    if (path === "/auth/refresh") {
      if (auth)
        data = {
          accessToken: `demo.${Buffer.from(JSON.stringify({ sub: "redesign-demo", clinic_id: "demo-clinic", role: "ADMIN", exp: 4102444800 })).toString("base64url")}.demo`,
        };
      else {
        status = 401;
        data = {};
      }
    } else if (path === "/user-preferences") data = { tutorialVersion: 999 };
    else if (path === "/staff-notifications")
      data = { unreadCount: 0, items: [] };
    else if (path === "/professionals") data = paged(professionals);
    else if (path === "/procedures") data = paged(procedures);
    else if (path === "/appointments") {
      data = paged(
        state.scenario === "empty"
          ? []
          : appointments.filter(
              (a) =>
                !url.searchParams.get("professionalId") ||
                a.professional.id === url.searchParams.get("professionalId"),
            ),
      );
      if (state.scenario === "error") status = 503;
    } else if (path === "/public/booking/demo")
      data = {
        clinicName: "Maria Alice",
        bookingSlug: "demo",
        professionals,
        procedures,
      };
    else if (path.endsWith("/availability")) {
      data = {
        date,
        slots:
          state.scenario === "empty"
            ? []
            : ["09:00", "10:00", "14:30"].map(
                (t) => `${url.searchParams.get("date")}T${t}:00-03:00`,
              ),
      };
      if (state.scenario === "error") status = 503;
    } else if (path === "/public/booking/demo/appointments") {
      const input = route.request().postDataJSON();
      state.posts.push(input);
      status = state.scenario === "conflict" ? 409 : 200;
      data =
        status === 409
          ? { message: "Este horário acabou de ser ocupado." }
          : {
              appointmentId: "demo",
              clinicName: "Maria Alice",
              professionalName: professionals[0].name,
              procedureName: procedures[0].name,
              startsAt: input.startsAt,
              patientName: input.name,
            };
    } else if (
      path.startsWith("/appointments/") &&
      path.endsWith("/reschedule")
    )
      data = { ...appointments[0], ...route.request().postDataJSON() };
    else {
      status = 404;
      data = { message: `Fixture unavailable: ${path}` };
    }
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(data),
    });
  });
  return state;
}
