// api/send-push.js
// Vercel serverless function — sends web push notifications
// 
// SETUP:
// 1. Install web-push: npm install web-push
// 2. Add environment variables in Vercel Dashboard → Settings → Environment Variables:
//    VAPID_PUBLIC_KEY = BHKkCvC-gXMbDCwjjE-A62bQR8zW4ilqaAAZuvuCdCvQJuzsR2vLxvt-qkvpNgcv_8tGZ4wZXpvqrj0En9m7TuY
//    VAPID_PRIVATE_KEY = (your private key)
//    SUPABASE_URL = https://jfdrpaumemdzkipbbptm.supabase.co
//    SUPABASE_SERVICE_KEY = (your service_role key from Supabase → Settings → API)
//    PUSH_SECRET = (make up a random secret string for auth)
// 3. Place this file at: api/send-push.js in your project root

import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

var vapidPublic = process.env.VAPID_PUBLIC_KEY;
var vapidPrivate = process.env.VAPID_PRIVATE_KEY;
var supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
var supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
var pushSecret = process.env.PUSH_SECRET;

webpush.setVapidDetails(
  'mailto:notifications@civicverify.org',
  vapidPublic,
  vapidPrivate
);

var supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify secret (so only your database can call this)
  var authHeader = req.headers.authorization || '';
  if (authHeader !== 'Bearer ' + pushSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  var { user_id, title, body, url, tag } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id required' });
  }

  try {
    // Get all push subscriptions for this user
    var { data: subscriptions, error: fetchErr } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id);

    if (fetchErr || !subscriptions || subscriptions.length === 0) {
      return res.status(200).json({ sent: 0, message: 'No subscriptions found' });
    }

    var payload = JSON.stringify({
      title: title || 'CivicVerify',
      body: body || 'You have a new notification',
      icon: '/civicverifyicon.png',
      url: url || '/citizen',
      tag: tag || 'civicverify-' + Date.now(),
    });

    var sent = 0;
    var failed = 0;

    for (var sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );
        sent++;
      } catch (err) {
        failed++;
        // If subscription expired (410 Gone), remove it
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id);
        }
        console.error('Push failed for', sub.endpoint.slice(0, 50), err.statusCode);
      }
    }

    return res.status(200).json({ sent, failed, total: subscriptions.length });
  } catch (err) {
    console.error('Push API error:', err);
    return res.status(500).json({ error: err.message });
  }
}