import { io } from 'socket.io-client';
import supabase from './supabaseClient';

class RealtimeBridge {
  constructor() {
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || '/';
    try {
      this.socket = io(this.backendUrl, {
        reconnectionAttempts: 5,
        timeout: 5000,
        transports: ['websocket', 'polling']
      });
    } catch (e) {
      console.warn("Socket.io init fallback:", e);
      this.socket = {
        on: () => {},
        off: () => {},
        emit: () => {},
        connected: false
      };
    }

    this.listeners = new Map(); // event -> Set(callbacks)
    this.currentUser = null;
    this.signalingChannel = null;
    this.chatChannel = null;
    this.presenceChannel = null;
    this.groupCallChannel = null;
    this.seenEvents = new Set();

    this.initSupabaseChannels();
    this.bridgeSocketEvents();
  }

  setCurrentUser(user) {
    if (!user) return;
    this.currentUser = user;
    this.trackPresence(user);
  }

  initSupabaseChannels() {
    try {
      // 1. WebRTC Signaling Channel for Audio & Video Calls
      this.signalingChannel = supabase.channel('call_signaling_mesh', {
        config: { broadcast: { ack: false, self: false } }
      });

      this.signalingChannel
        .on('broadcast', { event: 'call_user' }, ({ payload }) => {
          if (this.currentUser && (payload.userToCall === this.currentUser.id || payload.userToCall === this.currentUser._id)) {
            this.trigger('call_incoming', {
              from: payload.from,
              name: payload.name,
              signal: payload.signalData,
              callType: payload.callType
            });
          }
        })
        .on('broadcast', { event: 'answer_call' }, ({ payload }) => {
          if (this.currentUser && (payload.to === this.currentUser.id || payload.to === this.currentUser._id)) {
            this.trigger('call_accepted', payload.signal);
          }
        })
        .on('broadcast', { event: 'ice_candidate' }, ({ payload }) => {
          if (this.currentUser && (payload.to === this.currentUser.id || payload.to === this.currentUser._id)) {
            this.trigger('ice_candidate', {
              from: payload.from,
              candidate: payload.candidate
            });
          }
        })
        .on('broadcast', { event: 'end_call' }, ({ payload }) => {
          if (this.currentUser && (payload.to === this.currentUser.id || payload.to === this.currentUser._id)) {
            this.trigger('call_ended', payload);
          }
        })
        .on('broadcast', { event: 'decline_call' }, ({ payload }) => {
          if (this.currentUser && (payload.to === this.currentUser.id || payload.to === this.currentUser._id)) {
            this.trigger('call_declined', payload);
          }
        })
        .subscribe();

      // 2. Chat Realtime Broadcast Channel
      this.chatChannel = supabase.channel('chat_broadcast_mesh', {
        config: { broadcast: { ack: false, self: false } }
      });

      this.chatChannel
        .on('broadcast', { event: 'receive_message' }, ({ payload }) => {
          this.trigger('receive_message', payload);
        })
        .on('broadcast', { event: 'receive_private_message' }, ({ payload }) => {
          if (this.currentUser && (payload.recipientId === this.currentUser.id || payload.senderId === this.currentUser.id)) {
            this.trigger('receive_private_message', payload);
          }
        })
        .on('broadcast', { event: 'receive_group_message' }, ({ payload }) => {
          this.trigger('receive_group_message', payload);
        })
        .on('broadcast', { event: 'message_deleted' }, ({ payload }) => {
          this.trigger('message_deleted', payload);
        })
        .on('broadcast', { event: 'message_pinned' }, ({ payload }) => {
          this.trigger('message_pinned', payload);
        })
        .on('broadcast', { event: 'chat_cleared' }, ({ payload }) => {
          this.trigger('chat_cleared', payload);
        })
        .subscribe();

      // 3. Group Call Signaling Channel
      this.groupCallChannel = supabase.channel('group_calls_mesh', {
        config: { broadcast: { ack: false, self: false } }
      });

      this.groupCallChannel
        .on('broadcast', { event: 'group_call_joined' }, ({ payload }) => {
          this.trigger('group_call_joined', payload);
        })
        .on('broadcast', { event: 'group_call_user_joined' }, ({ payload }) => {
          this.trigger('group_call_user_joined', payload);
        })
        .on('broadcast', { event: 'group_call_signal' }, ({ payload }) => {
          if (this.currentUser && (payload.toSocketId === this.currentUser.id || payload.toUserId === this.currentUser.id)) {
            this.trigger('group_call_signal', payload);
          }
        })
        .on('broadcast', { event: 'group_call_ice_candidate' }, ({ payload }) => {
          if (this.currentUser && (payload.toSocketId === this.currentUser.id || payload.toUserId === this.currentUser.id)) {
            this.trigger('group_call_ice_candidate', payload);
          }
        })
        .on('broadcast', { event: 'group_call_user_left' }, ({ payload }) => {
          this.trigger('group_call_user_left', payload);
        })
        .on('broadcast', { event: 'group_call_ended' }, ({ payload }) => {
          this.trigger('group_call_ended', payload);
        })
        .subscribe();

      // 4. Postgres DB Change Listener for Messages
      supabase.channel('public_messages_db')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const msg = payload.new;
          if (!msg) return;
          if (msg.room === 'home_chat') {
            this.trigger('receive_message', msg);
          } else if (msg.recipientId) {
            if (this.currentUser && (msg.recipientId === this.currentUser.id || msg.senderId === this.currentUser.id)) {
              this.trigger('receive_private_message', msg);
            }
          } else {
            this.trigger('receive_group_message', msg);
          }
        })
        .subscribe();

    } catch (err) {
      console.warn("Supabase Realtime init notice:", err);
    }
  }

  trackPresence(user) {
    if (!user || !user.id) return;
    try {
      if (this.presenceChannel) {
        supabase.removeChannel(this.presenceChannel);
      }
      this.presenceChannel = supabase.channel('online_users_presence', {
        config: { presence: { key: user.id } }
      });

      this.presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = this.presenceChannel.presenceState();
          const onlineIds = Object.keys(state);
          this.trigger('presence_sync', onlineIds);
        })
        .on('presence', { event: 'join' }, ({ key }) => {
          this.trigger('user_online', key);
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          this.trigger('user_offline', key);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await this.presenceChannel.track({
              userId: user.id,
              username: user.username,
              onlineAt: new Date().toISOString()
            });
          }
        });
    } catch (e) {
      console.warn("Presence tracking error:", e);
    }
  }

  bridgeSocketEvents() {
    const eventsToBridge = [
      'connect', 'disconnect',
      'receive_message', 'receive_private_message', 'receive_group_message',
      'chat_cleared', 'message_deleted', 'message_pinned',
      'call_incoming', 'call_accepted', 'ice_candidate', 'call_ended', 'call_declined',
      'stranger_match', 'stranger_left', 'user_status_change',
      'group_call_status_update', 'group_call_ended', 'group_call_joined',
      'group_call_user_joined', 'group_call_signal', 'group_call_ice_candidate', 'group_call_user_left'
    ];

    eventsToBridge.forEach(event => {
      this.socket.on(event, (data) => {
        this.trigger(event, data);
      });
    });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return this;
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      if (callback) {
        this.listeners.get(event).delete(callback);
      } else {
        this.listeners.delete(event);
      }
    }
    return this;
  }

  trigger(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in listener for ${event}:`, err);
        }
      });
    }
  }

  emit(event, data = {}) {
    // 1. Emit on socket.io if connected
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }

    // 2. Broadcast over Supabase Realtime Channels
    try {
      // Call signaling events
      if (['call_user', 'answer_call', 'ice_candidate', 'end_call', 'decline_call'].includes(event)) {
        if (this.signalingChannel) {
          this.signalingChannel.send({
            type: 'broadcast',
            event,
            payload: data
          });
        }
      }

      // Chat broadcast events
      if (event === 'send_message') {
        if (this.chatChannel) {
          this.chatChannel.send({
            type: 'broadcast',
            event: 'receive_message',
            payload: data
          });
        }
      } else if (event === 'send_private_message') {
        if (this.chatChannel) {
          this.chatChannel.send({
            type: 'broadcast',
            event: 'receive_private_message',
            payload: data
          });
        }
      } else if (event === 'send_group_message') {
        if (this.chatChannel) {
          this.chatChannel.send({
            type: 'broadcast',
            event: 'receive_group_message',
            payload: data
          });
        }
      } else if (['delete_message', 'pin_message', 'clear_chat'].includes(event)) {
        if (this.chatChannel) {
          this.chatChannel.send({
            type: 'broadcast',
            event: event === 'delete_message' ? 'message_deleted' : event === 'pin_message' ? 'message_pinned' : 'chat_cleared',
            payload: data
          });
        }
      }

      // Group call events
      if (['join_group_call', 'group_call_signal', 'group_call_ice_candidate', 'leave_group_call', 'end_group_call'].includes(event)) {
        if (this.groupCallChannel) {
          const mappedEvent = event === 'leave_group_call' ? 'group_call_user_left' : event === 'end_group_call' ? 'group_call_ended' : event;
          this.groupCallChannel.send({
            type: 'broadcast',
            event: mappedEvent,
            payload: {
              ...data,
              fromUserId: this.currentUser?.id,
              fromUsername: this.currentUser?.username
            }
          });
        }
      }
    } catch (e) {
      console.warn("Realtime broadcast notice:", e);
    }
  }

  get connected() {
    return (this.socket && this.socket.connected) || true;
  }
}

export const realtimeSocket = new RealtimeBridge();
export default realtimeSocket;
