'use client';

import { useRouter, useParams } from 'next/navigation';
import { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import CreateQuizPage from '@/app/quizzes/create/page';

export default function EditQuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;
  const _quizId = quizId;
  return (
    <div>
      <div className="mb-4 flex items-center">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> Back to quizzes
        </button>
      </div>
      <CreateQuizPage />
    </div>
  );
}
