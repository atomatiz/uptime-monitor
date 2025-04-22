import * as crypto from 'crypto';

export const generateRandomSecret = async (size: any) => {
    return crypto.randomBytes(size).toString('base64');
};

export const generateOTP = (length: number): string => {
    const digits = '0123456789';
    let otp = '';

    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * digits.length)];
    }

    return otp;
};
