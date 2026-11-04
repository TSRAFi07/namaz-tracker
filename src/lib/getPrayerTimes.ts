
export type PrayerTimes = {
  name: string;
  start: string;
  end: string;
}[];

function formatDate(date: Date) {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();

  return `${day}-${month}-${year}`;
}

async function fetchTimings(date: string) {
  const params = new URLSearchParams({
    latitude: "23.16971",
    longitude: "89.21371",
    method: "1",
    school: "1",
    timezonestring: "Asia/Dhaka",
  });

  const response = await fetch(
    `https://api.aladhan.com/v1/timings/${date}?${params}`
  );

  if (!response.ok) {
    throw new Error("Prayer times could not be loaded.");
  }

  const result = await response.json();

  if (result.code !== 200 || !result.data?.timings) {
    throw new Error("Prayer times data is unavailable.");
  }

  return result.data.timings;
}

export async function getPrayerTimes(
  date: string
): Promise<PrayerTimes> {
  const selectedDate = new Date(`${date}T00:00:00Z`);

  const nextDate = new Date(selectedDate);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);

  const [today, tomorrow] = await Promise.all([
    fetchTimings(formatDate(selectedDate)),
    fetchTimings(formatDate(nextDate)),
  ]);

  const cleanTime = (time: string | undefined, label: string) => {
    if (!time) {
      throw new Error(`${label} time is missing from the API.`);
    }

    return time.split(" ")[0];
  };

  return [
    {
      name: "Fajr",
      start: cleanTime(today.Fajr, "Fajr"),
      end: cleanTime(today.Sunrise, "Sunrise"),
    },
    {
      name: "Dhuhr",
      start: cleanTime(today.Dhuhr, "Dhuhr"),
      end: cleanTime(today.Asr, "Asr"),
    },
    {
      name: "Asr",
      start: cleanTime(today.Asr, "Asr"),
      end: cleanTime(today.Sunset || today.Maghrib, "Sunset"),
    },
    {
      name: "Maghrib",
      start: cleanTime(today.Maghrib, "Maghrib"),
      end: cleanTime(today.Isha, "Isha"),
    },
    {
      name: "Isha",
      start: cleanTime(today.Isha, "Isha"),
      end: cleanTime(tomorrow.Fajr, "Next Fajr"),
    },
  ];
}
