import { db } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';

export interface UserAddress {
  id: string;
  label: string;
  fullAddress: string;
  landmark?: string;
  isDefault: boolean;
}

export interface UserPreferences {
  pushNotifications: boolean;
  smsAlerts: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  phoneNumber: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

// Profile functions
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'profiles', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const createUserProfile = async (profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<boolean> => {
  try {
    const docRef = doc(db, 'profiles', profile.uid);
    await setDoc(docRef, {
      ...profile,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return false;
  }
};

export const updateUserProfile = async (
  uid: string, 
  updates: Partial<Pick<UserProfile, 'displayName' | 'preferences'>>
): Promise<boolean> => {
  try {
    const docRef = doc(db, 'profiles', uid);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
};

// Address functions
export const getUserAddresses = async (uid: string): Promise<UserAddress[]> => {
  try {
    const addressesRef = collection(db, 'profiles', uid, 'addresses');
    const querySnapshot = await getDocs(addressesRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserAddress[];
  } catch (error) {
    console.error('Error getting addresses:', error);
    return [];
  }
};

export const addUserAddress = async (uid: string, address: Omit<UserAddress, 'id'>): Promise<string | null> => {
  try {
    const addressesRef = collection(db, 'profiles', uid, 'addresses');
    
    // If this is the default address, unset other defaults
    if (address.isDefault) {
      const existingAddresses = await getUserAddresses(uid);
      for (const addr of existingAddresses) {
        if (addr.isDefault) {
          await updateDoc(doc(db, 'profiles', uid, 'addresses', addr.id), { isDefault: false });
        }
      }
    }
    
    const docRef = await addDoc(addressesRef, address);
    return docRef.id;
  } catch (error) {
    console.error('Error adding address:', error);
    return null;
  }
};

export const updateUserAddress = async (uid: string, addressId: string, updates: Partial<UserAddress>): Promise<boolean> => {
  try {
    const addressRef = doc(db, 'profiles', uid, 'addresses', addressId);
    
    // If setting as default, unset other defaults
    if (updates.isDefault) {
      const existingAddresses = await getUserAddresses(uid);
      for (const addr of existingAddresses) {
        if (addr.isDefault && addr.id !== addressId) {
          await updateDoc(doc(db, 'profiles', uid, 'addresses', addr.id), { isDefault: false });
        }
      }
    }
    
    await updateDoc(addressRef, updates);
    return true;
  } catch (error) {
    console.error('Error updating address:', error);
    return false;
  }
};

export const deleteUserAddress = async (uid: string, addressId: string): Promise<boolean> => {
  try {
    const addressRef = doc(db, 'profiles', uid, 'addresses', addressId);
    await deleteDoc(addressRef);
    return true;
  } catch (error) {
    console.error('Error deleting address:', error);
    return false;
  }
};
