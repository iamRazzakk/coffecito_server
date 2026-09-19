import { randomUUID } from "crypto";
import { emailQueue } from "../config/bullMQ.config";
import { ISendEmail } from "../types/email";

const sendEmail = async (values: ISendEmail) => {
  await emailQueue.add(
    "send-email",
    {
      to: values.to,
      subject: values.subject,
      html: values.html,
    },
    {
      jobId: `email-${randomUUID()}`,
      removeOnComplete: true,
      removeOnFail: false,
    },
  );
};

export const emailHelper = {
  sendEmail,
};
