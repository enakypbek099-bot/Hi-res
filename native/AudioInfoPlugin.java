package kz.enakypbek.hires;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.os.Build;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;

/**
 * Reads real audio data from Android: system mixer rate, active output device,
 * what the device reports it accepts, and the music volume as numbers.
 */
@CapacitorPlugin(name = "AudioInfo")
public class AudioInfoPlugin extends Plugin {

    @PluginMethod
    public void get(PluginCall call) {
        try {
            AudioManager am = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            JSObject o = new JSObject();
            o.put("outRate", toInt(am.getProperty(AudioManager.PROPERTY_OUTPUT_SAMPLE_RATE)));
            o.put("outFrames", toInt(am.getProperty(AudioManager.PROPERTY_OUTPUT_FRAMES_PER_BUFFER)));

            int idx = am.getStreamVolume(AudioManager.STREAM_MUSIC);
            o.put("vol", idx);
            o.put("volMax", am.getStreamMaxVolume(AudioManager.STREAM_MUSIC));

            AudioDeviceInfo active = findActive(am);
            if (active != null) {
                o.put("dev", describe(active));
                if (Build.VERSION.SDK_INT >= 28) {
                    try {
                        float db = am.getStreamVolumeDb(AudioManager.STREAM_MUSIC, idx, active.getType());
                        if (!Float.isNaN(db) && !Float.isInfinite(db)) {
                            o.put("volDb", (double) db);
                        }
                    } catch (Exception ignored) {
                        // volume in dB is optional
                    }
                }
            }
            call.resolve(o);
        } catch (Exception e) {
            call.reject("AudioInfo: " + e.getMessage());
        }
    }

    private AudioDeviceInfo findActive(AudioManager am) {
        if (Build.VERSION.SDK_INT >= 33) {
            try {
                AudioAttributes aa = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build();
                List<AudioDeviceInfo> l = am.getAudioDevicesForAttributes(aa);
                if (l != null && !l.isEmpty()) {
                    return l.get(0);
                }
            } catch (Exception ignored) {
                // fall back to priority search below
            }
        }
        AudioDeviceInfo best = null;
        int bestScore = 0;
        for (AudioDeviceInfo d : am.getDevices(AudioManager.GET_DEVICES_OUTPUTS)) {
            int s = score(d.getType());
            if (s > bestScore) {
                best = d;
                bestScore = s;
            }
        }
        return best;
    }

    private int score(int t) {
        if (t == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP) return 5;
        if (Build.VERSION.SDK_INT >= 31 && (t == AudioDeviceInfo.TYPE_BLE_HEADSET || t == AudioDeviceInfo.TYPE_BLE_SPEAKER)) return 5;
        if (t == AudioDeviceInfo.TYPE_USB_HEADSET || t == AudioDeviceInfo.TYPE_USB_DEVICE) return 4;
        if (t == AudioDeviceInfo.TYPE_WIRED_HEADPHONES || t == AudioDeviceInfo.TYPE_WIRED_HEADSET) return 3;
        if (t == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER) return 1;
        return 0;
    }

    private String kind(int t) {
        if (t == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP || t == AudioDeviceInfo.TYPE_BLUETOOTH_SCO) return "bt";
        if (Build.VERSION.SDK_INT >= 31 && (t == AudioDeviceInfo.TYPE_BLE_HEADSET || t == AudioDeviceInfo.TYPE_BLE_SPEAKER)) return "bt";
        if (t == AudioDeviceInfo.TYPE_WIRED_HEADPHONES || t == AudioDeviceInfo.TYPE_WIRED_HEADSET
                || t == AudioDeviceInfo.TYPE_USB_HEADSET || t == AudioDeviceInfo.TYPE_USB_DEVICE
                || t == AudioDeviceInfo.TYPE_LINE_ANALOG || t == AudioDeviceInfo.TYPE_LINE_DIGITAL) return "wired";
        if (t == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER || t == AudioDeviceInfo.TYPE_BUILTIN_EARPIECE) return "spk";
        return "other";
    }

    private JSObject describe(AudioDeviceInfo d) throws Exception {
        JSObject o = new JSObject();
        CharSequence n = d.getProductName();
        o.put("name", n == null ? "" : n.toString());
        o.put("type", d.getType());
        o.put("kind", kind(d.getType()));

        JSArray rates = new JSArray();
        for (int x : d.getSampleRates()) rates.put(x);
        o.put("rates", rates);

        JSArray enc = new JSArray();
        for (int x : d.getEncodings()) enc.put(x);
        o.put("enc", enc);

        JSArray ch = new JSArray();
        for (int x : d.getChannelCounts()) ch.put(x);
        o.put("ch", ch);
        return o;
    }

    private int toInt(String s) {
        try {
            return s == null ? 0 : Integer.parseInt(s.trim());
        } catch (Exception e) {
            return 0;
        }
    }
}
