// src/services/plexService.ts
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../errors/AppError';
import { PlexAuthResult, PlexMediaItem } from '../types/plex';

export class PlexService {
  private readonly plexApiUrl = 'https://plex.tv/api/v2';
  private readonly clientIdentifier: string;

  constructor() {
    this.clientIdentifier = process.env.PLEX_CLIENT_IDENTIFIER || uuidv4();
  }

  async getAuthUrl(clientId: string, product: string, platform: string): Promise<string> {
    const params = new URLSearchParams({
      clientID: clientId,
      context: {
        device: platform,
        deviceName: product,
        clientIdentifier: this.clientIdentifier,
        version: '1.0.0'
      } as any,
      'X-Plex-Client-Identifier': this.clientIdentifier,
      'X-Plex-Product': product,
      'X-Plex-Platform': platform
    });

    return `${this.plexApiUrl}/oauth/authorize?${params}`;
  }

  async authenticateWithCode(code: string): Promise<PlexAuthResult> {
    try {
      const response = await axios.post(`${this.plexApiUrl}/oauth/token`, {
        code,
        'X-Plex-Client-Identifier': this.clientIdentifier
      });

      const { access_token } = response.data;
      const userInfo = await this.getPlexUserInfo(access_token);

      return {
        plexId: userInfo.id.toString(),
        email: userInfo.email,
        username: userInfo.username,
        avatar: userInfo.thumb
      };
    } catch (error) {
      throw new AppError(401, 'Plex authentication failed');
    }
  }

  private async getPlexUserInfo(accessToken: string) {
    try {
      const response = await axios.get(`${this.plexApiUrl}/user`, {
        headers: {
          'X-Plex-Token': accessToken,
          'X-Plex-Client-Identifier': this.clientIdentifier
        }
      });

      return response.data;
    } catch (error) {
      throw new AppError(401, 'Failed to fetch Plex user info');
    }
  }

  async searchMedia(query: string, mediaType: 'movie' | 'show', accessToken: string): Promise<PlexMediaItem[]> {
    try {
      const response = await axios.get(`${this.plexApiUrl}/library/search`, {
        params: {
          query,
          type: mediaType,
          'X-Plex-Token': accessToken
        },
        headers: {
          'X-Plex-Client-Identifier': this.clientIdentifier
        }
      });

      return response.data.MediaContainer.Metadata.map(this.transformPlexMedia);
    } catch (error) {
      throw new AppError(500, 'Failed to search Plex media');
    }
  }

  private transformPlexMedia(plexItem: any): PlexMediaItem {
    return {
      id: plexItem.ratingKey,
      title: plexItem.title,
      year: plexItem.year,
      thumb: plexItem.thumb,
      type: plexItem.type,
      summary: plexItem.summary
    };
  }
}
