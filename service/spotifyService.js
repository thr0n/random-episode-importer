const axios = require("axios");
const querystring = require("querystring");

async function getAccessToken() {
  return new Promise(async (resolve, reject) => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const auth = clientId + ":" + clientSecret;
    const authorization = Buffer.from(auth).toString("base64");

    try {
      const response = await axios.post(
        "https://accounts.spotify.com/api/token",
        querystring.stringify({
          grant_type: "client_credentials",
        }),
        {
          headers: {
            Authorization: `Basic ${authorization}`,
          },
        }
      );
      resolve(response.data);
    } catch (err) {
      console.log('Could not retrieve access token!')
      console.log(err.stack)
      reject(err);
    }
  });
}

async function fetchArtist(token, artistId) {
  return new Promise(async (resolve) => {
    try {
      const response = await axios.get(
        `https://api.spotify.com/v1/artists/${artistId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      resolve(response.data);
    } catch (err) {
      console.log(err.stack)
    }
  });
}

function fetchAlbums(token, artistId, next, limit, offset) {
  let queryUrl = `https://api.spotify.com/v1/artists/${artistId}/albums`

  if (next) {
    queryUrl = next
  } else if (limit !== undefined && offset !== undefined) {
    queryUrl = queryUrl.concat(`?offset=${offset}&limit=${limit}&include_groups=album`)
  }

  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.get(queryUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      resolve(response.data);
    } catch (err) {
      console.log(err.stack)
      reject(err);
    }
  });
}

exports.getAccessToken = getAccessToken;
exports.fetchAlbums = fetchAlbums;
exports.fetchArtist = fetchArtist;
