import { buildWeekendEvents, getReminders, toggleReminder, getEvents, setEvents } from "../utils/comingSoon";

describe("comingSoon", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("buildWeekendEvents returns 4 future Saturdays", () => {
    const events = buildWeekendEvents([{ title: "Mock" }]);
    expect(events.length).toBe(4);
    events.forEach((e) => {
      expect(new Date(e.dateISO).getDay()).toBe(6);
    });
  });

  test("getEvents returns [] when nothing has been persisted", () => {
    expect(getEvents()).toEqual([]);
  });

  test("setEvents persists and getEvents reads back", () => {
    const events = buildWeekendEvents([{ title: "Mock" }]);
    setEvents(events);
    expect(getEvents().length).toBe(4);
  });

  test("toggleReminder flips per id and persists", () => {
    const r0 = getReminders();
    expect(r0["weekend-2099-01-04"]).toBeFalsy();
    toggleReminder("weekend-2099-01-04");
    expect(getReminders()["weekend-2099-01-04"]).toBe(true);
    toggleReminder("weekend-2099-01-04");
    expect(getReminders()["weekend-2099-01-04"]).toBe(false);
  });
});
