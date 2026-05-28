export const up = async (client) => {
  await client.query(`
    CREATE TABLE inspection_photos (
      id SERIAL PRIMARY KEY,
      inspection_id INTEGER NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
      photo_config_id INTEGER REFERENCES photo_configs(id),
      file_path VARCHAR(500) NOT NULL,
      original_filename VARCHAR(255) NOT NULL,
      mime_type VARCHAR(50) NOT NULL,
      file_size_bytes INTEGER NOT NULL,
      exif_date TIMESTAMPTZ,
      exif_lat DECIMAL(10, 7),
      exif_lng DECIMAL(10, 7),
      exif_available BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`CREATE INDEX idx_inspection_photos_inspection ON inspection_photos(inspection_id)`);
  await client.query(`CREATE INDEX idx_inspection_photos_created ON inspection_photos(created_at)`);
};

export const down = async (client) => {
  await client.query(`DROP TABLE IF EXISTS inspection_photos`);
};
