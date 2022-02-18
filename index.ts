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

const ALL_ARTISTS = require("./config/artists").artists;
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
    (it) => it.total_tracks >= MINIMAL_TRACK_COUNT
  );

  const entities = albums.map((it) => {
    return {
      id: it.id,
      artistId: it.artists[0].id,
      artistName: it.artists[0].name,
      image: it.images[0],
      image_small: it.images[2],
      released: getReleaseYearFrom(it.release_date, it.release_date_precision),
      title: it.name,
      url: it.external_urls.spotify,
    };
  });

  entities.forEach((episode) => {
    persistEpisode(episode);
  });
};

(async () => {
  try {
    const accessToken = await spotifyService.getAccessToken();
    const token = accessToken.access_token;

    await createTableIfNotExists(artistTableParams);
    await createTableIfNotExists(episodeTableParams);

    ALL_ARTISTS.forEach(async (artist) => {
      const knownArtist = await artistExists(artist.id);
      if (knownArtist === undefined) {
        // do initial import
        console.log("We don't know " + artist.name + " yet :(");

        const spotifyArtist: SpotifyArtist = await spotifyService.fetchArtist(
          token,
          artist.id
        );

        console.log("Id of " + artist.name + " is: " + spotifyArtist.id);
        const artistDetails: ArtistDetails = mapArtist(spotifyArtist);
        await persistArtist(artistDetails);

        const allEpisodes = await queryAllEpisodesFor(token, spotifyArtist.id);
        const episodes: EpisodeDetails[] = allEpisodes.map((e) =>
          mapEpisode(e)
        );
        console.log(`Persisting ${episodes.length} episodes...`);

        episodes.forEach(async (episode) => {
          await persistEpisode(episode);
        });
      } else {
        // persists latest episodes only
        console.log(artist.name + " already exists!");
        addLatestEpisodes(token, artist.id);
      }
    });
  } catch (error) {
    console.log(error.stack);
  }
})();
