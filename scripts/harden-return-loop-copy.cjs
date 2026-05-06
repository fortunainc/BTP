const fs = require('fs');

const replacements = new Map([
  ["Someone else has seen something similar.", "Similar anonymous context has appeared."],
  ["Someone tried something similar.", "A similar approach has appeared in anonymous context."],
  ["Someone added what helped in a similar situation.", "Helpful context was added from a similar situation."],
  ["Someone added a workaround that didn't hold up.", "Anonymous context suggests a workaround may not have held up."],
  ["Someone added that this caused other issues later.", "Anonymous context suggests this caused other issues later."],
  ["Someone said this got worse later.", "Anonymous context suggests this got worse later."],
  ["Someone said this stayed manageable.", "Anonymous context suggests this stayed manageable."],
  ["One workaround may not have held up", "A workaround may not have held up"],
  ["This created other issues for someone", "This created other issues in similar anonymous context"],
  ["This stayed manageable in at least one similar situation", "This stayed manageable in similar anonymous context"],
  ["Someone reported this became a bigger issue later.", "Anonymous context suggests this became a bigger issue later."],
  ["There is at least one useful direction from similar context.", "Similar context includes a useful direction."],
  ["At least one workaround did not hold up.", "A workaround did not hold up in similar context."],
  ["Someone reported downstream issues.", "Anonymous context includes downstream issues."],
  ["Someone added structured context after your original submission. The reflection below now includes that signal without exposing identity, count, or timing details.", "Structured anonymous context appeared after your original submission. The reflection below now includes that signal without exposing identity, count, or timing details."],
]);

const files = [
  'lib/operator-return-loop.ts',
  'app/api/insights/reflection/[id]/route.ts',
  'app/insights/reflection/[id]/page.tsx',
];

for (const file of files) {
  const path = `cei-platform/${file}`;
  let content = fs.readFileSync(path, 'utf8');
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  fs.writeFileSync(path, content);
}
console.log('Return-loop public copy hardened.');