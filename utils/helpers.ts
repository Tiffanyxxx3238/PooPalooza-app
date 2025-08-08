// utils/helpers.ts
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // 地球半徑（米）
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 返回距離（米）
};

export const isGovernmentFacility = (
  name: string,
  address: string,
  type: string,
  administration: string
): boolean => {
  const govKeywords = [
    '政府', '市政府', '區公所', '里民', '社區', '學校', '醫院', '衛生所',
    '圖書館', '體育館', '公園', '捷運', '火車站', '客運', '郵局', '銀行',
    '警察局', '消防局', '戶政', '地政', '稅務', '健保署', '勞保局'
  ];

  const text = `${name} ${address} ${type} ${administration}`.toLowerCase();
  return govKeywords.some(keyword => text.includes(keyword));
};

export const isInTaiwan = (latitude: number, longitude: number): boolean => {
  // 台灣的大致座標範圍
  const taiwanBounds = {
    north: 25.3,
    south: 21.9,
    east: 122.0,
    west: 119.3
  };

  return (
    latitude >= taiwanBounds.south &&
    latitude <= taiwanBounds.north &&
    longitude >= taiwanBounds.west &&
    longitude <= taiwanBounds.east
  );
};