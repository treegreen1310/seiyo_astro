export interface Planet {
  key: string;
  name: string;
  symbol: string;
  category: string;
  abs_deg: number;
  sign: string;
  sign_symbol: string;
  deg_in_sign: string;
  deg_decimal: number;
  house: number;
  ruled_houses: string;
  is_retrograde: boolean;
}

export interface HouseCusp {
  house: number;
  cusp_deg: number;
  sign: string;
  sign_symbol: string;
  degree_str: string;
  degree_decimal: number;
  ruler: string;
  planets: string[];
}

export interface Aspect {
  p1_key: string;
  p1_name: string;
  p2_key: string;
  p2_name: string;
  aspect_name: string;
  aspect_symbol: string;
  target_angle: number;
  orb: number;
  orb_str: string;
}

export interface HoroscopeData {
  success: boolean;
  chart_info: {
    datetime_str: string;
    lat: number;
    lon: number;
    timezone: number;
    year?: number;
    month?: number;
    day?: number;
    hour?: number;
    minute?: number;
  };
  houses: HouseCusp[];
  planets: Planet[];
  aspects: Aspect[];
  aspect_matrix: Record<string, Record<string, Aspect>>;
  cusps: number[];
}

export interface PrefectureLocation {
  name: string;
  lat: number;
  lon: number;
}
