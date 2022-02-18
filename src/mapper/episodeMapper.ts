import { EpisodeDetails } from "../types/Domain";
import { SpotifyEpisode } from "../types/Spotify";
import { getReleaseYearFrom } from "../util/date";

export const mapEpisode = (spotifyEpisode: SpotifyEpisode): EpisodeDetails => {
  return {
    artistId: spotifyEpisode.artists[0].id,
    artistName: spotifyEpisode.artists[0].name,
    id: spotifyEpisode.id,
    image: spotifyEpisode.images[0],
    image_small: spotifyEpisode.images[2],
    released: getReleaseYearFrom(
      spotifyEpisode.release_date,
      spotifyEpisode.release_date_precision
    ),
    title: spotifyEpisode.name,
    url: spotifyEpisode.external_urls.spotify,
  };
};
