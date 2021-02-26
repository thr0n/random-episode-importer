const dotenv = require('dotenv')
const async = require('async')
const spotifyService = require('./service/spotifyService')
const persistenceService = require('./service/persistenceService')

const ALL_ARTISTS = require('./config/artists').artists
const MINIMAL_TRACK_COUNT = 20

dotenv.config()

const filterEpisodesByTrackCount = (albumSlice, trackCount) =>
  (albumSlice.items = albumSlice.items.filter(
    (item) => item.total_tracks >= trackCount,
  ))

const queryLatestEpisodesFor = async (accessToken, artistId) => {
  const albumSlice = await spotifyService.fetchAlbums(
    accessToken,
    artistId,
    null,
    5,
    0,
  )
  filterEpisodesByTrackCount(albumSlice, MINIMAL_TRACK_COUNT)
  await persistenceService.saveAlbums(albumSlice)
}

const queryAllEpisodesFor = async (accessToken, artistId, nextSlice) => {
  return new Promise(async (resolve) => {
    const albumSlice = await spotifyService.fetchAlbums(
      accessToken,
      artistId,
      nextSlice,
    )
    filterEpisodesByTrackCount(albumSlice, MINIMAL_TRACK_COUNT)
    await persistenceService.saveAlbums(albumSlice)

    albumSlice.next
      ? queryAllEpisodesFor(accessToken, artistId, albumSlice.next)
      : resolve()
  })
}

;(async () => {
  try {
    const accessToken = await spotifyService.getAccessToken()
    const token = accessToken.access_token

    if (process.env.INIT_DB) {
      // initial mode - assume an empty db, fetch and persist all artists and all episodes
      async.forEach(ALL_ARTISTS, async (artist) => {
        const artistDetails = await spotifyService.fetchArtist(token, artist.id)
        await persistenceService.persistArtist(artistDetails, artist.id)
      })
      async.forEach(ALL_ARTISTS, async (artist) => {
        queryAllEpisodesFor(token, artist.id, null)
      })
    } else {
      // weekly (or monthly) mode
      async.forEach(ALL_ARTISTS, async (artist) => {
        const artistDetails = await spotifyService.fetchArtist(token, artist.id)
        const response = await persistenceService.getArtistRef(artist.id)
        await persistenceService.persistArtist(artistDetails, artist.id)

        if (response === null) {
          queryAllEpisodesFor(token, artist.id, null)
        } else {
          queryLatestEpisodesFor(token, artist.id)
        }
      })
    }
  } catch (error) {
    console.log(error.stack)
  }
})()
