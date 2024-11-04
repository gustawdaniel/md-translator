for file in ../blog/src/content/blog/en/*; do
  deno -A format.ts "$file"
done