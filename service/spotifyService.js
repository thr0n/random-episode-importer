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
      reject(err);
    }
  });
}

async function fetchArtist(token, artistId) {
  return new Promise(async (resolve) => {
    const response = await axios.get(
      `https://api.spotify.com/v1/artists/${artistId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    resolve(response.data);
  });
}

function fetchAlbums(token, artistId, next) {
  return new Promise(async (resolve, reject) => {
    const queryUrl = next
      ? next
      : `https://api.spotify.com/v1/artists/${artistId}/albums`;
    try {
      const response = await axios.get(queryUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      resolve(response.data);
    } catch (err) {
      reject(err);
    }
  });
}

exports.getAccessToken = getAccessToken;
exports.fetchAlbums = fetchAlbums;
exports.fetchArtist = fetchArtist;
