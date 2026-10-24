import { EventEmitter } from 'events';
import type { Response } from 'express';

export type LiveEventType =
  | 'BOOKING_CREATED'
  | 'BOOKING_UPDATED'
  | 'BOOKING_CANCELLED'
  | 'FLIGHT_STATUS_UPDATED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'HEARTBEAT';

export interface LiveEventPayload {
  type: LiveEventType;
  timestamp: string;
  data?: any;
  message?: string;
}

class BookingEventEmitter extends EventEmitter {}

export const bookingEvents = new BookingEventEmitter();
bookingEvents.setMaxListeners(100);

// Set of active SSE response connections
const activeClients = new Set<Response>();

export function registerLiveClient(res: Response): () => void {
  activeClients.add(res);

  // Send initial connected confirmation
  const initPayload: LiveEventPayload = {
    type: 'HEARTBEAT',
    timestamp: new Date().toISOString(),
    message: 'AeroWings Realtime EventStream Connected',
  };
  res.write(`data: ${JSON.stringify(initPayload)}\n\n`);

  const onEvent = (event: LiveEventPayload) => {
    try {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch {
      activeClients.delete(res);
    }
  };

  bookingEvents.on('event', onEvent);

  const cleanup = () => {
    bookingEvents.off('event', onEvent);
    activeClients.delete(res);
  };

  return cleanup;
}

export function broadcastLiveEvent(type: LiveEventType, data?: any, message?: string): void {
  const payload: LiveEventPayload = {
    type,
    timestamp: new Date().toISOString(),
    data,
    message,
  };

  console.log(`[AeroWings LiveStream] Broadcasting event ${type} to ${activeClients.size} active subscribers`);
  bookingEvents.emit('event', payload);
}

// Periodic heartbeat to keep connections open across proxies and timeouts
setInterval(() => {
  if (activeClients.size > 0) {
    const ping: LiveEventPayload = {
      type: 'HEARTBEAT',
      timestamp: new Date().toISOString(),
    };
    for (const res of activeClients) {
      try {
        res.write(`: ping\n\n`);
      } catch {
        activeClients.delete(res);
      }
    }
  }
}, 25000);
