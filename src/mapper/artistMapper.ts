import { ArtistDetails } from "../types/Domain";
import { SpotifyArtist } from "../types/Spotify";

export const mapArtist = (spotifyArtist: SpotifyArtist): ArtistDetails => {
  return {
    id: spotifyArtist.id,
    external_urls: spotifyArtist.external_urls.spotify,
    href: spotifyArtist.href,
    name: spotifyArtist.name,
    image: {
      height: spotifyArtist.images[2].height,
      url: spotifyArtist.images[2].url,
      width: spotifyArtist.images[2].width,
    },
  };
};
