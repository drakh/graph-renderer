import axios, { AxiosResponse } from 'axios';
import { GraphData } from '../../../common/types';

export const api = {
    data: {
        async load(): Promise<AxiosResponse<GraphData>> {
            return axios.get('/api/graph');
        },
    },
};
