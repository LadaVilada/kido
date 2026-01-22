import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChildrenService } from '../childrenService';
import { Child, CreateChildInput, UpdateChildInput, CHILD_COLORS } from '@/types';
import * as firestore from '@/lib/firestore';
import * as validation from '@/lib/validation';

// Mock firestore module
vi.mock('@/lib/firestore', () => ({
  COLLECTIONS: {
    CHILDREN: 'children',
  },
  createDocument: vi.fn(),
  getDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
  getDocumentsByUser: vi.fn(),
  subscribeToUserDocuments: vi.fn(),
  handleFirestoreError: vi.fn((error) => error.message || 'An error occurred'),
}));

// Mock validation module
vi.mock('@/lib/validation');

describe('ChildrenService', () => {
  const mockUserId = 'test-user-123';
  const mockChildId = 'test-child-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createChild', () => {
    it('should create a child with valid input', async () => {
      const input: CreateChildInput = {
        name: 'Emma',
        color: CHILD_COLORS[0],
      };

      vi.mocked(validation.validateCreateChild).mockReturnValue({
        isValid: true,
        errors: [],
      });

      vi.mocked(firestore.getDocumentsByUser).mockResolvedValue([]);
      vi.mocked(firestore.createDocument).mockResolvedValue(mockChildId);

      const result = await ChildrenService.createChild(mockUserId, input);

      expect(result).toBe(mockChildId);
      expect(firestore.createDocument).toHaveBeenCalledWith(
        firestore.COLLECTIONS.CHILDREN,
        {
          userId: mockUserId,
          name: 'Emma',
          color: CHILD_COLORS[0],
        }
      );
    });

    it('should throw error when validation fails', async () => {
      const input: CreateChildInput = {
        name: '',
        color: CHILD_COLORS[0],
      };

      vi.mocked(validation.validateCreateChild).mockReturnValue({
        isValid: false,
        errors: [{ field: 'name', message: 'Child name is required' }],
      });

      await expect(ChildrenService.createChild(mockUserId, input)).rejects.toThrow(
        'Child name is required'
      );

      expect(firestore.createDocument).not.toHaveBeenCalled();
    });

    it('should throw error when child name already exists', async () => {
      const input: CreateChildInput = {
        name: 'Emma',
        color: CHILD_COLORS[0],
      };

      const existingChildren: Child[] = [
        {
          id: 'child-1',
          familyId: mockUserId,
          name: 'Emma',
          color: CHILD_COLORS[1],
          createdAt: {} as any,
        },
      ];

      vi.mocked(validation.validateCreateChild).mockReturnValue({
        isValid: true,
        errors: [],
      });

      vi.mocked(firestore.getDocumentsByUser).mockResolvedValue(existingChildren);

      await expect(ChildrenService.createChild(mockUserId, input)).rejects.toThrow(
        'A child with this name already exists'
      );

      expect(firestore.createDocument).not.toHaveBeenCalled();
    });

    it('should throw error when color is already assigned', async () => {
      const input: CreateChildInput = {
        name: 'Emma',
        color: CHILD_COLORS[0],
      };

      const existingChildren: Child[] = [
        {
          id: 'child-1',
          familyId: mockUserId,
          name: 'Oliver',
          color: CHILD_COLORS[0],
          createdAt: {} as any,
        },
      ];

      vi.mocked(validation.validateCreateChild).mockReturnValue({
        isValid: true,
        errors: [],
      });

      vi.mocked(firestore.getDocumentsByUser).mockResolvedValue(existingChildren);

      await expect(ChildrenService.createChild(mockUserId, input)).rejects.toThrow(
        'This color is already assigned to another child'
      );

      expect(firestore.createDocument).not.toHaveBeenCalled();
    });

    it('should trim whitespace from child name', async () => {
      const input: CreateChildInput = {
        name: '  Emma  ',
        color: CHILD_COLORS[0],
      };

      vi.mocked(validation.validateCreateChild).mockReturnValue({
        isValid: true,
        errors: [],
      });

      vi.mocked(firestore.getDocumentsByUser).mockResolvedValue([]);
      vi.mocked(firestore.createDocument).mockResolvedValue(mockChildId);

      await ChildrenService.createChild(mockUserId, input);

      expect(firestore.createDocument).toHaveBeenCalledWith(
        firestore.COLLECTIONS.CHILDREN,
        expect.objectContaining({
          name: 'Emma',
        })
      );
    });
  });

  describe('getChild', () => {
    it('should retrieve a child by ID', async () => {
      const mockChild: Child = {
        id: mockChildId,
        familyId: mockUserId,
        name: 'Emma',
        color: CHILD_COLORS[0],
        createdAt: {} as any,
      };

      vi.mocked(firestore.getDocument).mockResolvedValue(mockChild);

      const result = await ChildrenService.getChild(mockChildId);

      expect(result).toEqual(mockChild);
      expect(firestore.getDocument).toHaveBeenCalledWith(
        firestore.COLLECTIONS.CHILDREN,
        mockChildId
      );
    });

    it('should return null when child does not exist', async () => {
      vi.mocked(firestore.getDocument).mockResolvedValue(null);

      const result = await ChildrenService.getChild(mockChildId);

      expect(result).toBeNull();
    });
  });

  describe('getChildrenByUser', () => {
    it('should retrieve all children for a user', async () => {
      const mockChildren: Child[] = [
        {
          id: 'child-1',
          familyId: mockUserId,
          name: 'Emma',
          color: CHILD_COLORS[0],
          createdAt: {} as any,
        },
        {
          id: 'child-2',
          familyId: mockUserId,
          name: 'Oliver',
          color: CHILD_COLORS[1],
          createdAt: {} as any,
        },
      ];

      vi.mocked(firestore.getDocumentsByUser).mockResolvedValue(mockChildren);

      const result = await ChildrenService.getChildrenByUser(mockUserId);

      expect(result).toEqual(mockChildren);
      expect(firestore.getDocumentsByUser).toHaveBeenCalledWith(
        firestore.COLLECTIONS.CHILDREN,
        mockUserId,
        'name'
      );
    });

    it('should return empty array when user has no children', async () => {
      vi.mocked(firestore.getDocumentsByUser).mockResolvedValue([]);

      const result = await ChildrenService.getChildrenByUser(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('updateChild', () => {
    const existingChild: Child = {
      id: mockChildId,
      familyId: mockUserId,
      name: 'Emma',
      color: CHILD_COLORS[0],
      createdAt: {} as any,
    };

    it('should update child name successfully', async () => {
      const input: UpdateChildInput = {
        name: 'Emily',
      };

      vi.mocked(validation.validateUpdateChild).mockReturnValue({
        isValid: true,
        errors: [],
      });

      vi.mocked(firestore.getDocument).mockResolvedValue(existingChild);
      vi.mocked(firestore.getDocumentsByUser).mockResolvedValue([existingChild]);
      vi.mocked(firestore.updateDocument).mockResolvedValue(undefined);

      await ChildrenService.updateChild(mockChildId, mockUserId, input);

      expect(firestore.updateDocument).toHaveBeenCalledWith(
        firestore.COLLECTIONS.CHILDREN,
        mockChildId,
        { name: 'Emily' }
      );
    });

    it('should update child color successfully', async () => {
      const input: UpdateChildInput = {
        color: CHILD_COLORS[2],
      };

      vi.mocked(validation.validateUpdateChild).mockReturnValue({
        isValid: true,
        errors: [],
      });

      vi.mocked(firestore.getDocument).mockResolvedValue(existingChild);
      vi.mocked(firestore.getDocumentsByUser).mockResolvedValue([existingChild]);
      vi.mocked(firestore.updateDocument).mockResolvedValue(undefined);

      await ChildrenService.updateChild(mockChildId, mockUserId, input);

      expect(firestore.updateDocument).toHaveBeenCalledWith(
        firestore.COLLECTIONS.CHILDREN,
        mockChildId,
        { color: CHILD_COLORS[2] }
      );
    });

    it('should throw error when validation fails', async () => {
      const input: UpdateChildInput = {
        name: '',
      };

      vi.mocked(validation.validateUpdateChild).mockReturnValue({
        isValid: false,
        errors: [{ field: 'name', message: 'Child name is required' }],
      });

      await expect(
        ChildrenService.updateChild(mockChildId, mockUserId, input)
      ).rejects.toThrow('Child name is required');

      expect(firestore.updateDocument).not.toHaveBeenCalled();
    });

    it('should throw error when child does not exist', async () => {
      const input: UpdateChildInput = {
        name: 'Emily',
      };

      vi.mocked(validation.validateUpdateChild).mockReturnValue({
        isValid: true,
        errors: [],
      });

      vi.mocked(firestore.getDocument).mockResolvedValue(null);

      await expect(
        ChildrenService.updateChild(mockChildId, mockUserId, input)
      ).rejects.toThrow('Child not found');

      expect(firestore.updateDocument).not.toHaveBeenCalled();
    });

    it('should throw error when new name conflicts with existing child', async () => {
      const input: UpdateChildInput = {
        name: 'Oliver',
      };

      const otherChild: Child = {
        id: 'child-2',
        familyId: mockUserId,
        name: 'Oliver',
        color: CHILD_COLORS[1],
        createdAt: {} as any,
      };

      vi.mocked(validation.validateUpdateChild).mockReturnValue({
        isValid: true,
        errors: [],
      });

      vi.mocked(firestore.getDocument).mockResolvedValue(existingChild);
      vi.mocked(firestore.getDocumentsByUser).mockResolvedValue([
        existingChild,
        otherChild,
      ]);

      await expect(
        ChildrenService.updateChild(mockChildId, mockUserId, input)
      ).rejects.toThrow('A child with this name already exists');

      expect(firestore.updateDocument).not.toHaveBeenCalled();
    });

    it('should throw error when new color conflicts with existing child', async () => {
      const input: UpdateChildInput = {
        color: CHILD_COLORS[1],
      };

      const otherChild: Child = {
        id: 'child-2',
        familyId: mockUserId,
        name: 'Oliver',
        color: CHILD_COLORS[1],
        createdAt: {} as any,
      };

      vi.mocked(validation.validateUpdateChild).mockReturnValue({
        isValid: true,
        errors: [],
      });

      vi.mocked(firestore.getDocument).mockResolvedValue(existingChild);
      vi.mocked(firestore.getDocumentsByUser).mockResolvedValue([
        existingChild,
        otherChild,
      ]);

      await expect(
        ChildrenService.updateChild(mockChildId, mockUserId, input)
      ).rejects.toThrow('This color is already assigned to another child');

      expect(firestore.updateDocument).not.toHaveBeenCalled();
    });

    it('should allow updating to same name (case insensitive)', async () => {
      const input: UpdateChildInput = {
        name: 'EMMA',
      };

      vi.mocked(validation.validateUpdateChild).mockReturnValue({
        isValid: true,
        errors: [],
      });

      vi.mocked(firestore.getDocument).mockResolvedValue(existingChild);
      vi.mocked(firestore.getDocumentsByUser).mockResolvedValue([existingChild]);
      vi.mocked(firestore.updateDocument).mockResolvedValue(undefined);

      await ChildrenService.updateChild(mockChildId, mockUserId, input);

      expect(firestore.updateDocument).toHaveBeenCalled();
    });
  });

  describe('deleteChild', () => {
    it('should delete a child successfully', async () => {
      const mockChild: Child = {
        id: mockChildId,
        familyId: mockUserId,
        name: 'Emma',
        color: CHILD_COLORS[0],
        createdAt: {} as any,
      };

      vi.mocked(firestore.getDocument).mockResolvedValue(mockChild);
      vi.mocked(firestore.deleteDocument).mockResolvedValue(undefined);

      await ChildrenService.deleteChild(mockChildId, mockUserId);

      expect(firestore.deleteDocument).toHaveBeenCalledWith(
        firestore.COLLECTIONS.CHILDREN,
        mockChildId
      );
    });

    it('should throw error when child does not exist', async () => {
      vi.mocked(firestore.getDocument).mockResolvedValue(null);

      await expect(
        ChildrenService.deleteChild(mockChildId, mockUserId)
      ).rejects.toThrow('Child not found');

      expect(firestore.deleteDocument).not.toHaveBeenCalled();
    });
  });

  describe('isChildNameAvailable', () => {
    it('should return true when name is available', async () => {
      const existingChildren: Child[] = [
        {
          id: 'child-1',
          familyId: mockUserId,
          name: 'Emma',
          color: CHILD_COLORS[0],
          createdAt: {} as any,
        },
      ];

      vi.mocked(firestore.getDocumentsByUser).mockResolvedValue(existingChildren);

      const result = await ChildrenService.isChildNameAvailable(mockUserId, 'Oliver');

      expect(result).toBe(true);
    });

    it('should return false when name is already taken', async () => {
      const existingChildren: Child[] = [
        {
          id: 'child-1',
          familyId: mockUserId,
          name: 'Emma',
          color: CHILD_COLORS[0],
          createdAt: {} as any,
        },
      ];

      vi.mocked(firestore.getDocumentsByUser).mockResolvedValue(existingChildren);

      const result = await ChildrenService.isChildNameAvailable(mockUserId, 'Emma');

      expect(result).toBe(false);
    });

    it('should be case insensitive', async () => {
      const existingChildren: Child[] = [
        {
          id: 'child-1',
          familyId: mockUserId,
          name: 'Emma',
          color: CHILD_COLORS[0],
          createdAt: {} as any,
        },
      ];

      vi.mocked(firestore.getDocumentsByUser).mockResolvedValue(existingChildren);

      const result = await ChildrenService.isChildNameAvailable(mockUserId, 'EMMA');

      expect(result).toBe(false);
    });

    it('should exclude specified child ID from check', async () => {
      const existingChildren: Child[] = [
        {
          id: 'child-1',
          familyId: mockUserId,
          name: 'Emma',
          color: CHILD_COLORS[0],
          createdAt: {} as any,
        },
      ];

      vi.mocked(firestore.getDocumentsByUser).mockResolvedValue(existingChildren);

      const result = await ChildrenService.isChildNameAvailable(
        mockUserId,
        'Emma',
        'child-1'
      );

      expect(result).toBe(true);
    });
  });

  describe('isColorAvailable', () => {
    it('should return true when color is available', async () => {
      const existingChildren: Child[] = [
        {
          id: 'child-1',
          familyId: mockUserId,
          name: 'Emma',
          color: CHILD_COLORS[0],
          createdAt: {} as any,
        },
      ];

      vi.mocked(firestore.getDocumentsByUser).mockResolvedValue(existingChildren);

      const result = await ChildrenService.isColorAvailable(mockUserId, CHILD_COLORS[1]);

      expect(result).toBe(true);
    });

    it('should return false when color is already assigned', async () => {
      const existingChildren: Child[] = [
        {
          id: 'child-1',
          familyId: mockUserId,
          name: 'Emma',
          color: CHILD_COLORS[0],
          createdAt: {} as any,
        },
      ];

      vi.mocked(firestore.getDocumentsByUser).mockResolvedValue(existingChildren);

      const result = await ChildrenService.isColorAvailable(mockUserId, CHILD_COLORS[0]);

      expect(result).toBe(false);
    });

    it('should exclude specified child ID from check', async () => {
      const existingChildren: Child[] = [
        {
          id: 'child-1',
          familyId: mockUserId,
          name: 'Emma',
          color: CHILD_COLORS[0],
          createdAt: {} as any,
        },
      ];

      vi.mocked(firestore.getDocumentsByUser).mockResolvedValue(existingChildren);

      const result = await ChildrenService.isColorAvailable(
        mockUserId,
        CHILD_COLORS[0],
        'child-1'
      );

      expect(result).toBe(true);
    });
  });
});
