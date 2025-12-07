function pad(n) {
  return String(n).padStart(2, "0");
}

export function toICSDateUTC(d) {
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

export function icsEscape(text = "") {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function getDurationMinutesByReason(reason) {
  if (reason === "Αξιολόγηση Αποτελεσμάτων") return 20;
  if (reason === "Ιατρικός Επισκέπτης") return 15;
  if (reason === "Εξέταση") return 30;
  return 30;
}

export function buildAppointmentICS({
  startDate,
  durationMinutes,
  clinicName,
  doctorName,
  doctorTitle,
  address,
  phone,
  mapUrl,
  patientName,
  reason,
  organizerEmail,
  attendeeEmail,
}) {
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const dtStart = toICSDateUTC(startDate);
  const dtEnd = toICSDateUTC(endDate);
  const dtStamp = toICSDateUTC(new Date());

  const uid =
    "apt-" +
    startDate.getTime() +
    "-" +
    Math.random().toString(36).slice(2) +
    "@dr-kollia";

  const summary = `${clinicName} — ${reason}`;
  const descriptionLines = [
    `Ιατρός: ${doctorName}${doctorTitle ? " • " + doctorTitle : ""}`,
    `Λόγος επίσκεψης: ${reason}`,
    address ? `Διεύθυνση: ${address}` : null,
    phone ? `Τηλέφωνο: ${phone}` : null,
    mapUrl ? `Χάρτης: ${mapUrl}` : null,
    "Παρακαλούμε προσέλθετε 5-10 λεπτά νωρίτερα.",
  ].filter(Boolean);

  const description = descriptionLines.join("\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dr Kollia Clinic//Appointments//EL",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${icsEscape(summary)}`,
    address ? `LOCATION:${icsEscape(address)}` : "",
    `DESCRIPTION:${icsEscape(description)}`,
    organizerEmail
      ? `ORGANIZER;CN="${icsEscape(doctorName)}":MAILTO:${organizerEmail}`
      : "",
    attendeeEmail
      ? `ATTENDEE;CN="${icsEscape(
          patientName
        )}";ROLE=REQ-PARTICIPANT;RSVP=FALSE:MAILTO:${attendeeEmail}`
      : "",
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}
