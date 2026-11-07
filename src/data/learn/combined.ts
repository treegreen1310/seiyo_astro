// 天体 × サイン × ハウスを統合した解説（太陽・月のみ）
// サインの性質が、ハウスの場面でどう出るかを、組み合わせごとに書いている
import type { PlacementLearn } from './placements';
import { SUN_ARIES } from './combined/sun/aries';
import { SUN_TAURUS } from './combined/sun/taurus';
import { SUN_GEMINI } from './combined/sun/gemini';
import { SUN_CANCER } from './combined/sun/cancer';
import { SUN_LEO } from './combined/sun/leo';
import { SUN_VIRGO } from './combined/sun/virgo';
import { SUN_LIBRA } from './combined/sun/libra';
import { SUN_SCORPIO } from './combined/sun/scorpio';
import { SUN_SAGITTARIUS } from './combined/sun/sagittarius';
import { SUN_CAPRICORN } from './combined/sun/capricorn';
import { SUN_AQUARIUS } from './combined/sun/aquarius';
import { SUN_PISCES } from './combined/sun/pisces';
import { MOON_ARIES } from './combined/moon/aries';
import { MOON_TAURUS } from './combined/moon/taurus';
import { MOON_GEMINI } from './combined/moon/gemini';
import { MOON_CANCER } from './combined/moon/cancer';
import { MOON_LEO } from './combined/moon/leo';
import { MOON_VIRGO } from './combined/moon/virgo';
import { MOON_LIBRA } from './combined/moon/libra';
import { MOON_SCORPIO } from './combined/moon/scorpio';
import { MOON_SAGITTARIUS } from './combined/moon/sagittarius';
import { MOON_CAPRICORN } from './combined/moon/capricorn';
import { MOON_AQUARIUS } from './combined/moon/aquarius';
import { MOON_PISCES } from './combined/moon/pisces';

// 天体のキー → サイン名 → ハウス番号 → 解説
export const COMBINED_PLACEMENTS: Record<string, Record<string, Record<number, PlacementLearn>>> = {
  sun: {
    牡羊座: SUN_ARIES,
    牡牛座: SUN_TAURUS,
    双子座: SUN_GEMINI,
    蟹座: SUN_CANCER,
    獅子座: SUN_LEO,
    乙女座: SUN_VIRGO,
    天秤座: SUN_LIBRA,
    蠍座: SUN_SCORPIO,
    射手座: SUN_SAGITTARIUS,
    山羊座: SUN_CAPRICORN,
    水瓶座: SUN_AQUARIUS,
    魚座: SUN_PISCES,
  },
  moon: {
    牡羊座: MOON_ARIES,
    牡牛座: MOON_TAURUS,
    双子座: MOON_GEMINI,
    蟹座: MOON_CANCER,
    獅子座: MOON_LEO,
    乙女座: MOON_VIRGO,
    天秤座: MOON_LIBRA,
    蠍座: MOON_SCORPIO,
    射手座: MOON_SAGITTARIUS,
    山羊座: MOON_CAPRICORN,
    水瓶座: MOON_AQUARIUS,
    魚座: MOON_PISCES,
  },
};

export const findCombinedPlacement = (planetKey: string, sign: string, house: number): PlacementLearn | null =>
  COMBINED_PLACEMENTS[planetKey]?.[sign]?.[house] ?? null;
