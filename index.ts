const dotenv = require("dotenv");
const spotifyService = require("./src/service/spotifyService");
import {
  createTableIfNotExists,
  artistExists,
  persistArtist,
  persistEpisode,
} from "./src/service/dynamoService";
import { getReleaseYearFrom } from "./src/util/date";
import {
  SpotifyEpisode,
  SpotifyArtist,
  SpotifyEpisodeResponse,
} from "./src/types/Spotify";
import { ArtistDetails, EpisodeDetails } from "./src/types/Domain";
import { mapArtist } from "./src/mapper/artistMapper";
import { mapEpisode } from "./src/mapper/episodeMapper";
import {
  artistTableParams,
  episodeTableParams,
} from "./src/config/dynamoTables";

const ALL_ARTISTS = require("./src/config/artists").artists;
const MINIMAL_TRACK_COUNT = 20;

dotenv.config();

const queryLatestEpisodesFor = async (
  accessToken,
  artistId
): Promise<SpotifyEpisodeResponse> => {
  const albumSlice = await spotifyService.fetchAlbums(
    accessToken,
    artistId,
    null,
    5,
    0
  );
  return albumSlice;
};

const queryAllEpisodesFor = async (
  accessToken: string,
  artistId: string,
  nextSlice: string | null = null,
  acc: SpotifyEpisode[] = []
): Promise<SpotifyEpisode[]> => {
  const albumSlice: SpotifyEpisodeResponse = await spotifyService.fetchAlbums(
    accessToken,
    artistId,
    nextSlice
  );

  if (albumSlice.next) {
    return queryAllEpisodesFor(accessToken, artistId, albumSlice.next, [
      ...acc,
      ...albumSlice.items,
    ]);
  }

  return acc;
};

const addLatestEpisodes = async (token: string, artistId: string) => {
  const latestEpisodes = await queryLatestEpisodesFor(token, artistId);

  const albums = latestEpisodes.items.filter(
    (item) => item.total_tracks >= MINIMAL_TRACK_COUNT
  );

  const entities = albums.map((album) => {
    return {
      id: album.id,
      artistId: album.artists[0].id,
      artistName: album.artists[0].name,
      image: album.images[0],
      image_small: album.images[2],
      released: getReleaseYearFrom(
        album.release_date,
        album.release_date_precision
      ),
      title: album.name,
      url: album.external_urls.spotify,
    };
  });

  entities.forEach((episode) => {
    persistEpisode(episode);
  });
};

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const addAllEpisodes = async (
  artist: ArtistDetails,
  token: string
): Promise<void> => {
  return new Promise(async (resolve) => {
    console.log("We don't know " + artist.name + " yet :(");
    const spotifyArtist: SpotifyArtist = await spotifyService.fetchArtist(
      token,
      artist.id
    );
    const artistDetails: ArtistDetails = mapArtist(spotifyArtist);
    await persistArtist(artistDetails);

    const allEpisodes = await queryAllEpisodesFor(token, spotifyArtist.id);
    const episodes: EpisodeDetails[] = allEpisodes.map((e) => mapEpisode(e));
    console.log(`Persisting ${episodes.length} episodes...`);

    /* Chunk episodes and sleep 2000 ms in order to avoid througput exception */
    let i,
      j,
      temporary,
      chunk = 10;
    for (i = 0, j = episodes.length; i < j; i += chunk) {
      temporary = episodes.slice(i, i + chunk);
      temporary.forEach(async (episode) => {
        await persistEpisode(episode);
      });
      sleep(2000);
    }
    resolve();
  });
};

const handleArtists = async (token: string) => {
  for (let [_, artist] of ALL_ARTISTS.entries()) {
    const knownArtist = await artistExists(artist.id);
    if (knownArtist === undefined) {
      console.log("Unknown artist " + artist.id + ", persisting all episodes.");
      await addAllEpisodes(artist, token);
    } else {
      console.log(
        artist.name + " already exists, persisting latest episodes only."
      );
      addLatestEpisodes(token, artist.id);
    }
  }
};

(async () => {
  try {
    const accessToken = await spotifyService.getAccessToken();
    const token = accessToken.access_token;

    await createTableIfNotExists(artistTableParams);
    await createTableIfNotExists(episodeTableParams);
    await handleArtists(token);
  } catch (error) {
    console.log(error.stack);
  }
})();
