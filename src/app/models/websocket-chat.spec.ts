import { WebsocketChat } from './websocket-chat';

describe('WebsocketChat', () => {
  it('should create an instance', () => {
    expect(new WebsocketChat(1, 1, 'teszt', 'teszt', 1)).toBeTruthy();
  });
});
