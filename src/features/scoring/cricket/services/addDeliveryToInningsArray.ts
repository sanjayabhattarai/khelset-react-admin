import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../../../api/firebase';
import { Delivery } from '../types';

// Type conversion utility
const convertToDoubles = (data: any): any => {
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

export const addDeliveryToInningsArray = async (matchId: string, inningsNum: number, deliveryData: Delivery) => {
  const matchDocRef = doc(db, 'matches', matchId);
  const inningsKey = `innings${inningsNum}.deliveryHistory`;
  try {
    // Convert delivery data to doubles for Flutter compatibility
    const convertedDeliveryData = convertToDoubles(deliveryData);
    await updateDoc(matchDocRef, {
      [inningsKey]: arrayUnion(convertedDeliveryData)
    });
  } catch (error) {
    console.error("Error adding delivery to deliveryHistory array:", error);
    throw error;
  }
};
