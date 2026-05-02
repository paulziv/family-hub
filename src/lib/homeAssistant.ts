import {
  Auth,
  Connection,
  createConnection,
  subscribeEntities,
  HassEntities
} from 'home-assistant-js-websocket';

class HomeAssistantService {
  private connection: Connection | null = null;

  async connect(url: string, token: string) {
    if (this.connection) return this.connection;

    try {
      const auth = new Auth({
        access_token: token,
        expires: new Date(new Date().getTime() + 1e11).getTime(), // Long lived token expiration logic
        hassUrl: url,
        clientId: url,
        refresh_token: "",
        expires_in: 315360000,
      });

      this.connection = await createConnection({ auth });
      
      this.connection.addEventListener('ready', () => {
        console.log('Connected to Home Assistant!');
      });

      this.connection.addEventListener('disconnected', () => {
        console.log('Disconnected from Home Assistant.');
      });

      return this.connection;
    } catch (err) {
      console.error('Failed to connect to Home Assistant', err);
      throw err;
    }
  }

  subscribeToEntities(callback: (entities: HassEntities) => void) {
    if (!this.connection) {
      throw new Error("Cannot subscribe to entities: not connected.");
    }
    return subscribeEntities(this.connection, callback);
  }
}

export const haService = new HomeAssistantService();
