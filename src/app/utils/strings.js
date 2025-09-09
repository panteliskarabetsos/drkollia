// Κράτα το κάπου κοινό (π.χ. utils/strings.js)
export function normalizeGreekName(input) {
  if (!input) return "";
  // καθάρισμα: trim & συμπίεση πολλαπλών κενών
  const cleaned = String(input).replace(/\s+/g, " ").trim();

  // πεζά με ελληνικό locale
  const lower = cleaned.toLocaleLowerCase("el-GR");

  // κεφαλαιοποίηση πρώτου γράμματος σε κάθε "λέξη" και υπο-λέξη (με παύλα)
  const title = lower
    .split(" ")
    .map((part) =>
      part
        .split("-")
        .map((sub) =>
          sub ? sub.charAt(0).toLocaleUpperCase("el-GR") + sub.slice(1) : sub
        )
        .join("-")
    )
    .join(" ");

  return title;
}
