import type {
  User,
  Quiz,
  Question,
  Category,
  LeaderboardEntry,
  NotificationItem,
  MediaItem,
  AuditLog,
  Report,
} from '@/lib/types';

const firstNames = ['Sarah', 'Mike', 'Emma', 'David', 'Lisa', 'James', 'Anna', 'Tom', 'Lucy', 'Kevin', 'Maria', 'Chris', 'Sophie', 'Ryan', 'Jenna', 'Alex', 'Noah', 'Olivia', 'Ethan', 'Ava'];
const lastNames = ['Chen', 'Johnson', 'Wilson', 'Kim', 'Park', 'Brown', 'Davis', 'Miller', 'Wilson', 'Garcia', 'Lopez', 'Lee', 'Taylor', 'Anderson', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Wright', 'Adams'];
const quizTitles = ['World Capitals', 'Science Basics', 'History Masters', 'Math Challenge', 'Pop Culture Trivia', 'Geography Genius', 'Literature Quiz', 'Sports Legends', 'Music Theory', 'Art History', 'Space Exploration', 'Animal Kingdom', 'Food & Cuisine', 'Tech Innovations', 'Movie Trivia'];
const categories = ['General', 'Science', 'History', 'Geography', 'Sports', 'Music', 'Movies', 'Literature', 'Technology', 'Art'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date.toISOString();
}

function randomFutureDate(daysAhead: number): string {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * daysAhead));
  return date.toISOString();
}

export function generateUsers(count = 50): User[] {
  return Array.from({ length: count }, (_, i) => {
    const name = `${randomItem(firstNames)} ${randomItem(lastNames)}`;
    const statuses: User['status'][] = ['active', 'active', 'active', 'active', 'banned', 'suspended'];
    return {
      id: `usr_${String(i + 1).padStart(4, '0')}`,
      name,
      email: `${name.toLowerCase().replace(' ', '.')}@email.com`,
      avatarUrl: null,
      role: i === 0 ? 'super_admin' : i < 3 ? 'admin' : i < 6 ? 'moderator' : 'user',
      status: randomItem(statuses),
      quizzesPlayed: Math.floor(Math.random() * 200),
      quizzesWon: Math.floor(Math.random() * 50),
      totalPoints: Math.floor(Math.random() * 10000),
      joinedAt: randomDate(365),
      lastActiveAt: randomDate(7),
    };
  });
}

export function generateQuizzes(count = 30): Quiz[] {
  const statuses: Quiz['status'][] = ['draft', 'published', 'scheduled', 'running', 'finished', 'archived'];
  const difficulties: Quiz['difficulty'][] = ['easy', 'medium', 'hard'];
  return Array.from({ length: count }, (_, i) => {
    const title = randomItem(quizTitles);
    return {
      id: `qz_${String(i + 1).padStart(4, '0')}`,
      title: i < quizTitles.length ? quizTitles[i] : `${title} Vol. ${Math.floor(i / quizTitles.length) + 1}`,
      description: `A comprehensive quiz about ${title.toLowerCase()}.`,
      categoryId: `cat_${String(categories.indexOf(randomItem(categories)) + 1).padStart(3, '0')}`,
      categoryName: randomItem(categories),
      status: randomItem(statuses),
      difficulty: randomItem(difficulties),
      questionCount: Math.floor(Math.random() * 30) + 5,
      participantCount: Math.floor(Math.random() * 500),
      duration: Math.floor(Math.random() * 30) + 5,
      scheduledAt: Math.random() > 0.5 ? randomFutureDate(14) : null,
      createdAt: randomDate(90),
      updatedAt: randomDate(7),
    };
  });
}

export function generateQuestions(count = 20): Question[] {
  const types: Question['type'][] = ['multiple_choice', 'true_false', 'image', 'audio'];
  const questionTexts = [
    'What is the capital of France?',
    'Which planet is known as the Red Planet?',
    'Who wrote "Romeo and Juliet"?',
    'What is the chemical symbol for gold?',
    'In which year did World War II end?',
    'What is the largest ocean on Earth?',
    'Who painted the Mona Lisa?',
    'What is the square root of 144?',
    'Which country hosted the 2016 Olympics?',
    'What is the tallest mountain in the world?',
  ];
  return Array.from({ length: count }, (_, i) => {
    const type = randomItem(types);
    const isTrueFalse = type === 'true_false';
    return {
      id: `qn_${String(i + 1).padStart(4, '0')}`,
      quizId: `qz_${String(Math.floor(Math.random() * 30) + 1).padStart(4, '0')}`,
      type,
      text: questionTexts[i % questionTexts.length],
      options: isTrueFalse
        ? [
            { id: 'a', text: 'True', isCorrect: Math.random() > 0.5 },
            { id: 'b', text: 'False', isCorrect: Math.random() <= 0.5 },
          ]
        : [
            { id: 'a', text: 'Option A', isCorrect: true },
            { id: 'b', text: 'Option B', isCorrect: false },
            { id: 'c', text: 'Option C', isCorrect: false },
            { id: 'd', text: 'Option D', isCorrect: false },
          ],
      explanation: 'This is the detailed explanation for the correct answer.',
      points: Math.floor(Math.random() * 20) + 5,
      timer: Math.floor(Math.random() * 60) + 15,
      mediaUrl: type === 'image' || type === 'audio' ? 'https://example.com/media.mp3' : null,
      createdAt: randomDate(30),
    };
  });
}

