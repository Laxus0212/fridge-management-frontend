import { TestBed } from '@angular/core/testing';

import { MessageWebsocketService } from './message.websocket.service';

describe('MessageService', () => {
  let service: MessageWebsocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MessageWebsocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
