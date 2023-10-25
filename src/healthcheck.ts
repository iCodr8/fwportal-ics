#!/bin/sh

import { config } from 'dotenv';
import process from 'process';

config();

export const exit = ({healthy = true} = {}) => {
    return healthy ? process.exit(0) : process.exit(1);
};

export const check = () => {
    return Promise.all([
        checkFwportalConnection(),
    ]);
};

export const checkFwportalConnection = () => {
    return new Promise<void>((resolve, reject) => {
        try {
            // TODO: Add health check
            return resolve();
        } catch (e) {
            reject();
        }
    });
};

export const handleSuccessfulConnection = (healthcheck: (healthStatus: { healthy: boolean }) => any) => {
    return () => {
        healthcheck({healthy: true});
    };
};

export const handleUnsuccessfulConnection = (healthcheck: (healthStatus: { healthy: boolean }) => any) => {
    return () => {
        healthcheck({healthy: false});
    };
};

check()
    .then(handleSuccessfulConnection(exit))
    .catch(handleUnsuccessfulConnection(exit));
