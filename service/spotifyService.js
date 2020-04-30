const axios = require('axios')
const querystring = require('querystring')

let samples = require('../sample_responses')

async function getAccessToken() {
    return process.env.NODE_ENV === 'production' ?
        new Promise((resolve, reject) => {
            const clientId = process.env.SPOTIFY_CLIENT_ID
            const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

            const auth = clientId + ':' + clientSecret
            const authorization = Buffer.from(auth).toString('base64')

            axios
                .post(
                    'https://accounts.spotify.com/api/token',
                    querystring.stringify({
                        grant_type: 'client_credentials',
                    }), {
                        headers: {
                            Authorization: `Basic ${authorization}`,
                        },
                    }
                )
                .then(response => resolve(response.data))
                .catch(error => {
                    console.log(error)
                    reject(error)
                })
        }) :
        'dummy_token'
}

async function fetchAlbums(token, artistId, next) {
    return process.env.NODE_ENV === 'production' ?
        new Promise((resolve, reject) => {
            const queryUrl = next ? next : `https://api.spotify.com/v1/artists/${artistId}/albums`
            axios
                .get(
                    queryUrl, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                )
                .then(response => resolve(response.data))
                .catch(error => reject(error))
        }) :
        samples.sample_albums
}

exports.getAccessToken = getAccessToken
exports.fetchAlbums = fetchAlbums