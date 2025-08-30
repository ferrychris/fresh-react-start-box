export interface Racer {
  id: string;
  name: string;
  username?: string;
  bio?: string;
  bannerImage?: string;
  carNumber?: string;
  class?: string;
  location?: string;
  career_wins?: number;
  podiums?: number;
  championships?: number;
  years_racing?: number;
  career_history?: string;
  header_image?: string;
  profile_picture?: string;
  car_photos: string[];
  teamName?: string;
  [key: string]: string | number | string[] | undefined | null | boolean; // For any other properties
}

