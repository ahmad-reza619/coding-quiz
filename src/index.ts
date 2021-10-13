import express, { Request, Response } from 'express';
import Discord, { Message, TextChannel  } from "discord.js";
// import cron from 'node-cron';
import { DISCORD_TOKEN, QUIZ_TOKEN } from './config/secrets';
import axios, { AxiosResponse } from 'axios';

const PORT = process.env.PORT || 5000;

const app = express();
const client = new Discord.Client();

//////////////////////////////////////////////////////////////////
//             EXPRESS SERVER SETUP FOR UPTIME ROBOT            //
//////////////////////////////////////////////////////////////////
app.use(express.urlencoded({ extended: true }));

app.use('/', (request: Request, response: Response) => {
  response.sendStatus(200);
});

//////////////////////////////////////////////////////////////////
//                    DISCORD CLIENT LISTENERS                  //
//////////////////////////////////////////////////////////////////
// Discord Events: https://discord.js.org/#/docs/main/stable/class/Client?scrollTo=e-channelCreate

client.on("ready", () => { console.log("Coding Quiz Initialized"); });

interface QuizRequest {
  apiKey: string;
  limit?: number;
}

interface QuizResponse {
  question: string;
  description: null | string;
  answers: {
    answer_a: null | string;
    answer_b: null | string;
    answer_c: null | string;
    answer_d: null | string;
    answer_e: null | string;
    answer_f: null | string;
  },
  multiple_correct_answers: boolean;
  correct_answers: {
    answer_a_correct: boolean;
    answer_b_correct: boolean;
    answer_c_correct: boolean;
    answer_d_correct: boolean;
    answer_e_correct: boolean;
    answer_f_correct: boolean;
  },
  explanation: string;
  category: string;
  difficulity: "Easy" | "Medium" | "Hard";
}

(async () => {
  const { data: [question] } = await axios.get<QuizRequest, AxiosResponse<[QuizResponse]>>('https://quizapi.io/api/v1/questions', {
    params: {
      apiKey: QUIZ_TOKEN,
      limit: 1,
    },
  });
  const channel = await client.channels.fetch('897469720381505546') as TextChannel;
  const answer = Object.entries(question.answers)
    .reduce((all: string[], current: [string, string | null]) => {
      if (!current[1]) {
        return all;
      }
      return [
        ...all,
        `${current[0].slice(7).toUpperCase()}: ${current[1]}`
      ]; 
    }, [])
  const answerStr = answer.join('\n');
  const message = await channel
    .send(
      `**Quiz Time**\n${question.question}\n\n${answerStr}`,
    ) as Message;
  
  [
    '🇦',
    '🇧',
    '🇨',
    '🇩',
    '🇪',
    '🇫',
  ].slice(0, answer.length).forEach(reaction => message.react(reaction));
})()

// cron.schedule('0 21 * * *', async () => {
// })

client.login(DISCORD_TOKEN);

app.listen(PORT, () => console.log(`Server started on port ${PORT}!`));
