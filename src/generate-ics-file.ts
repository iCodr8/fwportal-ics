import {black, white, yellow} from 'colors';
import {config} from 'dotenv';
import process from 'process';

class GenerateIcsFile {
    private configuration: any = {
        fwportalUser: '',
        fwportalPassword: '',
    };

    constructor() {
        // Load dotenv configuration
        config();

        this.configuration.fwportalUser = process.env.FWPORTAL_USER
            ? process.env.FWPORTAL_USER
            : this.configuration.fwportalUser;

        this.configuration.fwportalPassword = process.env.FWPORTAL_PASSWORD
            ? process.env.FWPORTAL_PASSWORD
            : this.configuration.fwportalPassword;


    }

    async init() {
    }

    log(text: string, type?: 'success' | 'warning' | 'error', debugOnly: boolean = false): void {
        if (!this.configuration.debug && debugOnly) {
            return;
        }

        let log;

        switch (type) {
            case 'success':
                log = black.bgGreen(text);
                break;

            case 'warning':
                log = yellow(text);
                break;

            case 'error':
                log = white.bgRed(text);
                break;

            default:
                log = black.bgBlue(text);
                break;
        }

        console.log(log);
    }
}

const generateIcsFile = new GenerateIcsFile();
generateIcsFile.init();
