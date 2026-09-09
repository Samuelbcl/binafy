import { Config } from '@remotion/cli/config';

// Les narrations synthetisees et les fonds de banque libre vivent dans
// video/public/<slug>/ ; c'est ce dossier que `staticFile()` sert.
Config.setPublicDir('./video/public');
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
