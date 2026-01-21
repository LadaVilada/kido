import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Family, FamilyMember } from '@/types';

export class FamilyService {
  /**
   * Create a new family
   */
  static async createFamily(
    userId: string,
    userEmail: string,
    familyName: string
  ): Promise<string> {
    const familyRef = doc(collection(db, 'families'));
    
    const family: Omit<Family, 'id'> = {
      name: familyName,
      createdBy: userId,
      members: [
        {
          userId,
          email: userEmail,
          role: 'owner',
          joinedAt: Timestamp.now(),
        },
      ],
      createdAt: Timestamp.now(),
    };

    await setDoc(familyRef, family);
    
    // Update user's familyId
    await updateDoc(doc(db, 'users', userId), {
      familyId: familyRef.id,
    });

    return familyRef.id;
  }

  /**
   * Get family by ID
   */
  static async getFamily(familyId: string): Promise<Family | null> {
    const familyDoc = await getDoc(doc(db, 'families', familyId));
    
    if (!familyDoc.exists()) {
      return null;
    }

    return {
      id: familyDoc.id,
      ...familyDoc.data(),
    } as Family;
  }

  /**
   * Get user's family
   */
  static async getUserFamily(userId: string): Promise<Family | null> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists() || !userDoc.data().familyId) {
      return null;
    }

    return this.getFamily(userDoc.data().familyId);
  }

  /**
   * Add member to family by email
   */
  static async addFamilyMember(
    familyId: string,
    email: string,
    role: 'parent' | 'caregiver' = 'parent'
  ): Promise<void> {
    // Find user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('User not found with that email. They need to create an account first.');
    }

    const userDoc = snapshot.docs[0];
    const userId = userDoc.id;

    // Check if user is already in a family
    if (userDoc.data().familyId) {
      throw new Error('This user is already part of another family');
    }

    // Add member to family
    const newMember: FamilyMember = {
      userId,
      email,
      role,
      joinedAt: Timestamp.now(),
    };

    await updateDoc(doc(db, 'families', familyId), {
      members: arrayUnion(newMember),
    });

    // Update user's familyId
    await updateDoc(doc(db, 'users', userId), {
      familyId,
    });
  }

  /**
   * Remove member from family
   */
  static async removeFamilyMember(
    familyId: string,
    userId: string
  ): Promise<void> {
    const family = await this.getFamily(familyId);
    
    if (!family) {
      throw new Error('Family not found');
    }

    // Can't remove the owner
    if (family.createdBy === userId) {
      throw new Error('Cannot remove the family owner');
    }

    // Find and remove the member
    const member = family.members.find(m => m.userId === userId);
    
    if (!member) {
      throw new Error('Member not found in family');
    }

    await updateDoc(doc(db, 'families', familyId), {
      members: arrayRemove(member),
    });

    // Remove familyId from user
    await updateDoc(doc(db, 'users', userId), {
      familyId: null,
    });
  }

  /**
   * Update family name
   */
  static async updateFamilyName(
    familyId: string,
    name: string
  ): Promise<void> {
    await updateDoc(doc(db, 'families', familyId), {
      name,
    });
  }

  /**
   * Update member role
   */
  static async updateMemberRole(
    familyId: string,
    userId: string,
    newRole: 'parent' | 'caregiver'
  ): Promise<void> {
    const family = await this.getFamily(familyId);
    
    if (!family) {
      throw new Error('Family not found');
    }

    // Can't change owner's role
    if (family.createdBy === userId) {
      throw new Error('Cannot change owner role');
    }

    // Update the member's role
    const updatedMembers = family.members.map(member =>
      member.userId === userId ? { ...member, role: newRole } : member
    );

    await updateDoc(doc(db, 'families', familyId), {
      members: updatedMembers,
    });
  }

  /**
   * Leave family (for non-owners)
   */
  static async leaveFamily(userId: string): Promise<void> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists() || !userDoc.data().familyId) {
      throw new Error('User is not part of a family');
    }

    const familyId = userDoc.data().familyId;
    const family = await this.getFamily(familyId);

    if (!family) {
      throw new Error('Family not found');
    }

    // Owner cannot leave, must delete family instead
    if (family.createdBy === userId) {
      throw new Error('Owner cannot leave family. Delete the family instead.');
    }

    await this.removeFamilyMember(familyId, userId);
  }

  /**
   * Delete family (owner only)
   */
  static async deleteFamily(familyId: string, userId: string): Promise<void> {
    const family = await this.getFamily(familyId);

    if (!family) {
      throw new Error('Family not found');
    }

    if (family.createdBy !== userId) {
      throw new Error('Only the family owner can delete the family');
    }

    // Remove familyId from all members
    await Promise.all(
      family.members.map(member =>
        updateDoc(doc(db, 'users', member.userId), {
          familyId: null,
        })
      )
    );

    // Delete the family document
    await updateDoc(doc(db, 'families', familyId), {
      // Mark as deleted instead of actually deleting
      // This preserves data integrity
      deleted: true,
      deletedAt: Timestamp.now(),
    });
  }
}
