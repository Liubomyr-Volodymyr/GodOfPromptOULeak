import { SendMailDto } from './dto';

export interface IMailer {
	sendMail(sendMailDto: SendMailDto): Promise<boolean>;
}
