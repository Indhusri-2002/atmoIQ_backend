import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

import { ConfigService } from '../config/config.service';

const configService = ConfigService.getInstance();
const emailUser = configService.get('EMAIL_USER');
const emailPass = configService.get('EMAIL_PASS');

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', // Use Gmail's SMTP server
      port: 587, // Use TLS
      secure: false, // Use false for TLS
      auth: {
        user: emailUser, // Your email
        pass: emailPass, // Use the generated App Password here
      },
    });
  }

  // Method to trigger alert
  async sendEmailAlert(
    city: string,
    value: number,
    mail: string,
    type: 'TEMP' | 'AQI',
  ) {
    this.logger.warn(
      `ALERT! ${city} temperature has exceeded threshold: ${value}°C`,
    );

    // Example email notification logic
    const mailOptions = {
      from: emailUser,
      to: mail, // Replace with the recipient's email
      subject: `Weather Alert for ${city}`,
      text:
        type === 'TEMP'
          ? `The temperature in ${city} has exceeded the threshold: ${value}°C.`
          : `The AQI in ${city} has exceeded the threshold: ${value}.`,
    };

    try {
      this.logger.log('Alert email sent successfully!');
      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      this.logger.error('Error sending alert email:', error);
    }
  }
}
