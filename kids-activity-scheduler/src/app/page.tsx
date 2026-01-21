'use client';

import { useAuthState } from '@/hooks/useAuthState';
import { AuthPage } from '@/components/auth/AuthPage';
import { useChildren } from '@/hooks/useChildren';
import { useActivities } from '@/hooks/useActivities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Activity, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { getOccurrencesForWeek, getWeekStartDate } from '@/lib/activityOccurrences';

export default function Home() {
  const { user, loading } = useAuthState();
  const { children, isLoading: childrenLoading } = useChildren();
  const { activities, isLoading: activitiesLoading } = useActivities();

  const upcomingActivities = useMemo(() => {
    if (!activities.length || !children.length) return [];
    
    const now = new Date();
    const weekStart = getWeekStartDate(now);
    
    const occurrences = getOccurrencesForWeek(activities, children, weekStart);
    return occurrences
      .filter(occ => occ.startDateTime >= now)
      .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime())
      .slice(0, 5);
  }, [activities, children]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const isDataLoading = childrenLoading || activitiesLoading;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div>
            <h1 className="text-4xl font-bold">Welcome back!</h1>
            <p className="text-muted-foreground mt-2">
              Here's an overview of your family's activities
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Children
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isDataLoading ? '...' : children.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {children.length === 1 ? 'child profile' : 'child profiles'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Activities
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isDataLoading ? '...' : activities.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  recurring activities
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  This Week
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isDataLoading ? '...' : upcomingActivities.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  upcoming activities
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Activities</CardTitle>
              <CardDescription>
                Your next activities this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isDataLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : upcomingActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming activities this week</p>
                  <p className="text-sm mt-2">
                    {children.length === 0 ? (
                      <>Add children to get started</>
                    ) : activities.length === 0 ? (
                      <>Add activities to see them here</>
                    ) : (
                      <>Check back later</>
                    )}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingActivities.map((occurrence, index) => (
                    <div
                      key={`${occurrence.activityId}-${index}`}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className="w-1 h-12 rounded-full"
                          style={{ backgroundColor: occurrence.childColor }}
                        />
                        <div>
                          <h4 className="font-semibold">{occurrence.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {occurrence.childName} • {occurrence.location}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {occurrence.startDateTime.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            at{' '}
                            {occurrence.startDateTime.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Link href="/calendar">
                    <Button variant="outline" className="w-full">
                      View Full Calendar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/children">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Manage Children
                  </CardTitle>
                  <CardDescription>
                    Add or edit child profiles
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/activities">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="mr-2 h-5 w-5" />
                    Manage Activities
                  </CardTitle>
                  <CardDescription>
                    Add or edit activities
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/calendar">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    View Calendar
                  </CardTitle>
                  <CardDescription>
                    See your weekly schedule
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
