
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};


export const otpEmailTemplate = (otp) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Email Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px;">
            <div style="max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 10px;">
                
                <h2 style="text-align: center;">Email Verification</h2>

                <p>Hello,</p>

                <p>Your OTP for email verification is:</p>

                <h1 style="text-align: center; letter-spacing: 8px;">
                    ${otp}
                </h1>

                <p>This OTP is valid for <strong>10 minutes</strong>.</p>

                <p>taha you bloody fool, you can safely ignore this email.</p>

                <p>Thanks,<br>Your App Team</p>

            </div>
        </body>
        </html>
    `;
};

