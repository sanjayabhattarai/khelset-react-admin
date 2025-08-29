import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../../../api/firebase';
import { Delivery } from '../types';

export const addDeliveryToInningsArray = async (matchId: string, inningsNum: number, deliveryData: Delivery) => {
  const matchDocRef = doc(db, 'matches', matchId);
  const inningsKey = `innings${inningsNum}.deliveryHistory`;
  try {
    await updateDoc(matchDocRef, {
      [inningsKey]: arrayUnion(deliveryData)
    });
  } catch (error) {
    console.error("Error adding delivery to deliveryHistory array:", error);
    throw error;
  }
};
