import Command from "./commandInterface";
import { CollectorFilter, Message, MessageReaction, User  } from "discord.js";
import agent, { AxiosResponse } from '../utility/agent';

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
    answer_a_correct: 'true' | 'false';
    answer_b_correct: 'true' | 'false';
    answer_c_correct: 'true' | 'false';
    answer_d_correct: 'true' | 'false';
    answer_e_correct: 'true' | 'false';
    answer_f_correct: 'true' | 'false';
  },
  explanation: string;
  category: string;
  difficulity: "Easy" | "Medium" | "Hard";
}

export class QuestionCommand implements Command {
  commandNames = ["question", "q"];

  help(commandPrefix: string): string {
    return `Use ${commandPrefix}question or ${commandPrefix}q to get a question.`;
  }

  async run(message: Message): Promise<void> {
    const { data: [question] } = await agent.get<QuizRequest, AxiosResponse<[QuizResponse]>>('/questions', {
        params: {
            limit: 1,
        },
    });
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
    const replyMessage = await message
        .reply(
        `**Quiz Time**\n${question.question}\n\n${answerStr}`,
        ) as Message;
    
    const reactId: Array<{ key: string, value: string }> = [
        { key: 'answer_a' ,value: '🇦' },
        { key: 'answer_b' ,value: '🇧' },
        { key: 'answer_c' ,value: '🇨' },
        { key: 'answer_d' ,value: '🇩' },
        { key: 'answer_e' ,value: '🇪' },
        { key: 'answer_f' ,value: '🇫' },
    ].slice(0, answer.length);

    reactId.forEach(reaction => replyMessage.react(reaction.value));

    const filterReact: CollectorFilter = (reaction: MessageReaction, user: User) => {
        return reactId.map(react => react.value).includes(reaction.emoji.name || '')
        && !user.bot
    }

    const [correctAnswer] = Object
        .entries(question.correct_answers)
        .find(([, bool]) => bool === 'true') as [string, string];

    replyMessage.awaitReactions(filterReact, { time: 15000 })
        .then(async collection => {
        if (collection.size === 0) {
            await replyMessage.channel.send('Beep bop! No one answering... :(');
            return;
        }
        const { value } = reactId.find(r => r.key === correctAnswer.slice(0, 8)) as { value: string };
        const correctCollection = collection.find(react => react.emoji.name === value);
        if (correctCollection) {
            await correctCollection.users.fetch();
            const winner = correctCollection.users.cache.filter(user => !user.bot).first();
            replyMessage.channel.send(`${winner} Correct`)
        } else {
            replyMessage.channel.send(`No one answered correctly`);

        }
        })
        .catch(console.error);
  }
}