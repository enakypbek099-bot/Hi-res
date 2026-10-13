package kz.enakypbek.hires;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AudioInfoPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
