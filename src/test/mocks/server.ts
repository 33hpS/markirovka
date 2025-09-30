import { setupServer } from 'msw/node';
import { authHandlers } from './authHandlers';
import { labelHandlers } from './labelHandlers';
import { userHandlers } from './userHandlers';

// This configures a request mocking server with the given request handlers
export const server = setupServer(
  ...authHandlers,
  ...labelHandlers,
  ...userHandlers
);