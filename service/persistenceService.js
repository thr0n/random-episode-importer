const fs = require("fs");
const dateFns = require("date-fns")
const admin = require("firebase-admin");

const serviceAccount = require("../.secrets/sa.json");
const OUTPUT_DIR = "./out/";

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}
if (!fs.existsSync(OUTPUT_DIR + "artists")) {
    fs.mkdirSync(OUTPUT_DIR + "artists");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL,
});

const db = admin.firestore();

async function saveAlbums(albumSlice){
  if (albumSlice.length === 0) return 
    albumSlice.items.map(async (slice) => {
      const episodeId = slice.id;
      const album = {
        episodeId,
        artistName: slice.artists[0].name,
        artistId: slice.artists[0].id,
        title: slice.name,
        url: slice.external_urls.spotify,
        image: slice.images[0],
        image_small: slice.images[2],
        released: getReleaseYearFrom(slice.release_date, slice.release_date_precision)
      };

      process.env.WRITE_FIRESTORE &&
        (await db.collection("episode").doc(episodeId).set(album));

      fs.writeFile(
        OUTPUT_DIR + "/" + slice.id + ".json",
        JSON.stringify(album),
        "utf8",
        (err) => {
          if (err) {
            console.log("Error writing file: " + err);
            return console.log(err);
          }
        }
      )
    })
  };
  
  function getReleaseYearFrom(releaseDate, precision) {
    const dateFormat = 'yyyy-MM-dd';
    if (precision !== 'year' && precision !== 'day') {
      throw new Error(`Unknown precision: ${precision}! Aborting`)
    }
  
    if (releaseDate !== undefined) {
      if (precision === 'day') {
        const dateArray = releaseDate.split('-')
        return dateFns.format(new Date(dateArray[0], dateArray[1], dateArray[2]), dateFormat)
      } else {
        return dateFns.format(new Date(releaseDate, 1, 1), dateFormat)
      }
    }
  }

async function persistArtist(artistDetails, artistId) {
    const ad = {
        artistId: artistId,
        name: artistDetails.name,
        image: {
        height: artistDetails.images[2].height,
        url: artistDetails.images[2].url,
        width: artistDetails.images[2].width,
        },
    };
    console.log("Saving artist " + artistId);
    process.env.WRITE_FIRESTORE &&
        (await db.collection("artist").doc(artistId).set(ad));
    fs.writeFile(
        OUTPUT_DIR + "artists/" + artistDetails.id + ".json",
        JSON.stringify(ad),
        "utf8",
        (err) => {
        if (err) {
            console.log("Error writing file: " + err);
            return console.log(err);
        }
        }
    );
  };

exports.persistArtist = persistArtist
exports.saveAlbums = saveAlbums
