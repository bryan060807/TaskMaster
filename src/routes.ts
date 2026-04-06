import { route, index } from '@react-router/dev/routes';

export default [
  route('login', 'app/routes/login.tsx'),
  route('sign-up', 'app/routes/sign-up.tsx'),
  route('logout', 'app/routes/logout.tsx'),

  // protected route
  route('protected', 'app/routes/protected.tsx'),

  // root route uses a separate file to avoid duplicate IDs
  index('app/routes/home.tsx'),
];