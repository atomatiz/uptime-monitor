import { DEFAULT_TIMEZONE } from '@common/constants/global.constants';
import { getYear } from '@common/utils/date.utils';
import translations from '@common/utils/translation-loader.utils';

export function websiteUpTemplate({
    url,
    totalDowntime,
}: {
    url: string;
    totalDowntime: number;
}): string {
    const downtimeMinutes = totalDowntime / (1000 * 60);
    let downtimeFormatted: string;
    if (downtimeMinutes < 1) {
        const seconds = Math.round(downtimeMinutes * 60);
        downtimeFormatted = `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
    } else if (downtimeMinutes < 60) {
        const minutes = Math.round(downtimeMinutes);
        downtimeFormatted = `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    } else {
        const hours = (downtimeMinutes / 60).toFixed(2);
        downtimeFormatted = hours === '1.00' ? '1 hour' : `${hours} hours`;
    }
    const line1 = translations['website_up'].line1.replace('{{url}}', url);
    const line2 = translations['website_up'].line2.replace(
        '{{totalDowntime}}',
        downtimeFormatted,
    );

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .header { background-color: #33ff49; padding: 10px; text-align: center; border-bottom: 1px solid #ddd; border-radius: 10px 10px 0 0; }
        .content { padding: 20px; }
        .footer { text-align: center; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Website Back Online</h2>
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
