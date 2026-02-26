// src/lib/debateApi.js — Frontend helper to call debate-controller edge function
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

// Open the waiting room (5 min before start)
export function openWaitingRoom(debateId) {
  return callDebateController('open_waiting_room', debateId);
}

// Start the debate (triggers AI introduction)
export function startDebate(debateId) {
  return callDebateController('start_debate', debateId);
}

// Advance to next turn (timer expired)
export function nextTurn(debateId) {
  return callDebateController('next_turn', debateId);
}

// Concede remaining time
export function concedeTime(debateId) {
  return callDebateController('concede', debateId);
}

// Update listener count
export function updateListenerCount(debateId, count) {
  return callDebateController('update_listener_count', debateId, { count });
}

