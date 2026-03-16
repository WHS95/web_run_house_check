// 네이버 지도 API 타입 정의
export interface NaverMapPosition {
  lat: number;
  lng: number;
}

export interface NaverLatLngBounds {
  extend: (latlng: NaverLatLng) => void;
}

export interface NaverMap {
  setCenter: (latlng: NaverLatLng) => void;
  getCenter: () => NaverLatLng;
  panTo: (latlng: NaverLatLng) => void;
  setZoom: (zoom: number) => void;
  fitBounds: (bounds: NaverLatLngBounds, padding?: { top?: number; right?: number; bottom?: number; left?: number }) => void;
}

export interface NaverLatLng {
  lat: () => number;
  lng: () => number;
}

export interface Marker {
  setPosition: (latlng: NaverLatLng) => void;
  setMap: (map: NaverMap | null) => void;
}

export interface NaverClickEvent {
  coord: NaverLatLng;
}

export interface NaverMapsAPI {
  maps: {
    LatLng: new (lat: number, lng: number) => NaverLatLng;
    LatLngBounds: new (sw: NaverLatLng, ne: NaverLatLng) => NaverLatLngBounds;
    Point: new (x: number, y: number) => { x: number; y: number };
    Map: new (element: HTMLElement, options: unknown) => NaverMap;
    Marker: new (options: unknown) => Marker;
    Event: {
      addListener: (
        target: unknown,
        eventName: string,
        listener: ((e: NaverClickEvent) => void) | (() => void)
      ) => void;
    };
    Service: {
      geocode: (
        options: { query: string },
        callback: (status: string, response: GeocodeResponse) => void
      ) => void;
      reverseGeocode: (
        options: { coords: NaverLatLng; orders: string },
        callback: (status: string, response: any) => void
      ) => void;
      OrderType: {
        ROAD_ADDR: string;
        ADDR: string;
      };
      Status: {
        ERROR: string;
      };
    };
  };
}

export interface GeocodeResponse {
  v2: {
    addresses: Array<{
      x: string;
      y: string;
      roadAddress?: string;
      jibunAddress?: string;
      englishAddress?: string;
      addressElements?: Array<{
        types: string[];
        longName: string;
        shortName: string;
        code: string;
      }>;
      distance?: number;
    }>;
  };
}

declare global {
  interface Window {
    naver: NaverMapsAPI;
  }
}
