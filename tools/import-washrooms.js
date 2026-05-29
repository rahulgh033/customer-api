require("dotenv").config();

const fs = require("fs");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function importWashrooms() {
  try {
    const rawData = fs.readFileSync("./City_Public_Washrooms.geojson", "utf8");
    const geojson = JSON.parse(rawData);

    for (const feature of geojson.features) {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;

      const longitude = coords[0];
      const latitude = coords[1];

      const sourceId = String(props.OBJECTID || props.FID || "");
      const name = props.LANDMARKNAME || "Unknown Washroom";

      const addressParts = [
        props.STNO,
        props.STNAME,
        props.SUFFIX,
        props.POSTDIR,
      ].filter(Boolean);

      const address = addressParts.join(" ");
      const city = props.CITY || "Mississauga";

      await pool.query(
        `
        INSERT INTO public_washrooms
        (
          source_id,
          name,
          address,
          city,
          latitude,
          longitude,
          accessible,
          hours,
          open_season,
          source_url
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        `,
        [
          sourceId,
          name,
          address,
          city,
          latitude,
          longitude,
          true,
          "Unknown",
          props.PARENTDESC || "Unknown",
          "Mississauga Open Data",
        ]
      );
    }

    console.log(`Imported ${geojson.features.length} washrooms successfully.`);
  } catch (err) {
    console.error("Import failed:", err.message);
  } finally {
    await pool.end();
  }
}

importWashrooms();