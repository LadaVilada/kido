import { 
  Child, 
  CreateChildInput, 
  UpdateChildInput,
  LoadingState 
} from '@/types';
import { 
  COLLECTIONS,
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  getDocumentsByUser,
  subscribeToUserDocuments,
  handleFirestoreError
} from '@/lib/firestore';
import { validateCreateChild, validateUpdateChild } from '@/lib/validation';

/**
 * Service class for managing children data
 */
export class ChildrenService {
  /**
   * Creates a new child
   */
  static async createChild(
    userId: string, 
    input: CreateChildInput
  ): Promise<string> {
    // Validate input
    const validation = validateCreateChild(input);
    if (!validation.isValid) {
      throw new Error(validation.errors.map(e => e.message).join(', '));
    }

    try {
      // Check if child name already exists for this user
      const existingChildren = await this.getChildrenByUser(userId);
      const nameExists = existingChildren.some(
        child => child.name.toLowerCase().trim() === input.name.toLowerCase().trim()
      );

      if (nameExists) {
        throw new Error('A child with this name already exists');
      }

      // Check if color is already in use
      const colorExists = existingChildren.some(child => child.color === input.color);
      if (colorExists) {
        throw new Error('This color is already assigned to another child');
      }

      const childData = {
        userId,
        name: input.name.trim(),
        color: input.color,
      };

      const childId = await createDocument(COLLECTIONS.CHILDREN, childData);
      return childId;
    } catch (error: any) {
      throw new Error(handleFirestoreError(error));
    }
  }

  /**
   * Gets a child by ID
   */
  static async getChild(childId: string): Promise<Child | null> {
    try {
      return await getDocument<Child>(COLLECTIONS.CHILDREN, childId);
    } catch (error: any) {
      throw new Error(handleFirestoreError(error));
    }
  }

  /**
   * Gets all children for a user
   */
  static async getChildrenByUser(userId: string): Promise<Child[]> {
    try {
      return await getDocumentsByUser<Child>(
        COLLECTIONS.CHILDREN, 
        userId, 
        'name'
      );
    } catch (error: any) {
      throw new Error(handleFirestoreError(error));
    }
  }

  /**
   * Updates a child
   */
  static async updateChild(
    childId: string, 
    userId: string,
    input: UpdateChildInput
  ): Promise<void> {
    // Validate input
    const validation = validateUpdateChild(input);
    if (!validation.isValid) {
      throw new Error(validation.errors.map(e => e.message).join(', '));
    }

    try {
      // Verify child belongs to user
      const existingChild = await this.getChild(childId);
      if (!existingChild) {
        throw new Error('Child not found');
      }
      if (existingChild.userId !== userId) {
        throw new Error('You do not have permission to update this child');
      }

      // Check for name conflicts (if name is being updated)
      if (input.name && input.name.trim() !== existingChild.name) {
        const existingChildren = await this.getChildrenByUser(userId);
        const nameExists = existingChildren.some(
          child => 
            child.id !== childId && 
            child.name.toLowerCase().trim() === input.name!.toLowerCase().trim()
        );

        if (nameExists) {
          throw new Error('A child with this name already exists');
        }
      }

      // Check for color conflicts (if color is being updated)
      if (input.color && input.color !== existingChild.color) {
        const existingChildren = await this.getChildrenByUser(userId);
        const colorExists = existingChildren.some(
          child => child.id !== childId && child.color === input.color
        );

        if (colorExists) {
          throw new Error('This color is already assigned to another child');
        }
      }

      const updateData: Partial<Child> = {};
      if (input.name) updateData.name = input.name.trim();
      if (input.color) updateData.color = input.color;

      await updateDocument(COLLECTIONS.CHILDREN, childId, updateData);
    } catch (error: any) {
      throw new Error(handleFirestoreError(error));
    }
  }

  /**
   * Deletes a child
   */
  static async deleteChild(childId: string, userId: string): Promise<void> {
    try {
      // Verify child belongs to user
      const existingChild = await this.getChild(childId);
      if (!existingChild) {
        throw new Error('Child not found');
      }
      if (existingChild.userId !== userId) {
        throw new Error('You do not have permission to delete this child');
      }

      // TODO: Check if child has associated activities and handle accordingly
      // For now, we'll allow deletion (activities will become orphaned)
      
      await deleteDocument(COLLECTIONS.CHILDREN, childId);
    } catch (error: any) {
      throw new Error(handleFirestoreError(error));
    }
  }

  /**
   * Subscribes to real-time updates for user's children
   */
  static subscribeToChildren(
    userId: string,
    callback: (children: Child[]) => void
  ): () => void {
    return subscribeToUserDocuments<Child>(
      COLLECTIONS.CHILDREN,
      userId,
      callback,
      'name'
    );
  }

  /**
   * Checks if a child name is available for a user
   */
  static async isChildNameAvailable(
    userId: string, 
    name: string, 
    excludeChildId?: string
  ): Promise<boolean> {
    try {
      const children = await this.getChildrenByUser(userId);
      return !children.some(child => 
        child.id !== excludeChildId &&
        child.name.toLowerCase().trim() === name.toLowerCase().trim()
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Checks if a color is available for a user
   */
  static async isColorAvailable(
    userId: string, 
    color: string, 
    excludeChildId?: string
  ): Promise<boolean> {
    try {
      const children = await this.getChildrenByUser(userId);
      return !children.some(child => 
        child.id !== excludeChildId && child.color === color
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Gets available colors for a user (colors not already assigned)
   */
  static async getAvailableColors(
    userId: string, 
    excludeChildId?: string
  ): Promise<string[]> {
    try {
      const { CHILD_COLORS } = await import('@/types');
      const children = await this.getChildrenByUser(userId);
      const usedColors = children
        .filter(child => child.id !== excludeChildId)
        .map(child => child.color);
      
      const availableColors = CHILD_COLORS.filter(color => !usedColors.includes(color));
      
      // If no colors are available, return all colors (shouldn't happen with 12 colors)
      // This ensures first child can always be created
      return availableColors.length > 0 ? availableColors : [...CHILD_COLORS];
    } catch (error) {
      // On error, return all colors so user can still create children
      console.error('Error getting available colors:', error);
      const { CHILD_COLORS } = await import('@/types');
      return [...CHILD_COLORS];
    }
  }
}