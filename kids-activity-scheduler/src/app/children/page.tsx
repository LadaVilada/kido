'use client';

import React from 'react';
import { ChildList } from '@/components/children';

export default function ChildrenPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <ChildList />
      </div>
    </div>
  );
}