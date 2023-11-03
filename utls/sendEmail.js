const nodemailer = require('nodemailer');

module.exports = class Email {
  constructor(user, url) {
    this.email = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Mohamed Nabil <${process.env.EmailSENDER}>`;
  }
  createTransport() {
    if (process.env.NODE_ENv === 'production') {
      return 1;
    }
    return nodemailer.createTransport({
      host: 'sandbox.smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: '2a91b875c98c65',
        pass: 'bcf1e837157a10',
      },
    });
  }
  async send(temp, subject) {
    //send actual email
    //1)define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
    };
    //2) transporter
    await this.newTransport().sendMail(mailOptions);
  }
  async sendWelcome() {
    await this.send('welcome', 'this is my first email ');
  }
  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'this change password mail valid for 8 min'
    );
  }
};
