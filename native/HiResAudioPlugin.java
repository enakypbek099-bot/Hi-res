package kz.enakypbek.hires;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "HiResAudio")
public class HiResAudioPlugin extends Plugin {

    private static final String CHANNEL_ID = "hires_playback_channel";
    private static PowerManager.WakeLock wakeLock = null;

    @PluginMethod
    public void startForegroundService(PluginCall call) {
        String title = call.getString("title", "HI-RES Музыка");
        String artist = call.getString("artist", "Lossless Playback");

        Intent serviceIntent = new Intent(getContext(), PlaybackService.class);
        serviceIntent.putExtra("title", title);
        serviceIntent.putExtra("artist", artist);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(serviceIntent);
        } else {
            getContext().startService(serviceIntent);
        }

        acquireWakeLock();
        call.resolve();
    }

    @PluginMethod
    public void stopForegroundService(PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), PlaybackService.class);
        getContext().stopService(serviceIntent);
        releaseWakeLock();
        call.resolve();
    }

    private void acquireWakeLock() {
        if (wakeLock == null) {
            PowerManager pm = (PowerManager) getContext().getSystemService(android.content.Context.POWER_SERVICE);
            if (pm != null) {
                wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "HiRes:AudioWakeLock");
                wakeLock.acquire(3600000L);
            }
        }
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            wakeLock = null;
        }
    }

    public static class PlaybackService extends Service {
        @Override
        public void onCreate() {
            super.onCreate();
            createNotificationChannel();
        }

        @Override
        public int onStartCommand(Intent intent, int flags, int startId) {
            String title = intent != null ? intent.getStringExtra("title") : "HI-RES Музыка";
            String artist = intent != null ? intent.getStringExtra("artist") : "Lossless Playback";

            Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                    .setContentTitle(title)
                    .setContentText(artist)
                    .setSmallIcon(android.R.drawable.ic_media_play)
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
                    .build();

            startForeground(1, notification);
            return START_STICKY;
        }

        @Override
        public IBinder onBind(Intent intent) {
            return null;
        }

        private void createNotificationChannel() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel serviceChannel = new NotificationChannel(
                        CHANNEL_ID,
                        "Hi-Res Background Playback",
                        NotificationManager.IMPORTANCE_LOW
                );
                NotificationManager manager = getSystemService(NotificationManager.class);
                if (manager != null) {
                    manager.createNotificationChannel(serviceChannel);
                }
            }
        }
    }
}
