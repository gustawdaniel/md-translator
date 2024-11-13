for file in ../blog/src/content/blog/en/*; do
  echo -e "\n---\n\nProcessing $file\n\n---\n"

  deno -A format.ts "$file"
  deno -A sync.ts "$file" pl
  deno -A main.ts "$file" pl
  deno -A sync.ts "$file" es
  deno -A main.ts "$file" es
done


#for file in ../blog/src/content/blog/pl/*; do
#  echo -e "\n---\n\nProcessing $file\n\n---\n"
#
#  deno -A format.ts "$file"
#  deno -A sync.ts "$file" en
#  deno -A main.ts "$file" en
##  deno -A sync.ts "$file" es
##  deno -A main.ts "$file" es
#done

