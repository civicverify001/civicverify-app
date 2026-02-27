// src/utils/pushNotifications.js
// Handles browser push notification subscription
import { supabase } from '../supabaseClient';

// Your VAPID public key
var VAPID_PUBLIC_KEY = 'BHKkCvC-gXMbDCwjjE-A62bQR8zW4ilqaAAZuvuCdCvQJuzsR2vLxvt-qkvpNgcv_8tGZ4wZXpvqrj0En9m7TuY';

// Convert VAPID key to Uint8Array (required by Push API)
function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);
  for (var i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Check if push notifications are supported
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// Get current permission status
export function getPushPermission() {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission; // 'default', 'granted', 'denied'
}

// Subscribe user to push notifications
export async function subscribeToPush(userId) {
  if (!isPushSupported()) {
    console.log('Push not supported');
    return { success: false, reason: 'unsupported' };
  }

  try {
    // Request permission
    var permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, reason: 'denied' };
    }

    // Get service worker registration
    var registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    var existing = await registration.pushManager.getSubscription();
    if (existing) {
      // Already subscribed, just make sure it's saved
      await saveSubscription(userId, existing);
      return { success: true, existing: true };
    }

    // Create new subscription
    var subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // Save to database
    await saveSubscription(userId, subscription);

    return { success: true, existing: false };
  } catch (err) {
    console.error('Push subscription error:', err);
    return { success: false, reason: err.message };
  }
}

// Save subscription to Supabase
async function saveSubscription(userId, subscription) {
  var sub = subscription.toJSON();
  var { error } = await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
  }, {
    onConflict: 'user_id,endpoint',
  });
  if (error) console.error('Save subscription error:', error);
}

// Unsubscribe from push
export async function unsubscribeFromPush(userId) {
  try {
    var registration = await navigator.serviceWorker.ready;
    var subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      // Remove from database
      await supabase.from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', subscription.endpoint);
    }
    return { success: true };
  } catch (err) {
    console.error('Unsubscribe error:', err);
    return { success: false };
  }
}
