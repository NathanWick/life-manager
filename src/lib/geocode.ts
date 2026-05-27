/** Reverse geocode via OpenStreetMap Nominatim (no API key). */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("format", "json");
    url.searchParams.set("zoom", "14");

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "LifeQuest/1.0 (personal life manager)" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address;
    if (!addr) return null;

    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.suburb ||
      addr.neighbourhood;
    const region = addr.state || addr.region;
    if (city && region) return `${city}, ${region}`;
    if (city) return city;
    if (region) return region;
    return data.display_name?.split(",").slice(0, 2).join(",") || null;
  } catch {
    return null;
  }
}
