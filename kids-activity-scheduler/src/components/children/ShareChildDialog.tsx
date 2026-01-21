'use client';

import React, { useState } from 'react';
import { Child } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, UserPlus, Trash2 } from 'lucide-react';

interface ShareChildDialogProps {
  child: Child;
  onShare: (childId: string, email: string) => Promise<void>;
  onUnshare: (childId: string, userId: string) => Promise<void>;
  onClose: () => void;
  sharedUsers?: Array<{ userId: string; email: string }>;
}

export const ShareChildDialog: React.FC<ShareChildDialogProps> = ({
  child,
  onShare,
  onUnshare,
  onClose,
  sharedUsers = [],
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onShare(child.id, email.trim());
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to share');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnshare = async (userId: string) => {
    if (!confirm('Remove access for this user?')) return;

    try {
      await onUnshare(child.id, userId);
    } catch (err: any) {
      setError(err.message || 'Failed to remove access');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            Share "{child.name}"
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Add user form */}
          <form onSubmit={handleShare} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="share-email">Share with user (by email)</Label>
              <div className="flex gap-2">
                <Input
                  id="share-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  disabled={isSubmitting}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="icon"
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                The user must have an account with this email
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </form>

          {/* Shared users list */}
          <div className="space-y-2">
            <Label>Shared with</Label>
            {sharedUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Not shared with anyone yet
              </p>
            ) : (
              <div className="space-y-2">
                {sharedUsers.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <span className="text-sm">{user.email}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnshare(user.userId)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t">
          <Button onClick={onClose} className="w-full">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
