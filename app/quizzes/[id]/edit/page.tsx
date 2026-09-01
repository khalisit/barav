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

      <CreateQuizPage />
    </div>
  );
}
