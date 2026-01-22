import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivitiesService } from '../activitiesService';
import { Activity, CreateActivityInput, UpdateActivityInput, Child } from '@/types';
import * as firestore from '@/lib/firestore';
import * as validation from '@/lib/validation';
import { ChildrenService } from '../childrenService';

// Mock firestore module
vi.mock('@/lib/firestore', () => ({
  COLLECTIONS: {
    ACTIVITIES: 'activities',
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

// Mock ChildrenService
vi.mock('../childrenService', () => ({
  ChildrenService: {
    getChild: vi.fn(),
    getChildrenByUser: vi.fn(),
  },
}));

describe('ActivitiesService', () => {
  const mockUserId = 'test-user-123';
  const mockChildId = 'test-child-456';
  const mockActivityId = 'test-activity-789';

  const mockChild: Child = {
    id: mockChildId,
    familyId: mockUserId,
    name: 'Emma',
    color: '#3b82f6',
    createdAt: {} as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createActivity', () => {
    it('should create an activity with valid input', async () => {
      const input: CreateActivityInput = {
        childId: mockChildId,
        title: 'Soccer Practice',
        location: 'Local Park',
        daysOfWeek: [1, 3, 5],
        startTime: '16:00',
        endTime: '17:30',
        timezone: 'America/New_York',
      };

      vi.mocked(validation.validateCreateActivity).mockReturnValue({
        isValid: true,
        errors: [],
      });

      vi.mocked(ChildrenService.getChild).mockResolvedValue(mockChild);
      vi.mocked(firestore.createDocument).mockResolvedValue(mockActivityId);

      const result = await ActivitiesService.createActivity(mockUserId, input);

      expect(result).toBe(mockActivityId);
      expect(firestore.createDocument).toHaveBeenCalledWith(
        firestore.COLLECTIONS.ACTIVITIES,
        {
          userId: mockUserId,
          childId: mockChildId,
          title: 'Soccer Practice',
          location: 'Local Park',
          daysOfWeek: [1, 3, 5],
          startTime: '16:00',
          endTime: '17:30',
          timezone: 'America/New_York',
        }
      );
    });

    it('should throw error when validation fails', async () => {
      const input: CreateActivityInput = {
        childId: mockChildId,
        title: '',
        location: 'Local Park',
        daysOfWeek: [1, 3, 5],
        startTime: '16:00',
        endTime: '17:30',
        timezone: 'America/New_York',
      };

      vi.mocked(validation.validateCreateActivity).mockReturnValue({
        isValid: false,
        errors: [{ field: 'title', message: 'Activity title is required' }],
      });

      await expect(ActivitiesService.createActivity(mockUserId, input)).rejects.toThrow(
        'Activity title is required'
      );

      expect(firestore.createDocument).not.toHaveBeenCalled();
    });

    it('should throw error when child does not exist', async () => {
      const input: CreateActivityInput = {
        childId: mockChildId,
        title: 'Soccer Practice',
        location: 'Local Park',
        daysOfWeek: [1, 3, 5],
        startTime: '16:00',
        endTime: '17:30',
        timezone: 'America/New_York',
      };

      vi.mocked(validation.validateCreateActivity).mockReturnValue({
        isValid: true,
        errors: [],
      });

      vi.mocked(ChildrenService.getChild).mockResolvedValue(null);

      await expect(ActivitiesService.createActivity(mockUserId, input)).rejects.toThrow(
        'Selected child not found'
      );

      expect(firestore.createDocument).not.toHaveBeenCalled();
    });

    it('should sort days of week for consistency', async () => {
      const input: CreateActivityInput = {
        childId: mockChildId,
        title: 'Soccer Practice',
        location: 'Local Park',
        daysOfWeek: [5, 1, 3],
        startTime: '16:00',
        endTime: '17:30',
        timezone: 'America/New_York',
      };

      vi.mocked(validation.validateCreateActivity).mockReturnValue({
        isValid: true,
        errors: [],
      });

      vi.mocked(ChildrenService.getChild).mockResolvedValue(mockChild);
      vi.mocked(firestore.createDocument).mockResolvedValue(mockActivityId);

      await ActivitiesService.createActivity(mockUserId, input);

      expect(firestore.createDocument).toHaveBeenCalledWith(
        firestore.COLLECTIONS.ACTIVITIES,
        expect.objectContaining({
          daysOfWeek: [1, 3, 5],
        })
      );
    });

    it('should trim whitespace from title and location', async () => {
      const input: CreateActivityInput = {
        childId: mockChildId,
        title: '  Soccer Practice  ',
        location: '  Local Park  ',
        daysOfWeek: [1, 3, 5],
        startTime: '16:00',
        endTime: '17:30',
        timezone: 'America/New_York',
      };

      vi.mocked(validation.validateCreateActivity).mockReturnValue({
        isValid: true,
        errors: [],
      });

      vi.mocked(ChildrenService.getChild).mockResolvedValue(mockChild);
      vi.mocked(firestore.createDocument).mockResolvedValue(mockActivityId);

      await ActivitiesService.createActivity(mockUserId, input);

      expect(firestore.createDocument).toHaveBeenCalledWith(
        firestore.COLLECTIONS.ACTIVITIES,
        expect.objectContaining({
          title: 'Soccer Practice',
          location: 'Local Park',
        })
      );
    });
  });

  describe('getActivity', () => {
    it('should retrieve an activity by ID', async () => {
      const mockActivity: Activity = {
        id: mockActivityId,
        userId: mockUserId,
        childId: mockChildId,
        title: 'Soccer Practice',
        location: 'Local Park',
        daysOfWeek: [1, 3, 5],
        startTime: '16:00',
        endTime: '17:30',
        timezone: 'America/New_York',
        createdAt: {} as any,
      };

      vi.mocked(firestore.getDocument).mockResolvedValue(mockActivity);

      const result = await ActivitiesService.getActivity(mockActivityId);

      expect(result).toEqual(mockActivity);
      expect(firestore.getDocument).toHaveBeenCalledWith(
        firestore.COLLECTIONS.ACTIVITIES,
        mockActivityId
      );
    });

    it('should return null when activity does not exist', async () => {
      vi.mocked(firestore.getDocument).mockResolvedValue(null);

      const result = await ActivitiesService.getActivity(mockActivityId);

      expect(result).toBeNull();
    });
  });

  describe('getActivitiesByUser', () => {
    it('should retrieve all activities for a user', async () => {
      const mockActivities: Activity[] = [
        {
          id: 'activity-1',
          userId: mockUserId,
          childId: mockChildId,
          title: 'Soccer Practice',
          location: 'Local Park',
          daysOfWeek: [1, 3, 5],
          startTime: '16:00',
          endTime: '17:30',
          timezone: 'America/New_York',
          createdAt: {} as any,
        },
        {
          id: 'activity-2',
          userId: mockUserId,
          childId: mockChildId,
          title: 'Piano Lessons',
          location: 'Music School',
          daysOfWeek: [2, 4],
          startTime: '15:00',
          endTime: '16:00',
          timezone: 'America/New_York',
          createdAt: {} as any,
        },
      ];

      vi.mocked(firestore.getDocumentsByUser).mockResolvedValue(mockActivities);

      const result = await ActivitiesService.getActivitiesByUser(mockUserId);

      expect(result).toEqual(mockActivities);
      expect(firestore.getDocumentsByUser).toHaveBeenCalledWith(
        firestore.COLLECTIONS.ACTIVITIES,
        mockUserId,
        'title'
      );
    });

    it('should return empty array when user has no activities', async () => {
      vi.mocked(firestore.getDocumentsByUser).mockResolvedValue([]);

      const result = await ActivitiesService.getActivitiesByUser(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('getActivitiesByChild', () => {
    it('should retrieve activities for a specific child', async () => {
      const mockActivities: Activity[] = [
        {
          id: 'activity-1',
          userId: mockUserId,
          childId: mockChildId,
          title: 'Soccer Practice',
          location: 'Local Park',
          daysOfWeek: [1, 3, 5],
          startTime: '16:00',
          endTime: '17:30',
          timezone: 'America/New_York',
          createdAt: {} as any,
        },
        {
          id: 'activity-2',
          userId: mockUserId,
          childId: 'other-child',
          title: 'Piano Lessons',
          location: 'Music School',
          daysOfWeek: [2, 4],
          startTime: '15:00',
          endTime: '16:00',
          timezone: 'America/New_York',
          createdAt: {} as any,
        },
      ];

      vi.mocked(ChildrenService.getChild).mockResolvedValue(mockChild);
      vi.mocked(firestore.getDocumentsByUser).mockResolvedValue(mockActivities);

      const result = await ActivitiesService.getActivitiesByChild(mockUserId, mockChildId);

      expect(result).toHaveLength(1);
      expect(result[0].childId).toBe(mockChildId);
    });

    it('should throw error when child does not exist', async () => {
      vi.mocked(ChildrenService.getChild).mockResolvedValue(null);

      await expect(
        ActivitiesService.getActivitiesByChild(mockUserId, mockChildId)
      ).rejects.toThrow('Child not found');
    });
  });

  describe('updateActivity', () => {
    const existingActivity: Activity = {
      id: mockActivityId,
      userId: mockUserId,
      childId: mockChildId,
      title: 'Soccer Practice',
      location: 'Local Park',
      daysOfWeek: [1, 3, 5],
      startTime: '16:00',
      endTime: '17:30',
      timezone: 'America/New_York',
      createdAt: {} as any,
    };

    it('should update activity title successfully', async () => {
      const input: UpdateActivityInput = {
        title: 'Advanced Soccer Practice',
      };

      vi.mocked(validation.validateUpdateActivity).mockReturnValue({
        isValid: true,
        errors: [],
      });

      vi.mocked(firestore.getDocument).mockResolvedValue(existingActivity);
      vi.mocked(firestore.updateDocument).mockResolvedValue(undefined);

      await ActivitiesService.updateActivity(mockActivityId, mockUserId, input);

      expect(firestore.updateDocument).toHaveBeenCalledWith(
        firestore.COLLECTIONS.ACTIVITIES,
        mockActivityId,
        { title: 'Advanced Soccer Practice' }
      );
    });

    it('should update activity times successfully', async () => {
      const input: UpdateActivityInput = {
        startTime: '17:00',
        endTime: '18:30',
      };

      vi.mocked(validation.validateUpdateActivity).mockReturnValue({
        isValid: true,
        errors: [],
      });

      vi.mocked(firestore.getDocument).mockResolvedValue(existingActivity);
      vi.mocked(firestore.updateDocument).mockResolvedValue(undefined);

      await ActivitiesService.updateActivity(mockActivityId, mockUserId, input);

      expect(firestore.updateDocument).toHaveBeenCalledWith(
        firestore.COLLECTIONS.ACTIVITIES,
        mockActivityId,
        { startTime: '17:00', endTime: '18:30' }
      );
    });

    it('should update days of week and sort them', async () => {
      const input: UpdateActivityInput = {
        daysOfWeek: [6, 2, 4],
      };

      vi.mocked(validation.validateUpdateActivity).mockReturnValue({
        isValid: true,
        errors: [],
      });

      vi.mocked(firestore.getDocument).mockResolvedValue(existingActivity);
      vi.mocked(firestore.updateDocument).mockResolvedValue(undefined);

      await ActivitiesService.updateActivity(mockActivityId, mockUserId, input);

      expect(firestore.updateDocument).toHaveBeenCalledWith(
        firestore.COLLECTIONS.ACTIVITIES,
        mockActivityId,
        { daysOfWeek: [2, 4, 6] }
      );
    });

    it('should throw error when validation fails', async () => {
      const input: UpdateActivityInput = {
        title: '',
      };

      vi.mocked(validation.validateUpdateActivity).mockReturnValue({
        isValid: false,
        errors: [{ field: 'title', message: 'Activity title is required' }],
      });

      await expect(
        ActivitiesService.updateActivity(mockActivityId, mockUserId, input)
      ).rejects.toThrow('Activity title is required');

      expect(firestore.updateDocument).not.toHaveBeenCalled();
    });

    it('should throw error when activity does not exist', async () => {
      const input: UpdateActivityInput = {
        title: 'Advanced Soccer Practice',
      };

      vi.mocked(validation.validateUpdateActivity).mockReturnValue({
        isValid: true,
        errors: [],
      });

      vi.mocked(firestore.getDocument).mockResolvedValue(null);

      await expect(
        ActivitiesService.updateActivity(mockActivityId, mockUserId, input)
      ).rejects.toThrow('Activity not found');

      expect(firestore.updateDocument).not.toHaveBeenCalled();
    });

    it('should verify new child exists when updating childId', async () => {
      const newChildId = 'new-child-123';
      const input: UpdateActivityInput = {
        childId: newChildId,
      };

      const newChild: Child = {
        id: newChildId,
        familyId: mockUserId,
        name: 'Oliver',
        color: '#ef4444',
        createdAt: {} as any,
      };

      vi.mocked(validation.validateUpdateActivity).mockReturnValue({
        isValid: true,
        errors: [],
      });

      vi.mocked(firestore.getDocument).mockResolvedValue(existingActivity);
      vi.mocked(ChildrenService.getChild).mockResolvedValue(newChild);
      vi.mocked(firestore.updateDocument).mockResolvedValue(undefined);

      await ActivitiesService.updateActivity(mockActivityId, mockUserId, input);

      expect(ChildrenService.getChild).toHaveBeenCalledWith(newChildId);
      expect(firestore.updateDocument).toHaveBeenCalled();
    });

    it('should throw error when new child does not exist', async () => {
      const newChildId = 'new-child-123';
      const input: UpdateActivityInput = {
        childId: newChildId,
      };

      vi.mocked(validation.validateUpdateActivity).mockReturnValue({
        isValid: true,
        errors: [],
      });

      vi.mocked(firestore.getDocument).mockResolvedValue(existingActivity);
      vi.mocked(ChildrenService.getChild).mockResolvedValue(null);

      await expect(
        ActivitiesService.updateActivity(mockActivityId, mockUserId, input)
      ).rejects.toThrow('Selected child not found');

      expect(firestore.updateDocument).not.toHaveBeenCalled();
    });
  });

  describe('deleteActivity', () => {
    it('should delete an activity successfully', async () => {
      const mockActivity: Activity = {
        id: mockActivityId,
        userId: mockUserId,
        childId: mockChildId,
        title: 'Soccer Practice',
        location: 'Local Park',
        daysOfWeek: [1, 3, 5],
        startTime: '16:00',
        endTime: '17:30',
        timezone: 'America/New_York',
        createdAt: {} as any,
      };

      vi.mocked(firestore.getDocument).mockResolvedValue(mockActivity);
      vi.mocked(firestore.deleteDocument).mockResolvedValue(undefined);

      await ActivitiesService.deleteActivity(mockActivityId, mockUserId);

      expect(firestore.deleteDocument).toHaveBeenCalledWith(
        firestore.COLLECTIONS.ACTIVITIES,
        mockActivityId
      );
    });

    it('should throw error when activity does not exist', async () => {
      vi.mocked(firestore.getDocument).mockResolvedValue(null);

      await expect(
        ActivitiesService.deleteActivity(mockActivityId, mockUserId)
      ).rejects.toThrow('Activity not found');

      expect(firestore.deleteDocument).not.toHaveBeenCalled();
    });
  });

  describe('checkTimeConflicts', () => {
    it('should detect time conflicts on same day', async () => {
      const existingActivities: Activity[] = [
        {
          id: 'activity-1',
          userId: mockUserId,
          childId: mockChildId,
          title: 'Soccer Practice',
          location: 'Local Park',
          daysOfWeek: [1, 3, 5],
          startTime: '16:00',
          endTime: '17:30',
          timezone: 'America/New_York',
          createdAt: {} as any,
        },
      ];

      const newActivity: CreateActivityInput = {
        childId: mockChildId,
        title: 'Piano Lessons',
        location: 'Music School',
        daysOfWeek: [1, 2],
        startTime: '17:00',
        endTime: '18:00',
        timezone: 'America/New_York',
      };

      vi.mocked(firestore.getDocumentsByUser).mockResolvedValue(existingActivities);

      const conflicts = await ActivitiesService.checkTimeConflicts(mockUserId, newActivity);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].id).toBe('activity-1');
    });

    it('should not detect conflicts on different days', async () => {
      const existingActivities: Activity[] = [
        {
          id: 'activity-1',
          userId: mockUserId,
          childId: mockChildId,
          title: 'Soccer Practice',
          location: 'Local Park',
          daysOfWeek: [1, 3, 5],
          startTime: '16:00',
          endTime: '17:30',
          timezone: 'America/New_York',
          createdAt: {} as any,
        },
      ];

      const newActivity: CreateActivityInput = {
        childId: mockChildId,
        title: 'Piano Lessons',
        location: 'Music School',
        daysOfWeek: [2, 4],
        startTime: '16:00',
        endTime: '17:00',
        timezone: 'America/New_York',
      };

      vi.mocked(firestore.getDocumentsByUser).mockResolvedValue(existingActivities);

      const conflicts = await ActivitiesService.checkTimeConflicts(mockUserId, newActivity);

      expect(conflicts).toHaveLength(0);
    });

    it('should not detect conflicts when times do not overlap', async () => {
      const existingActivities: Activity[] = [
        {
          id: 'activity-1',
          userId: mockUserId,
          childId: mockChildId,
          title: 'Soccer Practice',
          location: 'Local Park',
          daysOfWeek: [1, 3, 5],
          startTime: '16:00',
          endTime: '17:00',
          timezone: 'America/New_York',
          createdAt: {} as any,
        },
      ];

      const newActivity: CreateActivityInput = {
        childId: mockChildId,
        title: 'Piano Lessons',
        location: 'Music School',
        daysOfWeek: [1, 2],
        startTime: '17:00',
        endTime: '18:00',
        timezone: 'America/New_York',
      };

      vi.mocked(firestore.getDocumentsByUser).mockResolvedValue(existingActivities);

      const conflicts = await ActivitiesService.checkTimeConflicts(mockUserId, newActivity);

      expect(conflicts).toHaveLength(0);
    });

    it('should exclude activity being updated from conflict check', async () => {
      const existingActivities: Activity[] = [
        {
          id: 'activity-1',
          userId: mockUserId,
          childId: mockChildId,
          title: 'Soccer Practice',
          location: 'Local Park',
          daysOfWeek: [1, 3, 5],
          startTime: '16:00',
          endTime: '17:30',
          timezone: 'America/New_York',
          createdAt: {} as any,
        },
      ];

      const updateInput: UpdateActivityInput = {
        daysOfWeek: [1, 3, 5],
        startTime: '16:00',
        endTime: '17:30',
      };

      vi.mocked(firestore.getDocumentsByUser).mockResolvedValue(existingActivities);

      const conflicts = await ActivitiesService.checkTimeConflicts(
        mockUserId,
        updateInput,
        'activity-1'
      );

      expect(conflicts).toHaveLength(0);
    });
  });
});
