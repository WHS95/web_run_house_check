// 네이버 지도 API 타입 정의
export interface NaverMap {
  setCenter: (latlng: NaverLatLng) => void;
  getCenter: () => NaverLatLng;
}

export interface NaverLatLng {
  lat: () => number;
  lng: () => number;
}

export interface Marker {
  setPosition: (latlng: NaverLatLng) => void;
}

export interface NaverClickEvent {
  coord: NaverLatLng;
}

export interface NaverMapsAPI {
  maps: {
    LatLng: new (lat: number, lng: number) => NaverLatLng;
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
