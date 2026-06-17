// nodemailer (v7) ships no bundled types and @types/nodemailer isn't installed.
// Declare it as an untyped module so direct imports (e.g. the email diagnostic
// route) compile. The Payload email adapter uses its own typings separately.
declare module "nodemailer";
