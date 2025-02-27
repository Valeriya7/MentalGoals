import { defineConfig } from 'vite';
export default({
    optimizeDeps: {
        exclude: [
            '@ionic/core',
            '@ionic/angular',
            'ionicons',
            '@ionic/core/ion-progress-bar.entry.js',
            '@ionic/core/ion-img.entry.js',
            '@ionic/core/ion-radio_2.entry.js',
            '@ionic/core/ion-button_2.entry.js',
            'ion-app', 'ion-progress-bar', 'ion-img', 'ion-radio', 'ion-button'
        ]
    }
});