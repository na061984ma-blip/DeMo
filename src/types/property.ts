export type FlatStatus = 'Available' | 'Sold' | 'Rented' | 'Reserved';

export type DirectionKey = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export type ProjectStatus =
  | 'Ready to Move'
  | 'Near Completion'
  | 'Under Construction'
  | 'Pre-Launch';

export type GalleryCategory =
  | 'Exterior'
  | 'Interior'
  | 'Entrance'
  | 'Living Room'
  | 'Bedrooms'
  | 'Kitchen'
  | 'Bathrooms'
  | 'Balconies'
  | 'Parking'
  | 'Amenities'
  | 'Roads & Neighborhood';

export type RoomId =
  | 'corridor'
  | 'main-hall'
  | 'dining-area'
  | 'kitchen'
  | 'bedroom-1'
  | 'bedroom-2'
  | 'master-bedroom'
  | 'attached-bathroom'
  | 'balcony';

export interface RoomNavTarget {
  targetRoomId: RoomId;
  label: string;
  directionHint: 'forward' | 'back' | 'left' | 'right';
}

export interface RoomNode {
  id: RoomId;
  label: string;
  position: [number, number, number]; // Camera eye position in 3D apartment coordinates
  lookAt: [number, number, number];   // Default look target
  isInteriorRoom: boolean;            // False for Corridor/Arrival, True for interior rooms
  navTargets: RoomNavTarget[];
}

export interface FlatUnit {
  id: string;
  flatNumber: string;
  floorNumber: number;
  floorLabel: string;
  bhkConfig: string; // e.g., "2 BHK", "3 BHK", "4 BHK Sky Villa"
  carpetAreaSqFt: number;
  builtUpAreaSqFt: number;
  superBuiltUpAreaSqFt: number;
  landShareSqYds?: number;
  facing: DirectionKey;
  balconies: string;
  bedrooms: number;
  bathrooms: number;
  parking: string;
  priceLabel: string;
  priceNumeric?: number;
  status: FlatStatus;
  panoramaViewpointId?: string;
}

export interface FloorData {
  floorNumber: number;
  floorLabel: string;
  floorPlanImage: string;
  floorPlanNote: string;
  flats: FlatUnit[];
}

export interface DirectionalView {
  direction: DirectionKey;
  label: string;
  orientationNote: string;
  imageUrl: string;
}

export interface RoadConnections {
  forwardId?: string;
  forwardLabel?: string;
  backwardId?: string;
  backwardLabel?: string;
  leftId?: string;
  leftLabel?: string;
  rightId?: string;
  rightLabel?: string;
}

export interface PanoramaViewpoint {
  id: string;
  title: string;
  category: 'Interior' | 'Floor Walkthrough' | 'Road & Exterior View';
  mediaType: 'equirectangular-image' | 'equirectangular-video' | 'street-perspective';
  mediaUrl: string;
  floorNumber?: number;
  initialYawDeg: number;
  compassOffsetDeg: number;
  description: string;
  connections: RoadConnections;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: GalleryCategory;
  imageUrl: string;
  caption: string;
}

export interface VentureProject {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  location: string;
  address: string;
  mapCoordinates: { lat: number; lng: number; embedQuery: string };
  mainImage: string;
  status: ProjectStatus;
  constructionProgressPct: number;
  possessionTimeline: string;
  overview: string;
  highlights: string[];
  landAreaSqYds: number;
  totalBuiltUpAreaSqFt: number;
  totalBlocks: number;
  elevatorsCount: number;
  flatsPerFloorNote: string;
  configurations: string[];
  parkingFacilities: string;
  amenities: string[];
  floors: FloorData[];
  directionalViews: DirectionalView[];
  viewpoints: PanoramaViewpoint[];
  gallery: GalleryItem[];
}

export interface ComputedProjectStats {
  totalFloors: number;
  totalFlats: number;
  availableFlats: number;
  soldFlats: number;
  rentedFlats: number;
  reservedFlats: number;
}

export interface EnquirySubmission {
  id: string;
  projectId: string;
  projectName: string;
  flatNumber?: string;
  fullName: string;
  email: string;
  phone: string;
  preferredVisitDate?: string;
  message: string;
  createdAt: string;
}
