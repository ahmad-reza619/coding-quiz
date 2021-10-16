import axios from 'axios';
import { QUIZ_TOKEN } from '../config/secrets';

export default axios.create({
    params: {
        apiKey: QUIZ_TOKEN,
    },
    baseURL: 'https://quizapi.io/api/v1',
});

export * from 'axios';