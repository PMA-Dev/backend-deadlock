import 'reflect-metadata';
import { injectable } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import axios from 'axios';
import { CommonConfig, CommonConfigKeys } from './CommonConfig';

const config = new CommonConfig();

const getLoggingEndpoint = () =>
    config.getByKey(CommonConfigKeys.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT);
const getLoggingPassword = () =>
    config.getByKey(CommonConfigKeys.OTEL_EXPORTER_OTLP_TRACES_AUTH);
const getLoggingEmail = () =>
    config.getByKey(CommonConfigKeys.OTEL_EXPORTER_OTLP_TRACES_EMAIL);

// b64 encode the email and password
const getLoggingAuth = () =>
    Buffer.from(
        `${getLoggingEmail()}:${getLoggingPassword()}`,
        'binary'
    ).toString('base64');

@injectable()
export class Logger {
    private logSlug?: string;
    private logFilePath = path.join(__dirname, '../../logs.json');

    public setup(logSlug: string, isFile: boolean = false) {
        this.logSlug = isFile ? getSlugForFile(logSlug) : logSlug;
        return this;
    }

    private formatLog(level: LogLevel, ...data: any[]): LogData {
        const message = data
            .map((item) =>
                typeof item === 'object' ? JSON.stringify(item) : String(item)
            )
            .join(' ');

        // get full filename, if it includes marker set env to PPE else LOCAL
        const environment = __filename.includes('snapshot')
            ? LogEnv.PPE
            : LogEnv.LOCAL;

        const logObject = {
            requestId: uuidv4(),
            TimeGenerated: new Date().toISOString(),
            level,
            message,
            slug: this.logSlug || '',
            environment,
        };
        return logObject;
    }

    private async sendLog(logData: LogData): Promise<void> {
        if (
            !getLoggingEndpoint() ||
            !getLoggingPassword() ||
            !getLoggingEmail()
        ) {
            console.error('Logging endpoint, password, or email not set');
            return;
        }

        const logPayload = [
            {
                level: logData.level.toLowerCase(),
                job: logData.slug,
                log: logData,
            },
        ];

        try {
            console.log(
                `sending log with all info: ${JSON.stringify(
                    logPayload
                )}, and endpoint: ${getLoggingEndpoint()} and auth: ${getLoggingAuth()}`
            );
            const response = await axios.post(
                getLoggingEndpoint(),
                logPayload,
                {
                    headers: {
                        Authorization: `Basic ${getLoggingAuth()}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
        } catch (error) {
            console.error('Error sending log:', error);
            throw error;
        }
    }

    public log(...data: any[]): void {
        const formattedLog = this.formatLog(LogLevel.LOG, ...data);
        console.log(formattedLog);
        this.sendLog(formattedLog);
    }

    public error(...data: any[]): void {
        const formattedLog = this.formatLog(LogLevel.ERROR, ...data);
        console.error(formattedLog);
        this.sendLog(formattedLog);
    }

    public verbose(...data: any[]): void {
        const formattedLog = this.formatLog(LogLevel.VERBOSE, ...data);
        console.log(formattedLog);
        this.sendLog(formattedLog);
    }

    public info(...data: any[]): void {
        const formattedLog = this.formatLog(LogLevel.INFO, ...data);
        console.log(formattedLog);
        this.sendLog(formattedLog);
    }
}

const getSlugForFile = (path: string): string => {
    return path.split('/').pop()?.split('.').shift() || '';
};

export interface LogData {
    requestId: string;
    TimeGenerated: string;
    level: LogLevel;
    message: string;
    slug: string;
    environment: LogEnv;
}

export enum LogEnv {
    LOCAL = 'LOCAL',
    PPE = 'PPE',
    PROD = 'PROD',
}

export enum LogLevel {
    LOG = 'LOG',
    ERROR = 'ERROR',
    VERBOSE = 'VERBOSE',
    INFO = 'INFO',
}
