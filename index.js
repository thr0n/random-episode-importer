const dotenv = require("dotenv");
const fs = require("fs");
const async = require("async");
const spotifyService = require("./service/spotifyService");

const ALL_ARTISTS = require("./config/artists").artists;
const OUTPUT_DIR = "./out/";

dotenv.config();

const admin = require("firebase-admin");
const serviceAccount = require("./.secrets/sa.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL,
});

const db = admin.firestore();

const saveAlbums = async (albumSlice) => {
  albumSlice.items.map(async (slice) => {
    const episodeId = slice.id;
    const album = {
      episodeId,
      artistName: slice.artists[0].name,
      artistId: slice.artists[0].id,
      title: slice.name,
      url: slice.external_urls.spotify,
      image: slice.images[0],
    };

    console.log("Saving episode " + episodeId);
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
    );
  });
};

const persistArtist = async (accessToken, artistId) => {
  const artistDetails = await spotifyService.fetchArtist(accessToken, artistId);
  const ad = {
    artistId: artistId,
    name: artistDetails.name,
    image: {
      height: artistDetails.images[0].height,
      url: artistDetails.images[0].url,
      width: artistDetails.images[0].width,
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

const persistEpisodes = async (accessToken, artistId, nextSlice) => {
  const albumSlice = await spotifyService.fetchAlbums(
    accessToken,
    artistId,
    nextSlice
  );
  await saveAlbums(albumSlice);

  if (albumSlice.next) {
    persistEpisodes(accessToken, artistId, albumSlice.next);
  }
};

(async () => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }
  if (!fs.existsSync(OUTPUT_DIR + "artists")) {
    fs.mkdirSync(OUTPUT_DIR + "artists");
  }

  try {
    const accessToken = await spotifyService.getAccessToken();
    async.forEach(ALL_ARTISTS, async (artist) => {
      await persistArtist(accessToken.access_token, artist.id);
    });
    async.forEach(ALL_ARTISTS, async (artist) => {
      await persistEpisodes(accessToken.access_token, artist.id);
    });
  } catch (error) {
    console.log(error.stack);
  }
})();
