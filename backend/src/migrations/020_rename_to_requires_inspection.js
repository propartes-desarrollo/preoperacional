export const up = async (client) => {
  await client.query(`
    ALTER TABLE collaborator_types RENAME COLUMN receives_reminder TO requires_inspection
  `);
};

export const down = async (client) => {
  await client.query(`
    ALTER TABLE collaborator_types RENAME COLUMN requires_inspection TO receives_reminder
  `);
};
