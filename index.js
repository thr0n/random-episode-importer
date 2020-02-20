const http = require('http');
const axios = require('axios')
const querystring = require('querystring');
const dotenv = require('dotenv');

let samples = require('./sample_responses')

const hostname = '127.0.0.1';
const port = 3001;

dotenv.config();

const server = http.createServer(function (req, res) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello World\n');
});

async function getAccessToken() {
    return (process.env.NODE_ENV === 'production')
        ? new Promise((resolve, reject) => {
            const clientId = process.env.SPOTIFY_CLIENT_ID
            const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

            const auth = clientId + ":" + clientSecret;
            const authorization = Buffer.from(auth).toString('base64')

            axios.post("https://accounts.spotify.com/api/token",
                querystring.stringify({ grant_type: 'client_credentials' }),
                {
                    headers: {
                        Authorization: `Basic ${authorization}`
                    }
                })
                .then(response => resolve(response.data))
                .catch(error => {
                    console.log(error)
                    reject(error)
                })
        })
        : 'dummy_token'
}

async function fetchAlbums(token, artistId, offset) {
    return (process.env.NODE_ENV === 'production')
        ? new Promise((resolve, reject) => {
            axios.get(`https://api.spotify.com/v1/artists/${artistId}/albums`,
                { headers: { Authorization: `Bearer ${token}` } })
                .then(response => resolve(response.data))
                .catch(error => reject(error))
        })
        : samples.sample_albums
}

server.listen(port, hostname, async function () {
    console.log('Server running at http://' + hostname + ':' + port + '/');

    const accessToken = await getAccessToken()

    const token = accessToken.access_token
    const albumSlice = await fetchAlbums(token, '3meJIgRw7YleJrmbpbJK6S')

    /*
     * TODO:
     * - configure the formatter or install prettier... 
     * - extract the artist id to lookup table or something alike (maybe there will be more artists in the future!)
     * - move the axios calls to a Spotify service
     * - fetch all albums by "Die drei ???" (check the given 'total' as well as the used 'limit')
     * - extract the relevant information (title, image url, etc.)
     * - find a place (in the cloud) to store the albums
     * - persist the albums
     */
});