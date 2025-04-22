import { DEFAULT_TIMEZONE } from '@common/constants/global.constants';
import { getFormattedDateTime, getYear } from '@common/utils/date.utils';
import translations from '@common/utils/translation-loader.utils';

export function hostRestartedTemplate({
    url,
    instanceId,
    updatedAt,
}: {
    url: string;
    instanceId: string;
    updatedAt: Date;
}): string {
    const line1 = translations['host_restarted'].line1
        .replace('{{instanceId}}', instanceId)
        .replace('{{url}}', url);
    const line2 = translations['host_restarted'].line2.replace(
        '{{updatedAt}}',
        getFormattedDateTime(
            updatedAt,
            process.env.TIMEZONE ?? DEFAULT_TIMEZONE,
        ),
    );

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .header { background-color: #fcff33; padding: 10px; text-align: center; border-bottom: 1px solid #ddd; border-radius: 10px 10px 0 0; }
        .content { padding: 20px; }
        .footer { text-align: center; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Host Restarted</h2>
        </div>
        <div class="content">
          <p>${line1}</p>
          <p>${line2}</p>
        </div>
        <div class="footer">
          <p>Uptime Monitor © ${getYear(new Date(), process.env.TIMEZONE ?? DEFAULT_TIMEZONE)}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
