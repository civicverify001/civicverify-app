// src/lib/debateApi.js — Frontend helper for debate-controller edge function
// Phase 4: Audio, auto-timer, transcription, admin
import { supabase } from '../supabaseClient';

const FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1/debate-controller';

async function callDebateController(action, debateId, extras = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const body = {
    action,
    debate_id: debateId,
    user_id: session?.user?.id || null,
    ...extras,
  };

  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + (token || ''),
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ─── Debate Lifecycle ───
export function openWaitingRoom(debateId) {
  return callDebateController('open_waiting_room', debateId);
}

export function startDebate(debateId) {
  return callDebateController('start_debate', debateId);
}

export function nextTurn(debateId) {
  return callDebateController('next_turn', debateId);
}

export function concedeTime(debateId) {
  return callDebateController('concede', debateId);
}

export function updateListenerCount(debateId, count) {
  return callDebateController('update_listener_count', debateId, { count });
}

// ─── Audio (Daily.co) ───
export function createAudioRoom(debateId) {
  return callDebateController('create_audio_room', debateId);
}

export function getDailyToken(debateId) {
  return callDebateController('get_daily_token', debateId);
}

// ─── Transcription & Summary ───
export function generateSummary(debateId) {
  return callDebateController('generate_summary', debateId);
}

// ─── Admin Actions ───
export function adminCancelDebate(debateId) {
  return callDebateController('admin_cancel', debateId);
}

export function adminFlagMessage(debateId, messageId) {
  return callDebateController('admin_flag_message', debateId, { message_id: messageId });
}

