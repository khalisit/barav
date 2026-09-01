const fs = require('fs');
const files = [
  'C:/Users/khali/OneDrive/Desktop/BARAV-QUIZ/barav-main/app/questions/[id]/page.tsx',
  'C:/Users/khali/OneDrive/Desktop/BARAV-QUIZ/barav-main/app/quiz-live/[quizId]/page.tsx',
  'C:/Users/khali/OneDrive/Desktop/BARAV-QUIZ/barav-main/app/quizzes/[id]/page.tsx',
  'C:/Users/khali/OneDrive/Desktop/BARAV-QUIZ/barav-main/app/quizzes/[id]/edit/page.tsx',
  'C:/Users/khali/OneDrive/Desktop/BARAV-QUIZ/barav-main/app/users/[id]/page.tsx'
];

for(const file of files) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        if (!content.includes("export const runtime = 'edge'")) {
            fs.writeFileSync(file, "export const runtime = 'edge';\n" + content);
        }
    } else {
        console.log("Not found: " + file);
    }
}
