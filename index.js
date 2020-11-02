const dotenv = require("dotenv");
const async = require("async");
const spotifyService = require("./service/spotifyService");
const persistenceService = require("./service/persistenceService")

const ALL_ARTISTS = require("./config/artists").artists;

dotenv.config();

const queryLatestEpisodesFor = async (accessToken, artistId) => {
    const albumSlice = await spotifyService.fetchAlbums(
      accessToken,
      artistId,
      null,
      5,
      0
    );
    persistenceService.saveAlbums(albumSlice)
}

const queryAllEpisodesFor = async (accessToken, artistId, nextSlice) => {
  return new Promise(async (resolve) => {
    const albumSlice = await spotifyService.fetchAlbums(
      accessToken,
      artistId,
      nextSlice
    );
    await persistenceService.saveAlbums(albumSlice)
    if (albumSlice.next) {
      queryAllEpisodesFor(accessToken, artistId, albumSlice.next, null);
    } else {
      resolve()
    }
  })
}

(async () => {
  try {
    const accessToken = await spotifyService.getAccessToken();
    const token = accessToken.access_token

    // TODO choose mode using env vars:
    // weekly (or monthly) mode:
    async.forEach(ALL_ARTISTS, async (artist) => {
      // TODO check if artists already exitsts in firestore
      // if true:
      queryLatestEpisodesFor(token, artist.id)
      // else:
      // const artistDetails = await spotifyService.fetchArtist(token, artist.id);
      // await persistenceService.persistArtist(artistDetails, artist.id);
      // queryAllEpsiodes(...)
    })
    
    // initial mode - assume an empty db, fetch and persist all artists and all episodes
    /* async.forEach(ALL_ARTISTS, async (artist) => {
      const artistDetails = await spotifyService.fetchArtist(token, artist.id);
      await persistenceService.persistArtist(artistDetails, artist.id);
    });
    async.forEach(ALL_ARTISTS, async (artist) => {
      queryAllEpisodesFor(token, artist.id, null)
    }); */
  } catch (error) {
    console.log(error.stack);
  }
})();
