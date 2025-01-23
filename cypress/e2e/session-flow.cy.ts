// cypress/e2e/session-flow.cy.ts
import { mockUser, mockSession } from '../../src/utils/testHelpers';

describe('Session Flow', () => {
  beforeEach(() => {
    // Mock Plex authentication
    cy.intercept('POST', '/api/auth/plex', {
      statusCode: 200,
      body: { token: 'mock-token', user: mockUser }
    }).as('plexAuth');

    // Mock session creation
    cy.intercept('POST', '/api/sessions', {
      statusCode: 201,
      body: { success: true, data: mockSession }
    }).as('createSession');

    // Mock WebSocket connection
    cy.intercept('GET', '/ws', {
      statusCode: 101 // Switching protocols
    }).as('wsConnection');

    // Login before each test
    cy.visit('/login');
    cy.get('[data-testid="plex-login-btn"]').click();
    cy.wait('@plexAuth');
  });

  it('creates and joins a session successfully', () => {
    // Create new session
    cy.get('[data-testid="create-session-btn"]').click();
    cy.get('[data-testid="session-name-input"]').type('Movie Night');
    cy.get('[data-testid="create-submit-btn"]').click();
    cy.wait('@createSession');

    // Verify session creation
    cy.url().should('include', '/session/');
    cy.get('[data-testid="session-title"]').should('contain', 'Movie Night');
    cy.get('[data-testid="host-indicator"]').should('contain', mockUser.name);
  });

  it('handles media selection and voting', () => {
    // Mock media search
    cy.intercept('GET', '/api/media/search*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          { id: 'movie1', title: 'Test Movie 1', year: 2024 },
          { id: 'movie2', title: 'Test Movie 2', year: 2023 }
        ]
      }
    }).as('searchMedia');

    // Mock vote submission
    cy.intercept('POST', '/api/votes', {
      statusCode: 201,
      body: { success: true }
    }).as('submitVote');

    // Navigate to existing session
    cy.visit(`/session/${mockSession.id}`);

    // Search and select media
    cy.get('[data-testid="media-search"]').type('test movie');
    cy.wait('@searchMedia');
    cy.get('[data-testid="media-result"]').first().click();

    // Cast vote
    cy.get('[data-testid="vote-up-btn"]').click();
    cy.wait('@submitVote');

    // Verify vote registration
    cy.get('[data-testid="vote-indicator"]').should('have.class', 'voted-up');
  });

  it('manages session participants correctly', () => {
    // Mock participant updates
    cy.intercept('GET', '/api/sessions/*/participants', {
      statusCode: 200,
      body: { success: true, data: [mockUser] }
    }).as('getParticipants');

    // Mock WebSocket messages for participant updates
    const wsMessages = [];
    cy.window().then((win) => {
      win.MockWebSocket = class extends win.WebSocket {
        send(data) {
          wsMessages.push(JSON.parse(data));
        }
      };
    });

    cy.visit(`/session/${mockSession.id}`);
    cy.wait('@getParticipants');

    // Verify participant list
    cy.get('[data-testid="participant-list"]')
      .should('contain', mockUser.name);

    // Test participant removal (for host)
    cy.get('[data-testid="remove-participant-btn"]').first().click();
    cy.get('[data-testid="confirm-remove-btn"]').click();
    cy.get('[data-testid="participant-list"]')
      .should('not.contain', mockUser.name);
  });

  it('handles session settings and permissions', () => {
    // Mock session settings update
    cy.intercept('PATCH', '/api/sessions/*', {
      statusCode: 200,
      body: { success: true, data: { ...mockSession, maxParticipants: 5 } }
    }).as('updateSettings');

    cy.visit(`/session/${mockSession.id}`);

    // Only host should see settings button
    cy.get('[data-testid="session-settings-btn"]').should('exist');

    // Update session settings
    cy.get('[data-testid="session-settings-btn"]').click();
    cy.get('[data-testid="max-participants-input"]').clear().type('5');
    cy.get('[data-testid="save-settings-btn"]').click();
    cy.wait('@updateSettings');

    // Verify settings update
    cy.get('[data-testid="participants-limit"]').should('contain', '5');
  });

  it('handles session completion and results', () => {
    // Mock final vote results
    cy.intercept('GET', '/api/sessions/*/results', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          winner: {
            id: 'movie1',
            title: 'Test Movie 1',
            votes: 3
          },
          allResults: [
            { id: 'movie1', title: 'Test Movie 1', votes: 3 },
            { id: 'movie2', title: 'Test Movie 2', votes: 1 }
          ]
        }
      }
    }).as('getResults');

    cy.visit(`/session/${mockSession.id}`);

    // End session (as host)
    cy.get('[data-testid="end-session-btn"]').click();
    cy.get('[data-testid="confirm-end-btn"]').click();
    cy.wait('@getResults');

    // Verify results display
    cy.get('[data-testid="winner-display"]')
      .should('contain', 'Test Movie 1');
    cy.get('[data-testid="vote-results"]')
      .should('contain', 'Test Movie 2');
  });

  it('handles error states gracefully', () => {
    // Mock failed session load
    cy.intercept('GET', '/api/sessions/*', {
      statusCode: 500,
      body: { success: false, error: 'Server error' }
    }).as('failedSessionLoad');

    cy.visit(`/session/${mockSession.id}`);

    // Verify error display
    cy.get('[data-testid="error-message"]')
      .should('contain', 'Error loading session');
    cy.get('[data-testid="retry-btn"]').should('exist');

    // Test retry functionality
    cy.intercept('GET', '/api/sessions/*', {
      statusCode: 200,
      body: { success: true, data: mockSession }
    }).as('retrySessionLoad');

    cy.get('[data-testid="retry-btn"]').click();
    cy.wait('@retrySessionLoad');
    cy.get('[data-testid="session-title"]')
      .should('contain', mockSession.name);
  });
});
