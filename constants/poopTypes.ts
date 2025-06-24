export type PoopType = {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
};

export const poopTypes: PoopType[] = [
  {
    id: 1,
    name: "Type 1",
    description: "Separate hard lumps, like nuts (hard to pass)",
    icon: "💩",
    color: "#8B4513",
  },
  {
    id: 2,
    name: "Type 2",
    description: "Sausage-shaped, but lumpy",
    icon: "💩",
    color: "#A0522D",
  },
  {
    id: 3,
    name: "Type 3",
    description: "Like a sausage but with cracks on its surface",
    icon: "💩",
    color: "#B8860B",
  },
  {
    id: 4,
    name: "Type 4",
    description: "Like a sausage or snake, smooth and soft",
    icon: "💩",
    color: "#CD853F",
  },
  {
    id: 5,
    name: "Type 5",
    description: "Soft blobs with clear cut edges (passed easily)",
    icon: "💩",
    color: "#DAA520",
  },
  {
    id: 6,
    name: "Type 6",
    description: "Fluffy pieces with ragged edges, a mushy stool",
    icon: "💩",
    color: "#D2B48C",
  },
  {
    id: 7,
    name: "Type 7",
    description: "Watery, no solid pieces, entirely liquid",
    icon: "💧",
    color: "#F4A460",
  },
];

export const poopVolumes = [
  { id: 1, name: "Small", icon: "I" },
  { id: 2, name: "Medium", icon: "II" },
  { id: 3, name: "Large", icon: "III" },
];

export const poopFeelings = [
  { id: 1, name: "Easy", icon: "😌" },
  { id: 2, name: "Moderate", icon: "😐" },
  { id: 3, name: "Difficult", icon: "😣" },
  { id: 4, name: "Incomplete", icon: "😕" },
];

export const poopColors = [
  { id: 1, name: "Brown", color: "#8B4513" },
  { id: 2, name: "Dark Brown", color: "#5D4037" },
  { id: 3, name: "Light Brown", color: "#A0522D" },
  { id: 4, name: "Yellow", color: "#FFC107" },
  { id: 5, name: "Green", color: "#4CAF50" },
  { id: 6, name: "Red", color: "#F44336" },
  { id: 7, name: "Black", color: "#212121" },
];