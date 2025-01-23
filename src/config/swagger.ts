// src/config/swagger.ts
import swaggerJSDoc from 'swagger-jsdoc';
import { config } from './environment';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Votarr API',
    version: '1.0.0',
    description: 'API documentation for Votarr - Group Movie/Show Voting Application',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    contact: {
      name: 'API Support',
      email: 'support@votarr.app',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.server.port}`,
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error type',
          },
          message: {
            type: 'string',
            description: 'Error message',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          username: { type: 'string' },
          avatarUrl: { type: 'string' },
        },
      },
      Session: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          status: { type: 'string' },
          hostId: { type: 'string' },
          maxParticipants: { type: 'number' },
          votingTime: { type: 'number' },
          votingStyle: { type: 'string' },
          allowLateJoin: { type: 'boolean' },
          requireConsensus: { type: 'boolean' },
        },
      },
      Vote: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          mediaId: { type: 'string' },
          rank: { type: 'number' },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJSDoc(options);
