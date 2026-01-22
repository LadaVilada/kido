import { 
  Activity, 
  CreateActivityInput, 
  UpdateActivityInput,
  Child
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
import { validateCreateActivity, validateUpdateActivity } from '@/lib/validation';
import { ChildrenService } from './childrenService';

/**
 * Service class for managing activities data
 */
export class ActivitiesService {
  /**
   * Creates a new activity
   */
  static async createActivity(
    userId: string, 
    input: CreateActivityInput
  ): Promise<string> {
    // Validate input
    const validation = validateCreateActivity(input);
    if (!validation.isValid) {
      throw new Error(validation.errors.map(e => e.message).join(', '));
    }

    try {
      // Verify child exists
      const child = await ChildrenService.getChild(input.childId);
      if (!child) {
        throw new Error('Selected child not found');
      }
      // Note: Family membership validation is handled by Firestore security rules

      const activityData = {
        userId,
        childId: input.childId,
        title: input.title.trim(),
        location: input.location.trim(),
        daysOfWeek: [...input.daysOfWeek].sort(), // Sort days for consistency
        startTime: input.startTime,
        endTime: input.endTime,
        timezone: input.timezone,
      };

      const activityId = await createDocument(COLLECTIONS.ACTIVITIES, activityData);
      return activityId;
    } catch (error: any) {
      throw new Error(handleFirestoreError(error));
    }
  }

  /**
   * Gets an activity by ID
   */
  static async getActivity(activityId: string): Promise<Activity | null> {
    try {
      return await getDocument<Activity>(COLLECTIONS.ACTIVITIES, activityId);
    } catch (error: any) {
      throw new Error(handleFirestoreError(error));
    }
  }

  /**
   * Gets all activities for a user
   */
  static async getActivitiesByUser(userId: string): Promise<Activity[]> {
    try {
      return await getDocumentsByUser<Activity>(
        COLLECTIONS.ACTIVITIES, 
        userId, 
        'title'
      );
    } catch (error: any) {
      throw new Error(handleFirestoreError(error));
    }
  }

  /**
   * Gets activities for a specific child
   */
  static async getActivitiesByChild(
    userId: string, 
    childId: string
  ): Promise<Activity[]> {
    try {
      // Verify child exists
      const child = await ChildrenService.getChild(childId);
      if (!child) {
        throw new Error('Child not found');
      }
      // Note: Family membership validation is handled by Firestore security rules

      const allActivities = await this.getActivitiesByUser(userId);
      return allActivities.filter(activity => activity.childId === childId);
    } catch (error: any) {
      throw new Error(handleFirestoreError(error));
    }
  }

  /**
   * Updates an activity
   */
  static async updateActivity(
    activityId: string, 
    userId: string,
    input: UpdateActivityInput
  ): Promise<void> {
    // Validate input
    const validation = validateUpdateActivity(input);
    if (!validation.isValid) {
      throw new Error(validation.errors.map(e => e.message).join(', '));
    }

    try {
      // Verify activity belongs to user
      const existingActivity = await this.getActivity(activityId);
      if (!existingActivity) {
        throw new Error('Activity not found');
      }
      if (existingActivity.userId !== userId) {
        throw new Error('You do not have permission to update this activity');
      }

      // If childId is being updated, verify the new child belongs to user
      if (input.childId && input.childId !== existingActivity.childId) {
        const child = await ChildrenService.getChild(input.childId);
        if (!child) {
          throw new Error('Selected child not found');
        }
        if (child.userId !== userId) {
          throw new Error('You do not have permission to assign activities to this child');
        }
      }

      const updateData: Partial<Activity> = {};
      if (input.childId) updateData.childId = input.childId;
      if (input.title) updateData.title = input.title.trim();
      if (input.location) updateData.location = input.location.trim();
      if (input.daysOfWeek) updateData.daysOfWeek = [...input.daysOfWeek].sort();
      if (input.startTime) updateData.startTime = input.startTime;
      if (input.endTime) updateData.endTime = input.endTime;
      if (input.timezone) updateData.timezone = input.timezone;

      await updateDocument(COLLECTIONS.ACTIVITIES, activityId, updateData);
    } catch (error: any) {
      throw new Error(handleFirestoreError(error));
    }
  }

  /**
   * Deletes an activity
   */
  static async deleteActivity(activityId: string, userId: string): Promise<void> {
    try {
      // Verify activity belongs to user
      const existingActivity = await this.getActivity(activityId);
      if (!existingActivity) {
        throw new Error('Activity not found');
      }
      if (existingActivity.userId !== userId) {
        throw new Error('You do not have permission to delete this activity');
      }

      await deleteDocument(COLLECTIONS.ACTIVITIES, activityId);
    } catch (error: any) {
      throw new Error(handleFirestoreError(error));
    }
  }

  /**
   * Deletes all activities for a specific child
   */
  static async deleteActivitiesByChild(
    userId: string, 
    childId: string
  ): Promise<void> {
    try {
      const activities = await this.getActivitiesByChild(userId, childId);
      
      // Delete all activities for this child
      const deletePromises = activities.map(activity => 
        this.deleteActivity(activity.id, userId)
      );
      
      await Promise.all(deletePromises);
    } catch (error: any) {
      throw new Error(handleFirestoreError(error));
    }
  }

  /**
   * Subscribes to real-time updates for user's activities
   */
  static subscribeToActivities(
    userId: string,
    callback: (activities: Activity[]) => void
  ): () => void {
    return subscribeToUserDocuments<Activity>(
      COLLECTIONS.ACTIVITIES,
      userId,
      callback,
      'title'
    );
  }

  /**
   * Subscribes to real-time updates for a specific child's activities
   */
  static subscribeToChildActivities(
    userId: string,
    childId: string,
    callback: (activities: Activity[]) => void
  ): () => void {
    const unsubscribe = this.subscribeToActivities(userId, (allActivities) => {
      const childActivities = allActivities.filter(
        activity => activity.childId === childId
      );
      callback(childActivities);
    });

    return unsubscribe;
  }

  /**
   * Gets activities with their associated child information
   */
  static async getActivitiesWithChildren(userId: string): Promise<(Activity & { child: Child })[]> {
    try {
      const [activities, children] = await Promise.all([
        this.getActivitiesByUser(userId),
        ChildrenService.getChildrenByUser(userId)
      ]);

      const childrenMap = new Map(children.map(child => [child.id, child]));

      return activities
        .map(activity => {
          const child = childrenMap.get(activity.childId);
          if (!child) return null; // Skip activities with missing children
          return { ...activity, child };
        })
        .filter((item): item is Activity & { child: Child } => item !== null);
    } catch (error: any) {
      throw new Error(handleFirestoreError(error));
    }
  }

  /**
   * Checks for time conflicts with existing activities
   */
  static async checkTimeConflicts(
    userId: string,
    input: CreateActivityInput | UpdateActivityInput,
    excludeActivityId?: string
  ): Promise<Activity[]> {
    try {
      const activities = await this.getActivitiesByUser(userId);
      const conflictingActivities: Activity[] = [];

      const daysOfWeek = input.daysOfWeek || [];
      const startTime = input.startTime;
      const endTime = input.endTime;

      if (!daysOfWeek.length || !startTime || !endTime) {
        return conflictingActivities;
      }

      activities.forEach(activity => {
        // Skip the activity being updated
        if (excludeActivityId && activity.id === excludeActivityId) {
          return;
        }

        // Check if activities share any days
        const sharedDays = activity.daysOfWeek.some(day => daysOfWeek.includes(day));
        if (!sharedDays) return;

        // Check for time overlap
        const activityStart = this.timeToMinutes(activity.startTime);
        const activityEnd = this.timeToMinutes(activity.endTime);
        const inputStart = this.timeToMinutes(startTime);
        const inputEnd = this.timeToMinutes(endTime);

        // Check if times overlap
        if (inputStart < activityEnd && activityStart < inputEnd) {
          conflictingActivities.push(activity);
        }
      });

      return conflictingActivities;
    } catch (error: any) {
      throw new Error(handleFirestoreError(error));
    }
  }

  /**
   * Helper function to convert time string to minutes since midnight
   */
  private static timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Gets activity statistics for a user
   */
  static async getActivityStats(userId: string): Promise<{
    totalActivities: number;
    activitiesPerChild: Record<string, number>;
    activitiesPerDay: Record<number, number>;
    totalWeeklyHours: number;
  }> {
    try {
      const [activities, children] = await Promise.all([
        this.getActivitiesByUser(userId),
        ChildrenService.getChildrenByUser(userId)
      ]);

      const childrenMap = new Map(children.map(child => [child.id, child.name]));
      
      const stats = {
        totalActivities: activities.length,
        activitiesPerChild: {} as Record<string, number>,
        activitiesPerDay: {} as Record<number, number>,
        totalWeeklyHours: 0,
      };

      activities.forEach(activity => {
        // Count activities per child
        const childName = childrenMap.get(activity.childId) || 'Unknown';
        stats.activitiesPerChild[childName] = (stats.activitiesPerChild[childName] || 0) + 1;

        // Count activities per day
        activity.daysOfWeek.forEach(day => {
          stats.activitiesPerDay[day] = (stats.activitiesPerDay[day] || 0) + 1;
        });

        // Calculate total weekly hours
        const startMinutes = this.timeToMinutes(activity.startTime);
        const endMinutes = this.timeToMinutes(activity.endTime);
        const durationMinutes = endMinutes - startMinutes;
        const weeklyMinutes = durationMinutes * activity.daysOfWeek.length;
        stats.totalWeeklyHours += weeklyMinutes / 60;
      });

      return stats;
    } catch (error: any) {
      throw new Error(handleFirestoreError(error));
    }
  }
}