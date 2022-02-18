import { Image } from "./Spotify";

export interface ArtistDetails {
  external_urls: string;
  href: string;
  id: string;
  image: {
    height: number;
    url: string;
    width: number;
  };
  name: string;
}

export interface EpisodeDetails {
  id: string;
  artistName: string;
  artistId: string;
  title: string;
  url: string;
  image: Image;
  image_small: Image;
  released: string;
}
