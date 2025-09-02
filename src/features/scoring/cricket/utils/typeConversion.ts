// src/features/scoring/cricket/utils/typeConversion.ts

/**
 * Converts all numeric fields to doubles to ensure Flutter compatibility.
 * This prevents the 'int' is not a subtype of type 'double?' error in Flutter.
 */
export const convertToDoubles = (data: any): any => {
  if (typeof data === 'number') {
    return parseFloat(data.toString());
  }
  
  if (Array.isArray(data)) {
    return data.map(convertToDoubles);
  }
  
  if (typeof data === 'object' && data !== null) {
    const converted: any = {};
    for (const [key, value] of Object.entries(data)) {
      converted[key] = convertToDoubles(value);
    }
    return converted;
  }
  
  return data;
};
