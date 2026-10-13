package kz.enakypbek.hires;

import android.content.Context;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.os.Build;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AudioInfo")
public class AudioInfoPlugin extends Plugin {

    @PluginMethod
    public void get(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            AudioManager am = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            if (am != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    String sampleRateStr = am.getProperty(AudioManager.PROPERTY_OUTPUT_SAMPLE_RATE);
                    String framesPerBufferStr = am.getProperty(AudioManager.PROPERTY_OUTPUT_FRAMES_PER_BUFFER);
                    
                    ret.put("outRate", sampleRateStr != null ? Integer.parseInt(sampleRateStr) : 48000);
                    ret.put("outFrames", framesPerBufferStr != null ? Integer.parseInt(framesPerBufferStr) : 192);
                } else {
                    ret.put("outRate", 48000);
                    ret.put("outFrames", 192);
                }

                int maxVol = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
                int curVol = am.getStreamVolume(AudioManager.STREAM_MUSIC);
                ret.put("vol", curVol);
                ret.put("volMax", maxVol);

                JSObject devObj = new JSObject();
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    AudioDeviceInfo[] devices = am.getDevices(AudioManager.GET_DEVICES_OUTPUTS);
                    for (AudioDeviceInfo device : devices) {
                        devObj.put("type", device.getType());
                        devObj.put("name", device.getProductName() != null ? device.getProductName().toString() : "Audio Device");
                        
                        JSArray ratesArr = new JSArray();
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                            int[] rates = device.getSampleRates();
                            for (int r : rates) ratesArr.put(r);
                        }
                        devObj.put("rates", ratesArr);

                        JSArray encArr = new JSArray();
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                            int[] encs = device.getEncodings();
                            for (int e : encs) encArr.put(e);
                        }
                        devObj.put("enc", encArr);

                        JSArray chArr = new JSArray();
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                            int[] chs = device.getChannelCounts();
                            for (int ch : chs) chArr.put(ch);
                        }
                        devObj.put("ch", chArr);
                        break;
                    }
                }
                ret.put("dev", devObj);
            }
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error getting audio info: " + e.getMessage());
        }
    }
}
