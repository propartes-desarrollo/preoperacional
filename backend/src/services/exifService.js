import exifr from 'exifr';

export async function extractExif(buffer) {
  try {
    const parsed = await exifr.parse(buffer, {
      pick: ['DateTimeOriginal', 'GPSLatitude', 'GPSLongitude'],
      translateValues: true,
    });

    if (!parsed) return { exif_available: false, exif_date: null, exif_lat: null, exif_lng: null };

    const gps = await exifr.gps(buffer).catch(() => null);

    return {
      exif_available: !!(parsed.DateTimeOriginal || gps),
      exif_date: parsed.DateTimeOriginal instanceof Date ? parsed.DateTimeOriginal.toISOString() : null,
      exif_lat: gps?.latitude ?? null,
      exif_lng: gps?.longitude ?? null,
    };
  } catch {
    return { exif_available: false, exif_date: null, exif_lat: null, exif_lng: null };
  }
}
