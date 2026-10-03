// Date helpers that use the device's LOCAL date (India time on your phone),
// not UTC. `new Date().toISOString()` always gives the UTC date, which is
// "yesterday" between 12:00 AM and 5:30 AM IST.

function pad(n) {
  return String(n).padStart(2, "0");
}

// Any Date object -> "YYYY-MM-DD" using the local calendar day
export function toLocalISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Today's local date -> "2026-10-03"
export function todayLocal() {
  return toLocalISODate(new Date());
}

// Current local month -> "2026-10"
export function currentMonthLocal() {
  return todayLocal().slice(0, 7);
}
