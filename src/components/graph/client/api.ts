import axios, { AxiosResponse } from 'axios';

export const api = {
    data: {
        async load(): Promise<AxiosResponse<any>> {
            return axios.get('/api/graph');
        },
    },
};
