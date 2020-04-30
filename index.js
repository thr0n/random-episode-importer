const dotenv = require('dotenv');
const fs = require('fs');

const spotifyService = require('./service/spotifyService')

const dir = './out/'

dotenv.config();

const saveAlbums = async (albumSlice) => {
    albumSlice.items.map(slice => {
        const album = {
            id: slice.id,
            artist: slice.artists[0].name,
            title: slice.name,
            url: slice.external_urls.spotify,
            image: slice.images[0]
        }
        fs.writeFile(dir + '/' + slice.id + '.json', JSON.stringify(album), "utf8", (err) => {
            if (err) {
                console.log('Error writing file: ' + err)
                return console.log(err)
            }
        })
    })
}

const handleArtist = async (accessToken, artist) => {
    const albumSlice = await spotifyService.fetchAlbums(accessToken.access_token, artist.id)
    await saveAlbums(albumSlice)
    let { next } = albumSlice

    while (next != null) {
        console.log("Still something to do for: " + artist.name)
        const albumSlice = await spotifyService.fetchAlbums(accessToken.access_token, artist.id, next)
        await saveAlbums(albumSlice)
        next = albumSlice.next
        console.log("next = " + next)
    }
    console.log("We are done!")
}

const doIt = async () => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    const accessToken = await spotifyService.getAccessToken()
    const allArtists = require('./config/artists').artists

    allArtists.forEach(async (artist) => {
        handleArtist(accessToken, artist)
    })
}

console.log("Hello!")
doIt()
