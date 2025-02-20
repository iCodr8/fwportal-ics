import {black, white, yellow} from 'colors';
import {config} from 'dotenv';
import process from 'process';
import axios, {AxiosInstance} from "axios";
import * as fs from "fs";
import * as ics from "ics";

export type Appointment = {
    DienstplanID: number;
    Bezeichnung: string;
    Gruppe: string;
    Verantwortlicher: string;
    Start: string;
    Ende: string;
    Status: number;
    CanChange: boolean;
    AnzahlTeilnehmer: number;
};

export type Configuration = {
    fwportalUser: string;
    fwportalPassword: string;
    fwportalDeviceId: string;
    fwportalDienststellen: string[];
    fwportalFwmobileVersion: string;
    debug: boolean;
    dataPath: string;
};

class GenerateIcsFile {
    private configuration: Configuration = {
        fwportalUser: '',
        fwportalPassword: '',
        fwportalDeviceId: '',
        fwportalDienststellen: [],
        fwportalFwmobileVersion: '4.1.2',
        debug: false,
        dataPath: './data',
    };

    private fwportalApiUrl = 'https://live.fwportal.de/webapi'

    private http: AxiosInstance;

    private appointments: Record<string, { data: Appointment[] }> = {};

    constructor() {
        // Load dotenv configuration
        config();

        this.configuration.fwportalUser = process.env.FWPORTAL_USER
            ? process.env.FWPORTAL_USER
            : this.configuration.fwportalUser;

        this.configuration.fwportalPassword = process.env.FWPORTAL_PASSWORD
            ? process.env.FWPORTAL_PASSWORD
            : this.configuration.fwportalPassword;

        this.configuration.fwportalDeviceId = process.env.FWPORTAL_DEVICE_ID
            ? process.env.FWPORTAL_DEVICE_ID
            : this.configuration.fwportalDeviceId;

        this.configuration.fwportalDienststellen = process.env.FWPORTAL_DIENSTSTELLEN
            ? process.env.FWPORTAL_DIENSTSTELLEN?.split(',')?.map((idOrIdWithName) => idOrIdWithName)
            : this.configuration.fwportalDienststellen;

        this.configuration.fwportalFwmobileVersion = process.env.FWPORTAL_FWMOBILE_VERSION
            ? process.env.FWPORTAL_FWMOBILE_VERSION
            : this.configuration.fwportalFwmobileVersion;

        this.configuration.debug = process.env.DEBUG === 'true';

        this.http = axios.create({
            baseURL: this.fwportalApiUrl,
            headers: {
                'Host': 'live.fwportal.de',
                'Connection': 'keep-alive',
                'fwmobile_version': this.configuration.fwportalFwmobileVersion,
                'Accept': '*/*',
                'Accept-Language': 'de-DE,de;q=0.9',
                'Content-Type': 'application/json; charset=utf-8',
                'User-Agent': 'FWmobile/165 CFNetwork/1474 Darwin/23.0.0'
            }
        });
    }

    async init() {
        await this.authenticate();
        await this.loadAppointments();
        await this.generateIcsFiles();
    }

    async authenticate() {
        this.log(`Authentifizieren`);
        return this.http.post('/v3/authentication/Auth', {
            Username: this.configuration.fwportalUser,
            Password: this.configuration.fwportalPassword,
            DeviceID: this.configuration.fwportalDeviceId,
        })
            .then((response) => {
                this.log('Authentifikation erfolgreich', 'success');
                this.http.defaults.headers.common['bearer'] = response.data.AccessToken;
            });
    }

    async loadAppointments() {
        this.log(`Lade Dienste (${this.configuration.fwportalDienststellen.join(', ')})`);

        const allIds = this.configuration.fwportalDienststellen.map((nameAndIds: string) => {
            const ids = nameAndIds.split('|')[1];

            return ids.split('.').map((id) => Number(id));
        }).flat();

        const uniqueIds = allIds.filter((value, index, array) => array.indexOf(value) === index);

        return Promise.all(uniqueIds.map((id) => this.loadAppointmentsByDepartment(id)));
    }

    async loadAppointmentsByDepartment(departmentId: number) {
        const currentYear = new Date().getFullYear();
        this.log(`Lade Dienste für #${departmentId}`);

        return this.http.get<Appointment[]>(`/v2/GetDienste?id=${departmentId}&Jahr=${currentYear}&Monat=-1`)
            .then((response) => {
                this.log(`Dienste für #${departmentId} erfolgreich geladen`, 'success');
                this.appointments[departmentId] = {
                    data: response.data,
                };
            })
            .catch(() => {
                this.log(`Dienste für #${departmentId} konnten nicht geladen werden!`, 'error');
            });
    }

    async generateIcsFiles() {
        this.log('Dateien erzeugen');

        this.configuration.fwportalDienststellen.map((nameAndIds: string) => {
            const [departmentName, idsString] = nameAndIds.split('|');
            const ids = idsString.split('.').map((id) => Number(id));
            const appointments = ids.flatMap((id) => this.appointments[id]?.data)
                .sort((a, b) => {
                    if (a.Ende > b.Ende) {
                        return 1;
                    } else if (a.Ende < b.Ende) {
                        return -1;
                    }

                    return 0;
                })
                .sort((a, b) => {
                    if (a.Start > b.Start) {
                        return 1;
                    } else if (a.Start < b.Start) {
                        return -1;
                    }

                    return 0;
                });

            const {error, value} = ics.createEvents(
                appointments.map(
                    (appointment) => {
                        const start = new Date(appointment.Start);
                        const end = new Date(appointment.Ende);

                        return {
                            title: appointment.Bezeichnung,
                            description: `GF: ${appointment.Verantwortlicher}`,
                            start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), start.getHours(), start.getMinutes()],
                            end: [end.getFullYear(), end.getMonth() + 1, end.getDate(), end.getHours(), end.getMinutes()],
                        };
                    }
                )
            );

            if (error) {
                this.log(`ics Datei für #${departmentName} konnte nicht erzeugt werden!`, 'error');

                return
            }

            fs.writeFileSync(`${this.configuration.dataPath}/${departmentName}.ics`, value);
            this.log(`Datei für #${departmentName} wurde erzeugt`, 'success');
        });
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
