const fs = require('fs');
const files = [
  'C:/Users/khali/OneDrive/Desktop/BARAV-QUIZ/barav-main/app/questions/[id]/page.tsx',
  'C:/Users/khali/OneDrive/Desktop/BARAV-QUIZ/barav-main/app/quiz-live/[quizId]/page.tsx',
  'C:/Users/khali/OneDrive/Desktop/BARAV-QUIZ/barav-main/app/quizzes/[id]/page.tsx',
  'C:/Users/khali/OneDrive/Desktop/BARAV-QUIZ/barav-main/app/quizzes/[id]/edit/page.tsx',
  'C:/Users/khali/OneDrive/Desktop/BARAV-QUIZ/barav-main/app/users/[id]/page.tsx'
];
for (let f of files) {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace("export const runtime = 'edge';\r\n'use client';", "'use client';\r\nexport const runtime = 'edge';");
  content = content.replace("export const runtime = 'edge';\n'use client';", "'use client';\nexport const runtime = 'edge';");
  fs.writeFileSync(f, content);
}
console.log('Fixed files');
