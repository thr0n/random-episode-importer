const dotenv = require("dotenv");
const fs = require("fs");
const async = require("async");

const spotifyService = require("./service/spotifyService");

const ALL_ARTISTS = require("./config/artists").artists;
const OUTPUT_DIR = "./out/";

dotenv.config();

const saveAlbums = async (albumSlice) => {
  albumSlice.items.map((slice) => {
    const album = {
      episodeId: slice.id,
      artistName: slice.artists[0].name,
      artistId: slice.artists[0].id,
      title: slice.name,
      url: slice.external_urls.spotify,
      image: slice.images[0],
    };

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

const handleArtist = async (accessToken, artistId, nextSlice) => {
  const albumSlice = await spotifyService.fetchAlbums(
    accessToken,
    artistId,
    nextSlice
  );
  await saveAlbums(albumSlice);

  const artistDetails = await spotifyService.fetchArtist(accessToken, artistId);
  const ad = {
    id: artistDetails.id,
    name: artistDetails.name,
    image: {
      height: artistDetails.images[0].height,
      url: artistDetails.images[0].url,
      width: artistDetails.images[0].width,
    },
  };
  fs.writeFile(
    OUTPUT_DIR + "artists/" + ad.id + ".json",
    JSON.stringify(ad),
    "utf8",
    (err) => {
      if (err) {
        console.log("Error writing file: " + err);
        return console.log(err);
      }
    }
  );

  if (albumSlice.next) {
    handleArtist(accessToken, artistId, albumSlice.next);
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
      await handleArtist(accessToken.access_token, artist.id);
    });
  } catch (error) {
    console.log(error.stack);
  }
})();
