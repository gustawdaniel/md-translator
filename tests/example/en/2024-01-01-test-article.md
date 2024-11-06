---
author: Daniel Gustaw
canonicalName: test-article
coverImage: http://localhost:8484/e5269211-5b98-4476-abdf-2196dfc06c7d.avif
description: Simple test article to check how it will be displayed on the page.
excerpt: Simple test article to check how it will be displayed on the page.
publishDate: 2024-01-01
slug: en/test-article
tags:
- test
- openai
- article
title: Test Article
updateDate: 2024-01-01
---

How many times in your live did you implemented login view? I did it too much
times. Finally to no search code to copy in my projects I decided to paste here
easy instruction how to build simple login component in nuxt.

![](http://localhost:8484/6aa24b83-38f2-470e-a682-95fa9766363d.avif)

This setup using strapi as backend, but I will works with any rest API after
body and url modifications. In next part we will create nuxt3 project, build
login page and pass info about user by cookie to profile component.

### Setup Nuxt project

To create project:

```bash
npx nuxi init front_nuxt
```

We can create universal `Makefile` to start project by `make up`

```makefile
node_modules: package.json
	npm i

up: node_modules
	npm run dev
```

Now to start coding we have to replace:

```
<NuxtWelcome />
```

in `app.vue` by

```
<NuxtPage />
```

![](http://localhost:8484/3e5849f5-3225-4a9d-a5f3-5dc3fb8781a5.avif)

### Passing user token between components

To share state between components we can use store like `pinia`, that can be
persisted by `local-sorage`. Other solution is `cookie`. In our case we will
show cokkie implementation because it is build in nuxt and require less lines of
code. In biger projects you should consider pinia as more extendable and
solution but cookies also have advantages in security area.

Let's create two variables by `useCookie` function.

```typescript
const token = useCookie('token');
const user = useCookie('user');
```

now we will watch on data returned from login request

```typescript
watch(data, (value) => {
  token.value = value.jwt;
  user.value = value.user;
});
```
