'use client';

import React, { useState, useEffect } from 'react';
import { Family, FamilyMember } from '@/types';
import { FamilyService } from '@/services/familyService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Trash2, Users, Crown } from 'lucide-react';
import { useAuthState } from '@/hooks/useAuthState';

export const FamilySettings: React.FC = () => {
  const { user } = useAuthState();
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadFamily();
  }, [user]);

  const loadFamily = async () => {
    if (!user?.userId) return;

    try {
      setLoading(true);
      const userFamily = await FamilyService.getUserFamily(user.userId);
      setFamily(userFamily);
      if (userFamily) {
        setFamilyName(userFamily.name);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.userId || !user?.email || !familyName.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      await FamilyService.createFamily(user.userId, user.email, familyName.trim());
      setSuccess('Family created successfully!');
      await loadFamily();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family || !email.trim() || !user?.userId) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Send invitation instead of directly adding
      const inviteLink = await FamilyService.inviteFamilyMember(family.id, email.trim(), 'parent');
      
      // Copy link to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(inviteLink);
        setSuccess(`Invitation sent! Link copied to clipboard. Share it with ${email}`);
      } else {
        setSuccess(`Invitation created! Share this link: ${inviteLink}`);
      }
      
      setEmail('');
      await loadFamily();
    } catch (err: any) {
      // If user already exists, try adding directly
      if (err.message.includes('not found')) {
        setError(err.message);
      } else {
        setError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!family) return;
    if (!confirm('Remove this member from your family?')) return;

    try {
      await FamilyService.removeFamilyMember(family.id, userId);
      setSuccess('Member removed successfully');
      await loadFamily();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // No family yet - show create form
  if (!family) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create Your Family</CardTitle>
          <CardDescription>
            Create a family to share children and activities with your partner or caregivers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateFamily} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="family-name">Family Name</Label>
              <Input
                id="family-name"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="The Smith Family"
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <Button type="submit" disabled={isSubmitting || !familyName.trim()}>
              {isSubmitting ? 'Creating...' : 'Create Family'}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Has family - show management UI
  const isOwner = family.createdBy === user?.userId;

  return (
    <div className="space-y-6">
      {/* Family Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {family.name}
          </CardTitle>
          <CardDescription>
            {family.members.length} {family.members.length === 1 ? 'member' : 'members'}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Add Member (Owner only) */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Add Family Member</CardTitle>
            <CardDescription>
              Invite your partner or caregiver by email. They must have an account first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="partner@example.com"
                  disabled={isSubmitting}
                  className="flex-1"
                />
                <Button type="submit" disabled={isSubmitting || !email.trim()}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              {success && (
                <p className="text-sm text-green-600">{success}</p>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Family Members */}
      <Card>
        <CardHeader>
          <CardTitle>Family Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {family.members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {member.role === 'owner' && (
                    <Crown className="w-4 h-4 text-yellow-600" />
                  )}
                  <div>
                    <p className="font-medium">{member.email}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {member.role}
                    </p>
                  </div>
                </div>

                {isOwner && member.userId !== user?.userId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.userId)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {isOwner && family.pendingInvitations && family.pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              Waiting for these users to accept
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {family.pendingInvitations.map((invitation) => (
                <div
                  key={invitation.email}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{invitation.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Invited {invitation.invitedAt.toDate().toLocaleDateString()}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      if (confirm('Cancel this invitation?')) {
                        try {
                          await FamilyService.cancelInvitation(family.id, invitation.email);
                          await loadFamily();
                        } catch (err: any) {
                          setError(err.message);
                        }
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