export function generateCategories(): Category[] {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-purple-500', 'bg-red-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'];
  return categories.map((name, i) => ({
    id: `cat_${String(i + 1).padStart(3, '0')}`,
    name,
    description: `Quiz questions about ${name.toLowerCase()}.`,
    color: colors[i],
    icon: 'FolderTree',
    quizCount: Math.floor(Math.random() * 20) + 3,
    questionCount: Math.floor(Math.random() * 200) + 20,
    createdAt: randomDate(120),
  }));
}

export function generateLeaderboard(count = 50): LeaderboardEntry[] {
  return Array.from({ length: count }, (_, i) => {
    const name = `${randomItem(firstNames)} ${randomItem(lastNames)}`;
    return {
      id: `lb_${String(i + 1).padStart(4, '0')}`,
      rank: i + 1,
      name,
      avatarUrl: null,
      totalPoints: Math.floor(Math.random() * 10000) + (count - i) * 50,
      quizzesWon: Math.floor(Math.random() * 100),
      winRate: Math.floor(Math.random() * 40) + 50,
      quizzesPlayed: Math.floor(Math.random() * 200) + 20,
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}

export function generateNotifications(count = 20): NotificationItem[] {
  const templates = [
    { title: 'New user registered', message: 'A new user just joined the platform.', type: 'info' as const },
    { title: 'Quiz published', message: 'A new quiz has been published.', type: 'success' as const },
    { title: 'High server load', message: 'Server CPU usage is above 80%.', type: 'warning' as const },
    { title: 'Payment failed', message: 'A subscription payment failed to process.', type: 'error' as const },
  ];
  return Array.from({ length: count }, (_, i) => {
    const t = randomItem(templates);
    return {
      id: `ntf_${String(i + 1).padStart(4, '0')}`,
      title: t.title,
      message: t.message,
      type: t.type,
      read: Math.random() > 0.5,
      createdAt: randomDate(7),
    };
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function generateMedia(count = 24): MediaItem[] {
  const types: MediaItem['type'][] = ['image', 'audio', 'video'];
  return Array.from({ length: count }, (_, i) => ({
    id: `med_${String(i + 1).padStart(4, '0')}`,
    name: `media-file-${i + 1}.${randomItem(['jpg', 'mp3', 'mp4', 'png'])}`,
    type: randomItem(types),
    url: `https://example.com/media-${i + 1}`,
    size: Math.floor(Math.random() * 5000) + 100,
    uploadedAt: randomDate(30),
  }));
}

export function generateAuditLogs(count = 30): AuditLog[] {
  const actions = ['login', 'logout', 'create_quiz', 'update_quiz', 'delete_user', 'ban_user', 'publish_quiz', 'start_room', 'update_settings'];
  return Array.from({ length: count }, (_, i) => {
    const name = `${randomItem(firstNames)} ${randomItem(lastNames)}`;
    return {
      id: `log_${String(i + 1).padStart(4, '0')}`,
      userId: `usr_${String(Math.floor(Math.random() * 50) + 1).padStart(4, '0')}`,
      userName: name,
      action: randomItem(actions),
      resource: randomItem(['User', 'Quiz', 'Question', 'Settings']),
      resourceId: `res_${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
      ipAddress: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      createdAt: randomDate(7),
    };
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function generateReports(count = 10): Report[] {
  const types: Report['type'][] = ['users', 'quizzes', 'revenue', 'performance', 'engagement'];
  const statuses: Report['status'][] = ['generated', 'scheduled', 'failed'];
  const formats: Report['format'][] = ['pdf', 'csv', 'xlsx'];
  return Array.from({ length: count }, (_, i) => ({
    id: `rpt_${String(i + 1).padStart(4, '0')}`,
    title: `${randomItem(types)} report ${i + 1}`,
    type: randomItem(types),
    status: randomItem(statuses),
    format: randomItem(formats),
    createdAt: randomDate(30),
    downloadUrl: Math.random() > 0.3 ? `https://example.com/reports/${i + 1}` : null,
  }));
}
