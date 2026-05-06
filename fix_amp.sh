#!/bin/bash
find app/ -name "*.tsx" -o -name "*.ts" | while read file; do
  sed -i 's/&amp;\&amp;/\&\&/g' "$file"
done
echo "Fixed all &amp;&amp; occurrences"