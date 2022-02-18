export interface Image {
  height: number;
  url: string;
  width: number;
}

export interface SpotifyArtist {
  external_urls: {
    spotify: string;
  };
  images: Image[];
  href: string;
  id: string;
  name: string;
  type: string;
  uri: string;
}

export interface SpotifyEpisode {
  album_group: string;
  album_type: string;
  artists: SpotifyArtist[];
  available_markets: string[];
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  images: Image[];
  name: string;
  release_date: string;
  release_date_precision: string;
  total_tracks: number;
  type: string;
  uri: string;
}

export interface SpotifyEpisodeResponse {
  href: string;
  items: SpotifyEpisode[];
  next: string;
}
