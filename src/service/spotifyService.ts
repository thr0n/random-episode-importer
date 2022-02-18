import { SpotifyArtist, SpotifyEpisodeResponse } from "../types/Spotify";

const axios = require("axios");
const querystring = require("querystring");

const getAccessToken = async () => {
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
      console.log("Could not retrieve access token!");
      console.log(err.stack);
      reject(err);
    }
  });
};

const fetchArtist = async (token, artistId): Promise<SpotifyArtist> => {
  return new Promise(async (resolve, reject) => {
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
      reject(err.stack);
    }
  });
};

const fetchAlbums = async (
  token,
  artistId,
  next,
  limit,
  offset
): Promise<SpotifyEpisodeResponse> => {
  const queryUrl = deriveQueryUrl(
    `https://api.spotify.com/v1/artists/${artistId}/albums`,
    next,
    limit,
    offset
  );

  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.get(queryUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      resolve(response.data);
    } catch (err) {
      console.log(err.stack);
      reject(err);
    }
  });
};

const deriveQueryUrl = (
  url: string,
  next?: string,
  limit?: number,
  offset?: number
): string => {
  if (!!next) {
    return next;
  }
  if (limit > 0 && offset >= 0) {
    return url.concat(`?offset=${offset}&limit=${limit}&include_groups=album`);
  }
  return url;
};

module.exports = {
  getAccessToken,
  fetchArtist,
  fetchAlbums,
};
