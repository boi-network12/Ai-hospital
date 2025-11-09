declare module 'nodemailer-express-handlebars' {
  import { Transport } from 'nodemailer';
  import { CompileCallback } from 'nodemailer/lib/mailer';

  export interface NodemailerExpressHandlebarsOptions {
    viewEngine?: any;
    viewPath?: string;
    extName?: string;
  }

  export default function hbs(
    options?: NodemailerExpressHandlebarsOptions
  ): (mail: any, callback: CompileCallback) => void;
}
