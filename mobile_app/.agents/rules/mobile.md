# SilverRealEstate Mobile App Rules

These rules apply to this Expo/React Native mobile application.

## Architecture

- Understand the existing project structure before creating files.
- Reuse existing components, hooks, utilities, services, and patterns.
- Do not create abstractions unless they solve a real repeated problem.
- Do not duplicate existing functionality.
- Keep changes limited to the mobile app unless explicitly requested.

## Expo / React Native

- Prefer Expo and React Native APIs before adding dependencies.
- Do not install a package for functionality already provided by Expo, React Native, or an existing dependency.
- Follow the existing Expo project conventions.
- Do not modify native configuration unless the feature actually requires it.

## Performance

- Do not perform premature optimization.
- Find the actual bottleneck before optimizing.
- Avoid unnecessary React re-renders.
- Avoid unnecessary state.
- Use FlatList/SectionList for large lists instead of rendering large arrays directly.
- Avoid expensive calculations during render.
- Use memoization only when there is a demonstrated benefit.
- Optimize images and network requests when they are actually causing performance problems.

## Code Cleanup

- Remove unused imports, variables, functions, components, and dependencies when it is safe.
- Prefer deletion over adding another abstraction.
- Consolidate duplicated logic when it is genuinely duplicated.
- Keep components reasonably focused.
- Do not rewrite working code merely to make it look different.

## API / Data

- Reuse existing API/service functions.
- Do not create duplicate API clients.
- Handle loading, error, empty, and success states where required.
- Never remove validation or error handling merely to reduce code.

## Security

Never remove or weaken:

- authentication
- authorization
- input validation
- secure storage
- API security
- error handling
- user privacy

## Before finishing a change

- Check for unused imports and variables.
- Check TypeScript errors.
- Check ESLint errors.
- Check that existing functionality still works.
- Keep the final diff as small as reasonably possible.
