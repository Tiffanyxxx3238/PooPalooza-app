export interface PoopEntry {
  id: string;
  date: string;
  name?: string;
  type: number;
  volume: number;
  feeling: number;
  color: number;
  duration: number;
  notes: string;
  imageUri?: string;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
}